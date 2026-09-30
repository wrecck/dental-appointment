"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Palette,
  Image as ImageIcon,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { DEFAULT_BOOKING_ACCENT } from "@/lib/booking-brand";

interface EmbedSettings {
  bookingSlug: string;
  bookingEnabled: boolean;
  bookingAccentColor: string;
  bookingLogo: string;
  bookingCustomCss: string;
  bookingUrl: string;
  embedCode: string;
  clinicName: string;
}

const PRESET_COLORS = [
  "#0d7377",
  "#0f766e",
  "#1d4ed8",
  "#7c3aed",
  "#be123c",
  "#c2410c",
  "#0f172a",
];

export default function BookingEmbedPage() {
  const [settings, setSettings] = useState<EmbedSettings | null>(null);
  const [slugDraft, setSlugDraft] = useState("");
  const [accentDraft, setAccentDraft] = useState(DEFAULT_BOOKING_ACCENT);
  const [cssDraft, setCssDraft] = useState("");
  const [logoDraft, setLogoDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<"url" | "embed" | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  function withCurrentOrigin(data: EmbedSettings): EmbedSettings {
    const origin = window.location.origin;
    const bookingUrl = `${origin}/book/${data.bookingSlug}`;
    return {
      ...data,
      bookingUrl,
      embedCode: `<iframe src="${bookingUrl}" title="Book an appointment" width="100%" height="820" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`,
    };
  }

  function applyLocal(data: EmbedSettings) {
    const localized = withCurrentOrigin(data);
    setSettings(localized);
    setSlugDraft(localized.bookingSlug || "");
    setAccentDraft(localized.bookingAccentColor || DEFAULT_BOOKING_ACCENT);
    setCssDraft(localized.bookingCustomCss || "");
    setLogoDraft(localized.bookingLogo || "");
  }

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/booking-embed");
      if (!res.ok) throw new Error("Failed to load");
      applyLocal(await res.json());
    } catch {
      toast.error("Failed to load booking embed settings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(patch: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/booking-embed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      applyLocal(data);
      setPreviewKey((k) => k + 1);
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

  function onLogoSelected(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 500_000) {
      toast.error("Logo must be under 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoDraft(result);
    };
    reader.readAsDataURL(file);
  }

  const brandingDirty = useMemo(() => {
    if (!settings) return false;
    return (
      accentDraft !== (settings.bookingAccentColor || DEFAULT_BOOKING_ACCENT) ||
      cssDraft !== (settings.bookingCustomCss || "") ||
      logoDraft !== (settings.bookingLogo || "")
    );
  }, [settings, accentDraft, cssDraft, logoDraft]);

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
          Share a booking link, customize the form look, and paste an iframe on your website.
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette weight="duotone" className="h-5 w-5 text-teal-700" />
            Form look & design
          </CardTitle>
          <CardDescription>
            Optional branding for the public booking form. Changes apply after you save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Accent color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentDraft}
                  onChange={(e) => setAccentDraft(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-black/10 bg-transparent p-1"
                />
                <Input
                  value={accentDraft}
                  onChange={(e) => setAccentDraft(e.target.value)}
                  placeholder="#0d7377"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setAccentDraft(color)}
                    className="h-7 w-7 rounded-full border border-black/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Logo (optional)</Label>
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 rounded-xl border border-dashed border-black/15 bg-white flex items-center justify-center overflow-hidden">
                  {logoDraft ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoDraft} alt="Logo preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    onChange={(e) => onLogoSelected(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or SVG. Max 500KB.</p>
                  {logoDraft && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoDraft("")}
                    >
                      <Trash className="mr-1.5 h-3.5 w-3.5" />
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customCss">Custom CSS (optional)</Label>
            <Textarea
              id="customCss"
              value={cssDraft}
              onChange={(e) => setCssDraft(e.target.value)}
              rows={6}
              placeholder={`.booking-title { letter-spacing: -0.02em; }\n.booking-card { box-shadow: none; }\n.booking-submit { border-radius: 999px; }`}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Useful selectors: <code>.booking-root</code>, <code>.booking-title</code>,{" "}
              <code>.booking-card</code>, <code>.booking-submit</code>, <code>.booking-logo</code>,{" "}
              <code>.booking-slot</code>
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isSaving || !brandingDirty}
              className="bg-teal-800 hover:bg-teal-700"
              onClick={() =>
                save({
                  bookingAccentColor: accentDraft,
                  bookingCustomCss: cssDraft,
                  bookingLogo: logoDraft,
                })
              }
            >
              {isSaving && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
              Save design
            </Button>
          </div>
        </CardContent>
      </Card>

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
            This is how the form will look when embedded. Refresh after saving design.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:px-6 sm:pb-6">
          {settings.bookingEnabled ? (
            <iframe
              key={previewKey}
              src={settings.bookingUrl}
              title="Booking preview"
              className="w-full h-[780px] rounded-xl border border-black/5 bg-white"
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
