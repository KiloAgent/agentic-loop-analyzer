/** Input cleaning for Loop Audit. No app imports. */

const HTML_TAG = /<[^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function stripHtml(value: string): string {
  return value.replace(HTML_TAG, " ");
}

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function collapseSpaces(value: string): string {
  return value.replace(/[ \t\f\v]+/g, " ").trim();
}

export function cleanText(value: string, maxLength: number): string {
  const cleaned = collapseSpaces(stripControlChars(stripHtml(String(value ?? ""))));
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function cleanOptionalText(value: unknown, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const cleaned = cleanText(String(value), maxLength);
  return cleaned === "" ? undefined : cleaned;
}

export function cleanStringList(value: unknown, itemMax: number, listMax: number): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return cleanStringList(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        itemMax,
        listMax,
      );
    }
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= listMax) break;
    const cleaned = cleanText(String(item ?? ""), itemMax);
    if (cleaned) out.push(cleaned);
  }
  return out;
}
