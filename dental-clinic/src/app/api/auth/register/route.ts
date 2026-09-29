import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clinicName, clinicEmail, clinicPhone, ownerName, ownerEmail, password } = body;

    // Validate required fields
    if (!clinicName || !clinicEmail || !ownerName || !ownerEmail || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if clinic email already exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { email: clinicEmail },
    });

    if (existingClinic) {
      return NextResponse.json(
        { error: "A clinic with this email already exists" },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create clinic and owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          email: clinicEmail,
          phone: clinicPhone || null,
        },
      });

      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          password: hashedPassword,
          name: ownerName,
          role: "owner",
          clinicId: clinic.id,
        },
      });

      return { clinic, user };
    });

    return NextResponse.json(
      { 
        message: "Clinic registered successfully",
        clinicId: result.clinic.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
