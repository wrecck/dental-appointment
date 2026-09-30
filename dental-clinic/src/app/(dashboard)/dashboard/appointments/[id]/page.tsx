"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  User,
  Phone,
  NoteBlank,
  SpinnerGap,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface AppointmentDetail {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes: string | null;
  smsReminder: boolean;
  smsSent: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  dentist: {
    id: string;
    name: string;
  };
}

const statusOptions = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
];

const statusColors: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-800",
  confirmed: "bg-teal-100 text-teal-800",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  "no-show": "bg-amber-100 text-amber-800",
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        if (!res.ok) {
          setAppointment(null);
          return;
        }
        const data = await res.json();
        setAppointment(data);
        setStatus(data.status);
        setNotes(data.notes || "");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function saveChanges() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      const updated = await res.json();
      setAppointment(updated);
      toast.success("Appointment updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAppointment() {
    if (!confirm("Delete this appointment?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Appointment deleted");
      router.push("/dashboard/appointments");
    } catch {
      toast.error("Failed to delete appointment");
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SpinnerGap className="h-7 w-7 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/appointments">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to appointments
          </Button>
        </Link>
        <p className="text-muted-foreground">Appointment not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-3xl tracking-tight">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </h1>
            <p className="text-muted-foreground mt-1 capitalize">
              {appointment.type} with Dr. {appointment.dentist.name}
            </p>
          </div>
        </div>
        <Badge className={`capitalize ${statusColors[appointment.status] || ""}`}>
          {appointment.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarBlank weight="duotone" className="h-5 w-5 text-teal-700" />
              When
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarBlank className="h-4 w-4 text-muted-foreground" />
              {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {appointment.startTime} – {appointment.endTime}
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User weight="duotone" className="h-5 w-5 text-teal-700" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link
              href={`/dashboard/patients/${appointment.patient.id}`}
              className="font-medium text-teal-800 hover:underline"
            >
              {appointment.patient.firstName} {appointment.patient.lastName}
            </Link>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {appointment.patient.phone}
            </div>
            {appointment.patient.email && (
              <p className="text-muted-foreground">{appointment.patient.email}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <NoteBlank weight="duotone" className="h-5 w-5 text-teal-700" />
            Update appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={saveChanges}
              disabled={isSaving}
              className="bg-teal-800 hover:bg-teal-700"
            >
              {isSaving && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
            <Button
              variant="outline"
              onClick={deleteAppointment}
              disabled={isSaving}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
