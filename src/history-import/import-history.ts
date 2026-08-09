import type { ImportedWatchState } from "../types/library";
import { htmlActivityAdapter } from "./adapters/html-activity";
import { jsonActivityAdapter } from "./adapters/json-activity";
import { takeoutZipAdapter } from "./adapters/takeout-zip";
import type { HistoryImportAdapter, HistoryImportResult } from "./types";
export type { HistoryImportResult } from "./types";
import { extractYouTubeVideoId, isYouTubeWatchedRecord } from "./youtube-id";

const ADAPTERS: HistoryImportAdapter[] = [takeoutZipAdapter, jsonActivityAdapter, htmlActivityAdapter];

export async function importHistory(file: File, catalogVideoIds: Set<string>, now = new Date().toISOString()): Promise<HistoryImportResult> {
  const adapter = await findAdapter(file);
  if (!adapter) throw new Error("Choose a Google/YouTube activity JSON, HTML, or ZIP export.");
  const records = await adapter.parse(file);
  if (records.length === 0) throw new Error("We couldn't find supported YouTube watch-history activity in this file.");
  const watched = records.filter(isYouTubeWatchedRecord);
  const matchedRecords = watched.filter((record) => catalogVideoIds.has(extractYouTubeVideoId(record.url)!));
  const grouped = new Map<string, { times: string[]; count: number }>();
  for (const record of matchedRecords) {
    const videoId = extractYouTubeVideoId(record.url)!;
    const current = grouped.get(videoId) ?? { times: [], count: 0 };
    current.count += 1;
    if (record.time && Number.isFinite(Date.parse(record.time))) current.times.push(new Date(record.time).toISOString());
    grouped.set(videoId, current);
  }
  const matches: ImportedWatchState[] = [...grouped].map(([videoId, value]) => ({
    videoId,
    watched: true,
    importCount: value.count,
    importedAt: now,
    ...(value.times.length ? { firstKnownWatchedAt: value.times.sort()[0], lastKnownWatchedAt: value.times.sort().at(-1) } : {}),
  }));
  return {
    recordsScanned: records.length,
    youtubeWatchedRecords: watched.length,
    matchedRecords: matchedRecords.length,
    matches,
  };
}

async function findAdapter(file: File): Promise<HistoryImportAdapter | undefined> {
  for (const adapter of ADAPTERS) if (await adapter.canHandle(file)) return adapter;
  return undefined;
}
