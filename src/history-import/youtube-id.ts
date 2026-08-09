const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoId(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) id = url.pathname.split("/")[2] ?? null;
    }
    return id && VIDEO_ID.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

const WATCH_ACTION = /^\s*(?:watched|assistiu)(?:\s|:|$)/i;
const WATCH_CONTROL = /youtube\s+watch\s+history|hist[oó]rico\s+(?:de\s+)?(?:exibi[cç][aã]o|v[ií]deos?\s+assistidos?).*youtube/i;

export function isYouTubeWatchedRecord(record: { title?: string; url?: string; activityControls?: string[] }): boolean {
  if (!extractYouTubeVideoId(record.url)) return false;
  return WATCH_ACTION.test(record.title ?? "") || (record.activityControls ?? []).some((value) => WATCH_CONTROL.test(value));
}
