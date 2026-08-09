export const SUBSCRIBE_DESCRIPTION_MARKER = "https://www.youtube.com/channel/UCkbrlVKUj1hjQ9Bat0CvJLQ?sub_confirmation=1";

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export function normalizeCatalogDescription(value: string): string {
  const original = normalizeWhitespace(value);
  const markerIndex = value.indexOf(SUBSCRIBE_DESCRIPTION_MARKER);
  if (markerIndex < 0) return original;

  const descriptionStart = markerIndex + SUBSCRIBE_DESCRIPTION_MARKER.length;
  const footerIndex = value.indexOf("***", descriptionStart);
  if (footerIndex < 0) return original;

  const extracted = normalizeWhitespace(value.slice(descriptionStart, footerIndex));
  return extracted || original;
}
