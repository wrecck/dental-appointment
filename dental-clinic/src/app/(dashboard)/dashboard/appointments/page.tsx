import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

async function getAppointments(clinicId: string, month: Date) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));

  return prisma.appointment.findMany({
    where: {
      clinicId,
      date: { gte: start, lte: end },
    },
    include: {
      patient: true,
      dentist: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

async function getTodayAppointments(clinicId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.appointment.findMany({
    where: {
      clinicId,
      date: { gte: today, lt: tomorrow },
    },
    include: {
      patient: true,
      dentist: true,
    },
    orderBy: { startTime: "asc" },
  });
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  "no-show": "bg-orange-100 text-orange-700",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  const params = await searchParams;

  if (!clinicId) return null;

  const currentMonth = params.month ? new Date(params.month) : new Date();
  const [appointments, todayAppointments] = await Promise.all([
    getAppointments(clinicId, currentMonth),
    getTodayAppointments(clinicId),
  ]);

  const prevMonth = format(subMonths(currentMonth, 1), "yyyy-MM");
  const nextMonth = format(addMonths(currentMonth, 1), "yyyy-MM");

  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, typeof appointments>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your clinic&apos;s schedule
          </p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-2">
              <Link href={`/dashboard/appointments?month=${prevMonth}`}>
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/dashboard/appointments?month=${nextMonth}`}>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 42 }).map((_, i) => {
                const startDate = startOfWeek(startOfMonth(currentMonth));
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateKey = format(date, "yyyy-MM-dd");
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                return (
                  <div
                    key={i}
                    className={`bg-white p-2 min-h-[100px] ${
                      !isCurrentMonth ? "opacity-50" : ""
                    }`}
                  >
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isToday
                          ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                          : ""
                      }`}
                    >
                      {format(date, "d")}
                    </p>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <Link
                          key={apt.id}
                          href={`/dashboard/appointments/${apt.id}`}
                          className={`block text-xs p-1 rounded truncate ${statusColors[apt.status]}`}
                        >
                          {apt.startTime} {apt.patient.firstName}
                        </Link>
                      ))}
                      {dayAppointments.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No appointments today
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/dashboard/appointments/${apt.id}`}
                    className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {apt.startTime} - {apt.endTime}
                      </span>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusColors[apt.status]}`}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">
                          {apt.patient.firstName[0]}
                          {apt.patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {apt.patient.firstName} {apt.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {apt.type} • Dr. {apt.dentist.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Appointments This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No appointments this month
            </p>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <Link
                  key={apt.id}
                  href={`/dashboard/appointments/${apt.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold">
                        {format(new Date(apt.date), "d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.date), "EEE")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {apt.startTime} - {apt.endTime} • {apt.type} • Dr. {apt.dentist.name}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${statusColors[apt.status]}`}
                  >
                    {apt.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
