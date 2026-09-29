import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

async function getDashboardStats(clinicId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    todayAppointments,
    monthlyRevenue,
    pendingAppointments,
    upcomingAppointments,
    recentPatients,
  ] = await Promise.all([
    prisma.patient.count({ where: { clinicId } }),
    prisma.appointment.count({
      where: {
        clinicId,
        date: { gte: today, lt: tomorrow },
      },
    }),
    prisma.payment.aggregate({
      where: {
        clinicId,
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        status: { in: ["scheduled", "confirmed"] },
        date: { gte: today },
      },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId,
        date: { gte: today },
        status: { in: ["scheduled", "confirmed"] },
      },
      include: {
        patient: true,
        dentist: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    prisma.patient.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalPatients,
    todayAppointments,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    pendingAppointments,
    upcomingAppointments,
    recentPatients,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) {
    return null;
  }

  const stats = await getDashboardStats(clinicId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/patients/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </Link>
          <Link href="/dashboard/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Appointments
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.monthlyRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming appointments
              </p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {apt.patient.firstName[0]}
                          {apt.patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {apt.patient.firstName} {apt.patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.date), "MMM d")} at {apt.startTime}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {apt.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Patients</CardTitle>
            <Link href="/dashboard/patients">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No patients yet
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/dashboard/patients/${patient.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {patient.firstName[0]}
                          {patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.phone}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/dashboard/patients/new">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-center">Add Patient</span>
              </div>
            </Link>
            <Link href="/dashboard/appointments/new">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-center">Book Appointment</span>
              </div>
            </Link>
            <Link href="/dashboard/payments/new">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-center">Record Payment</span>
              </div>
            </Link>
            <Link href="/dashboard/prescriptions/new">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">New Prescription</span>
              </div>
            </Link>
            <Link href="/dashboard/expenses/new">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-center">Add Expense</span>
              </div>
            </Link>
            <Link href="/dashboard/sms">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-center">Send SMS</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
