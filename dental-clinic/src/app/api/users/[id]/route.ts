import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const isOwner = session.user.role === "owner";
    const isSelf = session.user.id === id;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    // Only owners can change email/role/active for others; owners can edit their own name only for account fields below
    if (isOwner) {
      if (typeof body.email === "string" && body.email.trim()) {
        const email = body.email.trim().toLowerCase();
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id } },
        });
        if (existing) {
          return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 400 }
          );
        }
        data.email = email;
      }

      if (user.role !== "owner") {
        if (typeof body.role === "string" && ["dentist", "receptionist", "assistant"].includes(body.role)) {
          data.role = body.role;
        }
        if (typeof body.isActive === "boolean") {
          data.isActive = body.isActive;
        }
      } else if (typeof body.isActive === "boolean" && body.isActive === false) {
        return NextResponse.json(
          { error: "Cannot deactivate the owner account" },
          { status: 400 }
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
