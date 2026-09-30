"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarBlank, CheckCircle, SpinnerGap } from "@phosphor-icons/react";

interface BookingData {
  clinic: { name: string; phone: string | null; address: string | null; slug: string };
  dentists: { id: string; name: string }[];
  slots: string[];
  appointmentTypes: { value: string; label: string }[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<BookingData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedType, setSelectedType] = useState("checkup");
  const [selectedDentist, setSelectedDentist] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/book/${slug}`);
        if (!res.ok) {
          setError("This booking page is unavailable.");
          return;
        }
        const json = await res.json();
        setData(json);
        if (json.dentists?.[0]) setSelectedDentist(json.dentists[0].id);
      } catch {
        setError("Failed to load booking form.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const res = await fetch(`/api/public/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          email: formData.get("email") || null,
          date: formData.get("date"),
          startTime: selectedSlot,
          type: selectedType,
          dentistId: selectedDentist || null,
          notes: formData.get("notes") || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Booking failed");
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--book-bg)]">
        <SpinnerGap className="h-8 w-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--book-bg)] p-6">
        <p className="text-muted-foreground">{error || "Not found"}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--book-bg)] p-6">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl bg-white/80 backdrop-blur border border-black/5 p-8 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
            <CheckCircle weight="duotone" className="h-8 w-8 text-teal-700" />
          </div>
          <h1 className="font-heading text-2xl tracking-tight">Booking request received</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {data.clinic.name} received your appointment request. They may contact you to confirm.
          </p>
        </div>
      </div>
    );
  }

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[var(--book-bg)] text-foreground">
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(13,115,119,0.18), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(45,212,191,0.12), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-lg px-4 py-8 sm:py-12">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-black/5 px-3 py-1 text-xs font-medium text-teal-800">
            <CalendarBlank weight="duotone" className="h-3.5 w-3.5" />
            Online booking
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">
            {data.clinic.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick a time that works — we&apos;ll take care of the rest.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white/85 backdrop-blur border border-black/5 shadow-sm p-5 sm:p-6 space-y-5"
        >
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={minDate}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visit type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => v && setSelectedType(v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.appointmentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {data.dentists.length > 1 && (
            <div className="space-y-1.5">
              <Label>Dentist</Label>
              <Select
                value={selectedDentist}
                onValueChange={(v) => v && setSelectedDentist(v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any available" />
                </SelectTrigger>
                <SelectContent>
                  {data.dentists.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Dr. {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Time</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {data.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-2 py-2 text-sm transition-colors ${
                    selectedSlot === slot
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-black/10 bg-white hover:border-teal-600/40"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Anything we should know?"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-teal-800 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? (
              <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Request appointment
          </Button>
        </form>
      </div>
    </div>
  );
}
