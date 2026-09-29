import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        appointments: {
          include: { dentist: true },
          orderBy: { date: "desc" },
          take: 10,
        },
        treatments: {
          include: { dentist: true },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { date: "desc" },
          take: 10,
        },
        clinic: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const totalPaid = patient.payments.reduce((sum, p) => sum + p.amount, 0);

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Record - ${patient.firstName} ${patient.lastName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .clinic-info h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .clinic-info p {
      margin: 5px 0;
      color: #666;
    }
    .patient-header {
      text-align: right;
    }
    .patient-name {
      font-size: 20px;
      font-weight: bold;
      margin: 0;
    }
    .patient-id {
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 14px;
      font-weight: 500;
    }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .alert-title {
      color: #dc2626;
      font-weight: bold;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .summary-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .summary-item {
      display: inline-block;
      margin-right: 30px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-info">
      <h1>${patient.clinic.name}</h1>
      <p>${patient.clinic.email}</p>
      ${patient.clinic.phone ? `<p>${patient.clinic.phone}</p>` : ""}
    </div>
    <div class="patient-header">
      <p class="patient-name">${patient.firstName} ${patient.lastName}</p>
      <p class="patient-id">ID: ${patient.id.slice(0, 8).toUpperCase()}</p>
      <p class="patient-id">Generated: ${format(new Date(), "MMM d, yyyy")}</p>
    </div>
  </div>

  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-value">${patient.appointments.length}</div>
      <div class="summary-label">Appointments</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${patient.treatments.length}</div>
      <div class="summary-label">Treatments</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">$${totalPaid.toLocaleString()}</div>
      <div class="summary-label">Total Paid</div>
    </div>
  </div>

  ${patient.allergies ? `
  <div class="alert-box">
    <div class="alert-title">⚠️ Allergies</div>
    <div>${patient.allergies}</div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">Personal Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Full Name</div>
        <div class="info-value">${patient.firstName} ${patient.lastName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${patient.phone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${patient.email || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date of Birth</div>
        <div class="info-value">${patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMMM d, yyyy") : "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Gender</div>
        <div class="info-value" style="text-transform: capitalize">${patient.gender || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Occupation</div>
        <div class="info-value">${patient.occupation || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Address</div>
        <div class="info-value">${patient.address || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Patient Since</div>
        <div class="info-value">${format(new Date(patient.createdAt), "MMMM d, yyyy")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Emergency Contact</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Name</div>
        <div class="info-value">${patient.emergencyName || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${patient.emergencyPhone || "-"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Medical Information</div>
    <div class="info-item">
      <div class="info-label">Allergies</div>
      <div class="info-value">${patient.allergies || "No known allergies"}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Medical History</div>
      <div class="info-value">${patient.medicalHistory || "No medical history recorded"}</div>
    </div>
    ${patient.notes ? `
    <div class="info-item">
      <div class="info-label">Notes</div>
      <div class="info-value">${patient.notes}</div>
    </div>
    ` : ""}
  </div>

  ${patient.treatments.length > 0 ? `
  <div class="section">
    <div class="section-title">Treatment History</div>
    <table>
      <thead>
        <tr>
          <th>Treatment</th>
          <th>Date</th>
          <th>Dentist</th>
          <th>Status</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        ${patient.treatments.map(t => `
        <tr>
          <td>${t.name}${t.toothNumber ? ` (Tooth #${t.toothNumber})` : ""}</td>
          <td>${t.date ? format(new Date(t.date), "MMM d, yyyy") : "-"}</td>
          <td>Dr. ${t.dentist.name}</td>
          <td style="text-transform: capitalize">${t.status}</td>
          <td>$${t.cost.toLocaleString()}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${patient.appointments.length > 0 ? `
  <div class="section">
    <div class="section-title">Recent Appointments</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Type</th>
          <th>Dentist</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${patient.appointments.map(a => `
        <tr>
          <td>${format(new Date(a.date), "MMM d, yyyy")}</td>
          <td>${a.startTime} - ${a.endTime}</td>
          <td style="text-transform: capitalize">${a.type}</td>
          <td>Dr. ${a.dentist.name}</td>
          <td style="text-transform: capitalize">${a.status}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="footer">
    <p>This document was generated by ${patient.clinic.name}</p>
    <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="patient-${patient.firstName}-${patient.lastName}.html"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
