"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Copy,
  ArrowSquareOut,
  Code,
  LinkSimple,
  SpinnerGap,
  ToggleLeft,
  ToggleRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface EmbedSettings {
  bookingSlug: string;
  bookingEnabled: boolean;
  bookingUrl: string;
  embedCode: string;
  clinicName: string;
}

export default function BookingEmbedPage() {
  const [settings, setSettings] = useState<EmbedSettings | null>(null);
  const [slugDraft, setSlugDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<"url" | "embed" | null>(null);

  function withCurrentOrigin(data: EmbedSettings): EmbedSettings {
    const origin = window.location.origin;
    const bookingUrl = `${origin}/book/${data.bookingSlug}`;
    return {
      ...data,
      bookingUrl,
      embedCode: `<iframe src="${bookingUrl}" title="Book an appointment" width="100%" height="760" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`,
    };
  }

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/booking-embed");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const localized = withCurrentOrigin(data);
      setSettings(localized);
      setSlugDraft(localized.bookingSlug || "");
    } catch {
      toast.error("Failed to load booking embed settings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(patch: Partial<{ bookingSlug: string; bookingEnabled: boolean }>) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/booking-embed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      const localized = withCurrentOrigin(data);
      setSettings(localized);
      setSlugDraft(localized.bookingSlug || "");
      toast.success("Booking settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function copy(text: string, kind: "url" | "embed") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    toast.success(kind === "url" ? "Link copied" : "Embed code copied");
    setTimeout(() => setCopied(null), 1600);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SpinnerGap className="h-7 w-7 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-muted-foreground">Unable to load booking settings.</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Booking embed</h1>
        <p className="text-muted-foreground mt-1">
          Share a booking link or paste an iframe on your clinic website.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkSimple weight="duotone" className="h-5 w-5 text-teal-700" />
              Public booking link
            </CardTitle>
            <CardDescription>
              Patients can open this page directly to request an appointment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={settings.bookingUrl} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                onClick={() => copy(settings.bookingUrl, "url")}
              >
                {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.open(settings.bookingUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ArrowSquareOut className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="px-0 h-auto text-teal-800"
              disabled={isSaving}
              onClick={() => save({ bookingEnabled: !settings.bookingEnabled })}
            >
              {settings.bookingEnabled ? (
                <ToggleRight weight="fill" className="mr-2 h-5 w-5 text-teal-700" />
              ) : (
                <ToggleLeft weight="fill" className="mr-2 h-5 w-5 text-muted-foreground" />
              )}
              Booking form is {settings.bookingEnabled ? "enabled" : "disabled"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Customize link slug</CardTitle>
            <CardDescription>
              Change the short name in your booking URL. Owner only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                  placeholder="happy-smile-dental"
                />
                <Button
                  type="button"
                  disabled={isSaving || !slugDraft || slugDraft === settings.bookingSlug}
                  onClick={() => save({ bookingSlug: slugDraft })}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-black/5 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code weight="duotone" className="h-5 w-5 text-teal-700" />
              Embed code
            </CardTitle>
            <CardDescription>
              Paste this iframe into your website HTML where you want the booking form.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => copy(settings.embedCode, "embed")}>
            {copied === "embed" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy code
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 text-slate-100 text-xs leading-relaxed p-4">
            {settings.embedCode}
          </pre>
        </CardContent>
      </Card>

      <Card className="border-black/5 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Live preview</CardTitle>
          <CardDescription>
            This is how the form will look when embedded.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {settings.bookingEnabled ? (
            <iframe
              src={settings.bookingUrl}
              title="Booking preview"
              className="w-full h-[720px] rounded-xl border border-black/5 bg-white"
            />
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              Enable booking to preview the form.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
