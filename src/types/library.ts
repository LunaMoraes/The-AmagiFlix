export type WatchSource = "extension" | "history-import" | "manual" | "v1";

export interface MeasuredProgress {
  currentSeconds: number;
  durationSeconds: number;
  measuredAt: string;
}

export interface ImportedWatchState {
  videoId: string;
  watched: true;
  firstKnownWatchedAt?: string;
  lastKnownWatchedAt?: string;
  importCount: number;
  importedAt: string;
}

export interface ManualWatchDecision {
  watched: boolean;
  changedAt: string;
}

export interface ExtensionVideoState {
  videoId: string;
  started: boolean;
  watched: boolean;
  progress?: MeasuredProgress;
  firstStartedAt?: string;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  lastObservedAt?: string;
  sources: WatchSource[];
  manualDecision?: ManualWatchDecision;
  historyImport?: ImportedWatchState;
}

export interface ExtensionStoreV1 {
  schemaVersion: 1;
  videos: Record<string, ExtensionVideoState>;
  catalog?: {
    videoIds: string[];
    fetchedAt: string;
    catalogGeneratedAt?: string;
    schemaVersion: 1;
  };
}

export interface WebVideoState {
  startedAt?: string;
  lastOpenedAt?: string;
  inMyList: boolean;
  manualDecision?: ManualWatchDecision;
  historyImport?: ImportedWatchState;
  extension?: ExtensionVideoState;
}

export interface WebLibraryV2 {
  schemaVersion: 2;
  videos: Record<string, WebVideoState>;
  shows: Record<string, WebShowState>;
}

export interface WebShowState {
  inMyList: boolean;
}

export type LocalLibrary = WebLibraryV2;

export interface ResolvedVideoState extends WebVideoState {
  started: boolean;
  watched: boolean;
  watchedAt?: string;
  progress?: MeasuredProgress;
  sources: WatchSource[];
}

export interface ResolvedShowState {
  inMyList: boolean;
  started: boolean;
  watched: boolean;
  watchedAt?: string;
  progress?: MeasuredProgress;
  sources: WatchSource[];
  resumeVideoId: string;
}

export type ResolvedTitleState = ResolvedVideoState | ResolvedShowState;

export interface HistoryImportMetadata {
  completed: true;
  completedAt: string;
  matchedCount: number;
}
