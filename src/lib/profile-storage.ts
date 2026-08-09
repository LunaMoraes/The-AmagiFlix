import { PROFILE_STORAGE_KEY } from "../config/app";
import type { LocalProfile } from "../types/profile";

export const DEFAULT_PROFILE: LocalProfile = {
  schemaVersion: 1,
  name: "Guest",
  avatarUrl: null,
};

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function migrateLocalProfile(raw: unknown): LocalProfile {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PROFILE };
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 1) return { ...DEFAULT_PROFILE };
  const name = typeof candidate.name === "string" ? candidate.name.trim().slice(0, 40) : "";
  return { schemaVersion: 1, name: name || DEFAULT_PROFILE.name, avatarUrl: null };
}

export function loadLocalProfile(storage?: Pick<Storage, "getItem">): LocalProfile {
  try {
    const value = (storage ?? getBrowserStorage())?.getItem(PROFILE_STORAGE_KEY);
    return value ? migrateLocalProfile(JSON.parse(value)) : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveLocalProfile(profile: LocalProfile, storage?: Pick<Storage, "setItem">): boolean {
  try {
    const target = storage ?? getBrowserStorage();
    target?.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return Boolean(target);
  } catch {
    return false;
  }
}
