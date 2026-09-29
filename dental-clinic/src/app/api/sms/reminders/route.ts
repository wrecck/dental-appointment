import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || appointmentIds.length === 0) {
      return NextResponse.json(
        { error: "Appointment IDs are required" },
        { status: 400 }
      );
    }

    // Get appointments with patient info
    const appointments = await prisma.appointment.findMany({
      where: {
        id: { in: appointmentIds },
        clinicId: session.user.clinicId,
        smsReminder: true,
        smsSent: false,
      },
      include: {
        patient: true,
      },
    });

    // Send reminders
    const results = [];
    for (const apt of appointments) {
      const message = `Hi ${apt.patient.firstName}, this is a reminder about your dental appointment on ${format(
        new Date(apt.date),
        "MMMM d, yyyy"
      )} at ${apt.startTime}. Please reply YES to confirm or call us to reschedule.`;

      // Simulated SMS sending
      console.log(`[SMS Reminder] To: ${apt.patient.phone}, Message: ${message}`);

      // Mark as sent
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { smsSent: true },
      });

      results.push({
        appointmentId: apt.id,
        patientPhone: apt.patient.phone,
        status: "sent",
      });
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error) {
    console.error("Failed to send reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
