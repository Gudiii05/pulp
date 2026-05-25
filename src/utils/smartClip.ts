/**
 * Detect when a clip's content is a single URL (not text with a URL inside).
 * Returns the URL string, or null.
 */
export function detectUrl(content: string): string | null {
  const trimmed = content.trim();
  if (/^https?:\/\/[^\s<>"']+$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_RE =
  /^rgba?\(\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*(?:,\s*[\d.]+\s*)?\)$/i;
const RGB_NEW_RE =
  /^rgba?\(\s*\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*(?:\/\s*[\d.]+%?\s*)?\)$/i;
const HSL_RE =
  /^hsla?\(\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%?\s*,\s*\d+(?:\.\d+)?%?\s*(?:,\s*[\d.]+\s*)?\)$/i;

/**
 * Detect when a clip's content is a single CSS color.
 * Returns a CSS-valid color string for previewing, or null.
 */
export function detectColor(content: string): string | null {
  const trimmed = content.trim();
  if (HEX_RE.test(trimmed)) {
    return trimmed.startsWith("#") ? trimmed : "#" + trimmed;
  }
  if (RGB_RE.test(trimmed) || RGB_NEW_RE.test(trimmed) || HSL_RE.test(trimmed)) {
    return trimmed;
  }
  return null;
}
