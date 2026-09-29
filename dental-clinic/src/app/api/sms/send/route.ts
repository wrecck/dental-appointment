import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientIds, message } = body;

    if (!patientIds || !message) {
      return NextResponse.json(
        { error: "Patient IDs and message are required" },
        { status: 400 }
      );
    }

    // Get patients with phone numbers
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        clinicId: session.user.clinicId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    // In a real implementation, you would integrate with an SMS provider like Twilio
    // For now, we'll just simulate sending
    const results = patients.map((patient) => {
      const personalizedMessage = message
        .replace("{name}", `${patient.firstName} ${patient.lastName}`)
        .replace("{firstName}", patient.firstName);

      // Simulated SMS sending
      console.log(`[SMS] To: ${patient.phone}, Message: ${personalizedMessage}`);

      return {
        patientId: patient.id,
        phone: patient.phone,
        status: "sent",
      };
    });

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
