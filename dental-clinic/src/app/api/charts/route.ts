import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const charts = await prisma.dentalChart.findMany({
      where: {
        clinicId: session.user.clinicId,
        patientId,
      },
      orderBy: { toothNumber: "asc" },
    });

    return NextResponse.json(
      charts.map((c) => ({
        toothNumber: c.toothNumber,
        condition: c.condition,
        surface: c.surface,
        notes: c.notes,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch dental charts:", error);
    return NextResponse.json(
      { error: "Failed to fetch dental charts" },
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
    const { patientId, chartData } = body;

    if (!patientId || !chartData) {
      return NextResponse.json(
        { error: "Patient ID and chart data required" },
        { status: 400 }
      );
    }

    // Delete existing chart data for this patient
    await prisma.dentalChart.deleteMany({
      where: {
        clinicId: session.user.clinicId,
        patientId,
      },
    });

    // Create new chart entries
    if (chartData.length > 0) {
      await prisma.dentalChart.createMany({
        data: chartData.map((tooth: { toothNumber: number; condition: string; surface?: string; notes?: string }) => ({
          toothNumber: tooth.toothNumber,
          condition: tooth.condition,
          surface: tooth.surface || null,
          notes: tooth.notes || null,
          patientId,
          dentistId: session.user.id,
          clinicId: session.user.clinicId,
        })),
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to save dental chart:", error);
    return NextResponse.json(
      { error: "Failed to save dental chart" },
      { status: 500 }
    );
  }
}
