import { describe, expect, it } from "vitest";
import { DEFAULT_PROFILE, loadLocalProfile, migrateLocalProfile, saveLocalProfile } from "./profile-storage";

describe("profile persistence", () => {
  it("uses a safe default for corrupt or unsupported data", () => {
    expect(migrateLocalProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(migrateLocalProfile({ schemaVersion: 2, name: "Old" })).toEqual(DEFAULT_PROFILE);
  });

  it("normalizes names and reserves an empty avatar", () => {
    expect(migrateLocalProfile({ schemaVersion: 1, name: "  Luna  ", avatarUrl: "ignored" })).toEqual({ schemaVersion: 1, name: "Luna", avatarUrl: null });
  });

  it("falls back when profile storage is blocked", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadLocalProfile(broken)).toEqual(DEFAULT_PROFILE);
    expect(saveLocalProfile(DEFAULT_PROFILE, broken)).toBe(false);
  });
});
