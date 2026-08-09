import type { HistoryImportAdapter, ImportedWatchRecord } from "../types";
import { extractYouTubeVideoId } from "../youtube-id";
import { readFileText } from "../file-io";

const MAX_TEXT_BYTES = 128 * 1024 * 1024;
const WATCHED_CONTEXT = /\bwatched\b|\bassistiu\b/i;

export function parseHtmlActivityText(text: string): ImportedWatchRecord[] {
  const document = new DOMParser().parseFromString(text, "text/html");
  const records: ImportedWatchRecord[] = [];
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const url = anchor.href;
    if (!extractYouTubeVideoId(url)) continue;
    let context: Element | null = anchor;
    let contextText = "";
    let matchedContext: Element | null = null;
    for (let depth = 0; depth < 5 && context && !["BODY", "HTML"].includes(context.tagName); depth += 1) {
      contextText = context.textContent ?? "";
      if (WATCHED_CONTEXT.test(contextText)) { matchedContext = context; break; }
      context = context.parentElement;
    }
    if (!matchedContext) continue;
    const timeElement = matchedContext.querySelector("time[datetime]");
    records.push({
      title: contextText.match(WATCHED_CONTEXT)?.[0] ?? "",
      url,
      ...(timeElement?.getAttribute("datetime") ? { time: timeElement.getAttribute("datetime")! } : {}),
      products: ["YouTube"],
    });
  }
  return records;
}

export const htmlActivityAdapter: HistoryImportAdapter = {
  async canHandle(file) {
    return /\.html?$/i.test(file.name) || file.type.includes("html");
  },
  async parse(file) {
    if (file.size > MAX_TEXT_BYTES) throw new Error("This HTML file is too large to process safely.");
    return parseHtmlActivityText(await readFileText(file));
  },
};
