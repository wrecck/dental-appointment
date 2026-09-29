import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Pill,
  Edit,
  FileDown,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

async function getPatient(id: string, clinicId: string) {
  return prisma.patient.findFirst({
    where: { id, clinicId },
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
      prescriptions: {
        include: { dentist: true },
        orderBy: { date: "desc" },
        take: 10,
      },
      images: {
        orderBy: { createdAt: "desc" },
      },
      dentalCharts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export default async function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  const { id } = await params;

  if (!clinicId) return null;

  const patient = await getPatient(id, clinicId);

  if (!patient) {
    notFound();
  }

  const totalSpent = patient.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </span>
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/dashboard/patients/${patient.id}/pdf`}>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>
          <Link href={`/dashboard/patients/${patient.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/appointments/new?patientId=${patient.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.appointments.length}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.treatments.length}</p>
                <p className="text-sm text-muted-foreground">Treatments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Pill className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patient.prescriptions.length}</p>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {patient.dateOfBirth
                        ? format(new Date(patient.dateOfBirth), "MMMM d, yyyy")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{patient.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{patient.occupation || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patient Since</p>
                    <p className="font-medium">
                      {format(new Date(patient.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {patient.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      {patient.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.emergencyName || patient.emergencyPhone ? (
                  <div className="space-y-2">
                    <p className="font-medium">{patient.emergencyName || "-"}</p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {patient.emergencyPhone || "-"}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contact on file</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Allergies</p>
                  <p className={patient.allergies ? "text-red-600 font-medium" : "text-muted-foreground"}>
                    {patient.allergies || "No known allergies"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Medical History</p>
                  <p>{patient.medicalHistory || "No medical history recorded"}</p>
                </div>
                {patient.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p>{patient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Appointment History</CardTitle>
              <Link href={`/dashboard/appointments/new?patientId=${patient.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No appointments yet
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {format(new Date(apt.date), "d")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.date), "MMM yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{apt.startTime} - {apt.endTime}</p>
                          <p className="text-sm text-muted-foreground">
                            Dr. {apt.dentist.name} • {apt.type}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          apt.status === "completed"
                            ? "default"
                            : apt.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.treatments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No treatments recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{treatment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {treatment.date
                            ? format(new Date(treatment.date), "MMM d, yyyy")
                            : "Not scheduled"}{" "}
                          • Dr. {treatment.dentist.name}
                          {treatment.toothNumber && ` • Tooth #${treatment.toothNumber}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${treatment.cost}</p>
                        <Badge variant="outline" className="capitalize">
                          {treatment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Link href={`/dashboard/payments/new?patientId=${patient.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payments recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(payment.date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {payment.method} • {payment.description || "Payment"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +${payment.amount.toLocaleString()}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prescriptions</CardTitle>
              <Link href={`/dashboard/prescriptions/new?patientId=${patient.id}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Prescription
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {patient.prescriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No prescriptions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">
                          {format(new Date(rx.date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {rx.dentist.name}
                        </p>
                      </div>
                      <p className="text-sm">{rx.medications}</p>
                      {rx.diagnosis && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Diagnosis: {rx.diagnosis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
