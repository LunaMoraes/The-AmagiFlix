import { STORAGE_KEY, V1_STORAGE_KEY } from "../config/app";
import type { ExtensionVideoState, ImportedWatchState, LocalLibrary, ManualWatchDecision, MeasuredProgress, WebVideoState } from "../types/library";
import { EMPTY_LIBRARY } from "./library";

const stringValue = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined;
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

function normalizeProgress(value: unknown): MeasuredProgress | undefined {
  if (!value || typeof value !== "object") return undefined;
  const progress = value as Record<string, unknown>;
  const currentSeconds = numberValue(progress.currentSeconds);
  const durationSeconds = numberValue(progress.durationSeconds);
  const measuredAt = stringValue(progress.measuredAt);
  return currentSeconds !== undefined && durationSeconds && measuredAt ? { currentSeconds: Math.min(currentSeconds, durationSeconds), durationSeconds, measuredAt } : undefined;
}

function normalizeManual(value: unknown): ManualWatchDecision | undefined {
  if (!value || typeof value !== "object") return undefined;
  const decision = value as Record<string, unknown>;
  const changedAt = stringValue(decision.changedAt);
  return typeof decision.watched === "boolean" && changedAt ? { watched: decision.watched, changedAt } : undefined;
}

function normalizeImport(value: unknown): ImportedWatchState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const importedAt = stringValue(record.importedAt);
  return typeof record.videoId === "string" && record.watched === true && typeof record.importCount === "number" && record.importCount > 0 && importedAt ? {
    videoId: record.videoId,
    watched: true,
    importCount: Math.floor(record.importCount),
    importedAt,
    ...(stringValue(record.firstKnownWatchedAt) ? { firstKnownWatchedAt: stringValue(record.firstKnownWatchedAt) } : {}),
    ...(stringValue(record.lastKnownWatchedAt) ? { lastKnownWatchedAt: stringValue(record.lastKnownWatchedAt) } : {}),
  } : undefined;
}

function normalizeExtension(value: unknown): ExtensionVideoState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const state = value as Record<string, unknown>;
  if (typeof state.videoId !== "string") return undefined;
  return {
    videoId: state.videoId,
    started: state.started === true,
    watched: state.watched === true,
    sources: Array.isArray(state.sources) ? state.sources.filter((source): source is ExtensionVideoState["sources"][number] => ["extension", "history-import", "manual", "v1"].includes(String(source))) : [],
    ...(normalizeProgress(state.progress) ? { progress: normalizeProgress(state.progress) } : {}),
    ...(stringValue(state.firstStartedAt) ? { firstStartedAt: stringValue(state.firstStartedAt) } : {}),
    ...(stringValue(state.firstWatchedAt) ? { firstWatchedAt: stringValue(state.firstWatchedAt) } : {}),
    ...(stringValue(state.lastWatchedAt) ? { lastWatchedAt: stringValue(state.lastWatchedAt) } : {}),
    ...(stringValue(state.lastObservedAt) ? { lastObservedAt: stringValue(state.lastObservedAt) } : {}),
    ...(normalizeManual(state.manualDecision) ? { manualDecision: normalizeManual(state.manualDecision) } : {}),
    ...(normalizeImport(state.historyImport) ? { historyImport: normalizeImport(state.historyImport) } : {}),
  };
}

function normalizeState(value: unknown): WebVideoState {
  const state = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    ...(stringValue(state.startedAt) ? { startedAt: stringValue(state.startedAt) } : {}),
    ...(stringValue(state.lastOpenedAt) ? { lastOpenedAt: stringValue(state.lastOpenedAt) } : {}),
    inMyList: state.inMyList === true,
    ...(normalizeManual(state.manualDecision) ? { manualDecision: normalizeManual(state.manualDecision) } : {}),
    ...(normalizeImport(state.historyImport) ? { historyImport: normalizeImport(state.historyImport) } : {}),
    ...(normalizeExtension(state.extension) ? { extension: normalizeExtension(state.extension) } : {}),
  };
}

export function migrateLocalLibrary(raw: unknown): LocalLibrary {
  if (!raw || typeof raw !== "object") return { ...EMPTY_LIBRARY, videos: {} };
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 2 || !candidate.videos || typeof candidate.videos !== "object" || Array.isArray(candidate.videos)) return { ...EMPTY_LIBRARY, videos: {} };
  return {
    schemaVersion: 2,
    videos: Object.fromEntries(Object.entries(candidate.videos as Record<string, unknown>).map(([id, state]) => [id, normalizeState(state)])),
  };
}

export function migrateV1Library(raw: unknown, migratedAt = new Date().toISOString()): LocalLibrary {
  if (!raw || typeof raw !== "object") return { ...EMPTY_LIBRARY, videos: {} };
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 1 || !candidate.videos || typeof candidate.videos !== "object" || Array.isArray(candidate.videos)) return { ...EMPTY_LIBRARY, videos: {} };
  return {
    schemaVersion: 2,
    videos: Object.fromEntries(Object.entries(candidate.videos as Record<string, unknown>).map(([id, value]) => {
      const state = value && typeof value === "object" ? value as Record<string, unknown> : {};
      const watchedAt = stringValue(state.watchedAt) ?? migratedAt;
      return [id, {
        ...(stringValue(state.startedAt) ? { startedAt: stringValue(state.startedAt) } : {}),
        ...(stringValue(state.lastOpenedAt) ? { lastOpenedAt: stringValue(state.lastOpenedAt) } : {}),
        inMyList: state.inMyList === true,
        ...(state.watched === true ? { manualDecision: { watched: true, changedAt: watchedAt } } : {}),
      } satisfies WebVideoState];
    })),
  };
}

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadLocalLibrary(storage?: Pick<Storage, "getItem">): LocalLibrary {
  try {
    const target = storage ?? getBrowserStorage();
    const value = target?.getItem(STORAGE_KEY);
    if (value) return migrateLocalLibrary(JSON.parse(value));
    const v1 = target?.getItem(V1_STORAGE_KEY);
    return v1 ? migrateV1Library(JSON.parse(v1)) : { ...EMPTY_LIBRARY, videos: {} };
  } catch {
    return { ...EMPTY_LIBRARY, videos: {} };
  }
}

export function saveLocalLibrary(library: LocalLibrary, storage?: Pick<Storage, "setItem">): boolean {
  try {
    const target = storage ?? getBrowserStorage();
    target?.setItem(STORAGE_KEY, JSON.stringify(library));
    return Boolean(target);
  } catch {
    return false;
  }
}
