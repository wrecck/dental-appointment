import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { clinicId: session.user.clinicId },
      include: { patient: true, dentist: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Failed to fetch prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, medications, diagnosis, instructions, validUntil } = body;

    if (!patientId || !medications) {
      return NextResponse.json(
        { error: "Patient and medications are required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        dentistId: session.user.id,
        medications,
        diagnosis,
        instructions,
        validUntil: validUntil ? new Date(validUntil) : null,
        clinicId: session.user.clinicId,
      },
      include: { patient: true, dentist: true },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Failed to create prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
