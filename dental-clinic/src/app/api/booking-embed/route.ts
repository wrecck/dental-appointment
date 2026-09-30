import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify, uniqueClinicSlug } from "@/lib/slug";
import {
  DEFAULT_BOOKING_ACCENT,
  normalizeAccentColor,
  sanitizeCustomCss,
  sanitizeLogoDataUrl,
} from "@/lib/booking-brand";

async function ensureClinicSlug(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return null;

  if (clinic.bookingSlug) return clinic;

  const bookingSlug = await uniqueClinicSlug(clinic.name, async (slug) => {
    const found = await prisma.clinic.findUnique({ where: { bookingSlug: slug } });
    return Boolean(found);
  });

  return prisma.clinic.update({
    where: { id: clinicId },
    data: { bookingSlug },
  });
}

function toResponse(clinic: {
  bookingSlug: string | null;
  bookingEnabled: boolean;
  bookingAccentColor: string | null;
  bookingLogo: string | null;
  bookingCustomCss: string | null;
  name: string;
}) {
  const origin =
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const bookingUrl = `${origin.replace(/\/$/, "")}/book/${clinic.bookingSlug}`;
  const embedCode = `<iframe src="${bookingUrl}" title="Book an appointment" width="100%" height="820" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`;

  return {
    bookingSlug: clinic.bookingSlug,
    bookingEnabled: clinic.bookingEnabled,
    bookingAccentColor: clinic.bookingAccentColor || DEFAULT_BOOKING_ACCENT,
    bookingLogo: clinic.bookingLogo || "",
    bookingCustomCss: clinic.bookingCustomCss || "",
    bookingUrl,
    embedCode,
    clinicName: clinic.name,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinic = await ensureClinicSlug(session.user.clinicId);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json(toResponse(clinic));
  } catch (error) {
    console.error("Booking embed GET error:", error);
    return NextResponse.json({ error: "Failed to load embed settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can update booking settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const bookingEnabled =
      typeof body.bookingEnabled === "boolean" ? body.bookingEnabled : undefined;
    let bookingSlug =
      typeof body.bookingSlug === "string" ? slugify(body.bookingSlug) : undefined;

    if (bookingSlug !== undefined) {
      if (!bookingSlug) {
        return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
      }
      const taken = await prisma.clinic.findFirst({
        where: {
          bookingSlug,
          NOT: { id: session.user.clinicId },
        },
      });
      if (taken) {
        return NextResponse.json(
          { error: "That booking link is already taken" },
          { status: 400 }
        );
      }
    }

    let bookingAccentColor: string | undefined;
    if ("bookingAccentColor" in body) {
      const color = normalizeAccentColor(body.bookingAccentColor);
      if (!color) {
        return NextResponse.json(
          { error: "Accent color must be a valid hex value like #0d7377" },
          { status: 400 }
        );
      }
      bookingAccentColor = color;
    }

    let bookingCustomCss: string | undefined;
    if ("bookingCustomCss" in body) {
      try {
        bookingCustomCss = sanitizeCustomCss(body.bookingCustomCss) ?? "";
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid CSS" },
          { status: 400 }
        );
      }
    }

    let bookingLogo: string | undefined;
    if ("bookingLogo" in body) {
      try {
        bookingLogo = sanitizeLogoDataUrl(body.bookingLogo) ?? "";
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid logo" },
          { status: 400 }
        );
      }
    }

    const clinic = await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: {
        ...(bookingEnabled !== undefined ? { bookingEnabled } : {}),
        ...(bookingSlug !== undefined ? { bookingSlug } : {}),
        ...(bookingAccentColor !== undefined ? { bookingAccentColor } : {}),
        ...(bookingCustomCss !== undefined ? { bookingCustomCss } : {}),
        ...(bookingLogo !== undefined ? { bookingLogo: bookingLogo || null } : {}),
      },
    });

    return NextResponse.json(toResponse(clinic));
  } catch (error) {
    console.error("Booking embed PUT error:", error);
    return NextResponse.json({ error: "Failed to update booking settings" }, { status: 500 });
  }
}
