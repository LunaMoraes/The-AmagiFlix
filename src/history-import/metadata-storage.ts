import { HISTORY_IMPORT_KEY } from "../config/app";
import type { HistoryImportMetadata } from "../types/library";

export function loadHistoryImportMetadata(): HistoryImportMetadata | undefined {
  try {
    const value = localStorage.getItem(HISTORY_IMPORT_KEY);
    if (!value) return undefined;
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed.completed === true && typeof parsed.completedAt === "string" && typeof parsed.matchedCount === "number"
      ? parsed as unknown as HistoryImportMetadata : undefined;
  } catch { return undefined; }
}

export function saveHistoryImportMetadata(metadata: HistoryImportMetadata): boolean {
  try { localStorage.setItem(HISTORY_IMPORT_KEY, JSON.stringify(metadata)); return true; } catch { return false; }
}

export function removeHistoryImportMetadata(): boolean {
  try { localStorage.removeItem(HISTORY_IMPORT_KEY); return true; } catch { return false; }
}
