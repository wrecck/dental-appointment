import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { clinicId: session.user.clinicId },
      include: { patient: true, treatment: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, amount, method, description, date, treatmentId } = body;

    if (!patientId || !amount || !method) {
      return NextResponse.json(
        { error: "Patient, amount, and method are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        patientId,
        amount: parseFloat(amount),
        method,
        description,
        date: date ? new Date(date) : new Date(),
        treatmentId: treatmentId || null,
        clinicId: session.user.clinicId,
      },
      include: { patient: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
