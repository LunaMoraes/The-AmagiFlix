import type { ExtensionStoreV1, ExtensionVideoState, ImportedWatchState, ManualWatchDecision, MeasuredProgress } from "../../src/types/library";

const STORE_KEY = "amagiflix.extension.v1";
export const EMPTY_EXTENSION_STORE: ExtensionStoreV1 = { schemaVersion: 1, videos: {} };

export async function loadStore(): Promise<ExtensionStoreV1> {
  const value = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] as unknown;
  if (!value || typeof value !== "object") return structuredClone(EMPTY_EXTENSION_STORE);
  const store = value as ExtensionStoreV1;
  return store.schemaVersion === 1 && store.videos && typeof store.videos === "object" ? store : structuredClone(EMPTY_EXTENSION_STORE);
}

export async function saveStore(store: ExtensionStoreV1) {
  await chrome.storage.local.set({ [STORE_KEY]: store });
}

const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;

export function resolveExtensionWatched(state: ExtensionVideoState): boolean {
  const positiveAt = Math.max(
    state.sources.includes("extension") ? time(state.lastWatchedAt) : 0,
    time(state.historyImport?.importedAt),
    state.manualDecision?.watched ? time(state.manualDecision.changedAt) : 0,
  );
  const negativeAt = state.manualDecision?.watched === false ? time(state.manualDecision.changedAt) : 0;
  return positiveAt > 0 && negativeAt <= positiveAt;
}

function emptyVideo(videoId: string): ExtensionVideoState {
  return { videoId, started: false, watched: false, sources: [] };
}

async function updateVideo(videoId: string, transition: (state: ExtensionVideoState) => ExtensionVideoState) {
  const store = await loadStore();
  const next = transition(store.videos[videoId] ?? emptyVideo(videoId));
  next.watched = resolveExtensionWatched(next);
  store.videos[videoId] = next;
  await saveStore(store);
  return next;
}

const addSource = (state: ExtensionVideoState, source: ExtensionVideoState["sources"][number]) => state.sources.includes(source) ? state.sources : [...state.sources, source];

export async function setManualDecision(videoId: string, decision: ManualWatchDecision) {
  return updateVideo(videoId, (state) => ({ ...state, manualDecision: decision, sources: addSource(state, "manual") }));
}

export async function mergeImported(records: ImportedWatchState[]) {
  const changed: ExtensionVideoState[] = [];
  for (const record of records) {
    changed.push(await updateVideo(record.videoId, (state) => ({
      ...state,
      historyImport: state.historyImport ? {
        ...record,
        firstKnownWatchedAt: [state.historyImport.firstKnownWatchedAt, record.firstKnownWatchedAt].filter(Boolean).sort()[0],
        lastKnownWatchedAt: [state.historyImport.lastKnownWatchedAt, record.lastKnownWatchedAt].filter(Boolean).sort().at(-1),
        importCount: Math.max(state.historyImport.importCount, record.importCount),
      } : record,
      sources: addSource(state, "history-import"),
    })));
  }
  return changed;
}

export async function clearImported() {
  const store = await loadStore();
  for (const state of Object.values(store.videos)) {
    state.historyImport = undefined;
    state.sources = state.sources.filter((source) => source !== "history-import");
    state.watched = resolveExtensionWatched(state);
  }
  await saveStore(store);
  return Object.values(store.videos);
}

export async function resetVideoProgress(videoId: string) {
  return updateVideo(videoId, (state) => ({ ...state, started: false, progress: undefined, firstStartedAt: undefined, lastObservedAt: undefined }));
}

export interface TrackerCheckpoint {
  videoId: string;
  progress: MeasuredProgress;
  started: boolean;
  completed: boolean;
}

export async function applyTrackerCheckpoint(checkpoint: TrackerCheckpoint) {
  return updateVideo(checkpoint.videoId, (state) => {
    const now = checkpoint.progress.measuredAt;
    const completed = checkpoint.completed;
    return {
      ...state,
      started: state.started || checkpoint.started || completed,
      progress: checkpoint.progress,
      firstStartedAt: state.firstStartedAt ?? (checkpoint.started || completed ? now : undefined),
      lastObservedAt: now,
      firstWatchedAt: state.firstWatchedAt ?? (completed ? now : undefined),
      lastWatchedAt: completed ? now : state.lastWatchedAt,
      sources: addSource(state, "extension"),
    };
  });
}
