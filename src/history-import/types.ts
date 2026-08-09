import type { ImportedWatchState } from "../types/library";

export interface ImportedWatchRecord {
  title?: string;
  url?: string;
  time?: string;
  products?: string[];
  activityControls?: string[];
}

export interface HistoryImportAdapter {
  canHandle(file: File): Promise<boolean>;
  parse(file: File): Promise<ImportedWatchRecord[]>;
}

export interface HistoryImportResult {
  recordsScanned: number;
  youtubeWatchedRecords: number;
  matchedRecords: number;
  matches: ImportedWatchState[];
}
