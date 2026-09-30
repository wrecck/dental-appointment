import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function addThirtyMinutes(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + 30;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const clinic = await prisma.clinic.findFirst({
      where: { bookingSlug: slug, bookingEnabled: true },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        bookingSlug: true,
        users: {
          where: { isActive: true, role: { in: ["owner", "dentist"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    return NextResponse.json({
      clinic: {
        name: clinic.name,
        phone: clinic.phone,
        address: clinic.address,
        slug: clinic.bookingSlug,
      },
      dentists: clinic.users,
      slots: DEFAULT_SLOTS,
      appointmentTypes: [
        { value: "checkup", label: "Checkup" },
        { value: "cleaning", label: "Cleaning" },
        { value: "consultation", label: "Consultation" },
        { value: "treatment", label: "Treatment" },
        { value: "emergency", label: "Emergency" },
      ],
    });
  } catch (error) {
    console.error("Public booking GET error:", error);
    return NextResponse.json({ error: "Failed to load booking page" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      date,
      startTime,
      type,
      dentistId,
      notes,
    } = body;

    if (!firstName || !lastName || !phone || !date || !startTime || !type) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    const clinic = await prisma.clinic.findFirst({
      where: { bookingSlug: slug, bookingEnabled: true },
      include: {
        users: {
          where: { isActive: true, role: { in: ["owner", "dentist"] } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const dentist =
      clinic.users.find((u) => u.id === dentistId) || clinic.users[0];

    if (!dentist) {
      return NextResponse.json(
        { error: "No dentist available for booking" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    // Find or create patient by phone within this clinic
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          firstName,
          lastName,
          phone,
          email: email || null,
          clinicId: clinic.id,
          notes: "Created via online booking form",
        },
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        dentistId: dentist.id,
        date: appointmentDate,
        startTime,
        endTime: addThirtyMinutes(startTime),
        type,
        status: "scheduled",
        notes: notes || "Online booking",
        smsReminder: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        appointmentId: appointment.id,
        message: "Appointment requested successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public booking POST error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
