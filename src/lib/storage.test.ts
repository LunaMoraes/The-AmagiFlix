import { describe, expect, it } from "vitest";
import { loadLocalLibrary, migrateLocalLibrary, saveLocalLibrary } from "./storage";
import { EMPTY_LIBRARY } from "./library";

describe("library persistence", () => {
  it("migrates corrupt and unknown data safely", () => {
    expect(migrateLocalLibrary(null)).toEqual(EMPTY_LIBRARY);
    expect(migrateLocalLibrary({ schemaVersion: 2, videos: {} })).toEqual(EMPTY_LIBRARY);
  });
  it("normalizes individual video states", () => expect(migrateLocalLibrary({ schemaVersion: 1, videos: { a: { watched: "yes", inMyList: true, progress: 72 } } }).videos.a).toEqual({ watched: false, inMyList: true }));
  it("falls back when reads or writes fail", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(loadLocalLibrary(broken)).toEqual(EMPTY_LIBRARY);
    expect(saveLocalLibrary(EMPTY_LIBRARY, broken)).toBe(false);
  });
});
