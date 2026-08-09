import { describe, expect, it } from "vitest";
import { loadLocalLibrary, migrateLocalLibrary, migrateV1Library, saveLocalLibrary } from "./storage";
import { EMPTY_LIBRARY } from "./library";

describe("library persistence", () => {
  it("migrates corrupt and unknown data safely", () => {
    expect(migrateLocalLibrary(null)).toEqual(EMPTY_LIBRARY);
    expect(migrateLocalLibrary({ schemaVersion: 1, videos: {} })).toEqual(EMPTY_LIBRARY);
  });
  it("normalizes individual video states", () => expect(migrateLocalLibrary({ schemaVersion: 2, videos: { a: { inMyList: true, progress: 72 } } }).videos.a).toEqual({ inMyList: true }));
  it("migrates V1 watched, opened, and My List state", () => expect(migrateV1Library({ schemaVersion: 1, videos: { a: { watched: true, watchedAt: "2026-01-01T00:00:00Z", startedAt: "2025-01-01T00:00:00Z", inMyList: true } } }).videos.a).toMatchObject({ inMyList: true, startedAt: "2025-01-01T00:00:00Z", manualDecision: { watched: true, changedAt: "2026-01-01T00:00:00Z" } }));
  it("falls back when reads or writes fail", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadLocalLibrary(broken)).toEqual(EMPTY_LIBRARY);
    expect(saveLocalLibrary(EMPTY_LIBRARY, broken)).toBe(false);
  });
});
