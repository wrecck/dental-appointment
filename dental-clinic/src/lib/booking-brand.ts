const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MAX_LOGO_CHARS = 800_000; // ~600KB binary as base64
const MAX_CSS_CHARS = 20_000;

export const DEFAULT_BOOKING_ACCENT = "#0d7377";

export function normalizeAccentColor(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value) return DEFAULT_BOOKING_ACCENT;
  if (!HEX_COLOR.test(value)) return null;
  return value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
    : value.toLowerCase();
}

export function sanitizeCustomCss(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.length > MAX_CSS_CHARS) {
    throw new Error(`Custom CSS must be under ${MAX_CSS_CHARS} characters`);
  }
  // Block obvious breakouts
  if (/<\/style/i.test(trimmed) || /<script/i.test(trimmed) || /expression\s*\(/i.test(trimmed)) {
    throw new Error("Custom CSS contains disallowed content");
  }
  return trimmed;
}

export function sanitizeLogoDataUrl(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value) return "";
  if (value.length > MAX_LOGO_CHARS) {
    throw new Error("Logo is too large. Use an image under ~500KB.");
  }
  if (!/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(value)) {
    throw new Error("Logo must be a PNG, JPG, WEBP, GIF, or SVG image");
  }
  return value;
}

export function accentToSoftBackground(hex: string): string {
  const normalized = normalizeAccentColor(hex) || DEFAULT_BOOKING_ACCENT;
  const raw = normalized.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.10)`;
}
