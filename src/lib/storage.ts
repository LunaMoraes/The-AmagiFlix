import { STORAGE_KEY } from "../config/app";
import type { LocalLibrary, LocalVideoState } from "../types/library";
import { EMPTY_LIBRARY } from "./library";

function normalizeState(value: unknown): LocalVideoState {
  const state = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    ...(typeof state.startedAt === "string" ? { startedAt: state.startedAt } : {}),
    ...(typeof state.lastOpenedAt === "string" ? { lastOpenedAt: state.lastOpenedAt } : {}),
    watched: state.watched === true,
    ...(state.watched === true && typeof state.watchedAt === "string" ? { watchedAt: state.watchedAt } : {}),
    inMyList: state.inMyList === true,
  };
}

export function migrateLocalLibrary(raw: unknown): LocalLibrary {
  if (!raw || typeof raw !== "object") return { ...EMPTY_LIBRARY, videos: {} };
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 1 || !candidate.videos || typeof candidate.videos !== "object" || Array.isArray(candidate.videos)) return { ...EMPTY_LIBRARY, videos: {} };
  return {
    schemaVersion: 1,
    videos: Object.fromEntries(Object.entries(candidate.videos as Record<string, unknown>).map(([id, state]) => [id, normalizeState(state)])),
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
    const value = (storage ?? getBrowserStorage())?.getItem(STORAGE_KEY);
    return value ? migrateLocalLibrary(JSON.parse(value)) : { ...EMPTY_LIBRARY, videos: {} };
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
