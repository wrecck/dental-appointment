import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pill, FileText, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

async function getPrescriptions(clinicId: string) {
  return prisma.prescription.findMany({
    where: { clinicId },
    include: {
      patient: true,
      dentist: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export default async function PrescriptionsPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) return null;

  const prescriptions = await getPrescriptions(clinicId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-muted-foreground">
            Create and manage patient prescriptions
          </p>
        </div>
        <Link href="/dashboard/prescriptions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </Link>
      </div>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No prescriptions yet</p>
              <Link href="/dashboard/prescriptions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Prescription
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Pill className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/dashboard/patients/${rx.patientId}`}
                            className="font-medium hover:underline"
                          >
                            {rx.patient.firstName} {rx.patient.lastName}
                          </Link>
                          <Badge variant="outline">
                            {format(new Date(rx.date), "MMM d, yyyy")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Prescribed by Dr. {rx.dentist.name}
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Medications:</p>
                          <p className="text-sm whitespace-pre-wrap">{rx.medications}</p>
                        </div>
                        {rx.diagnosis && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Diagnosis:</span> {rx.diagnosis}
                          </p>
                        )}
                        {rx.instructions && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Instructions:</span> {rx.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/prescriptions/${rx.id}/print`}>
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
