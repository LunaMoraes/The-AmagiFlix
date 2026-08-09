import { describe, expect, it } from "vitest";
import { extractCatalogVideoIds } from "./catalog-cache";

describe("extension catalog membership", () => {
  it("includes movies and visible show episodes while accepting legacy movie-only catalogs", () => {
    expect(extractCatalogVideoIds({ schemaVersion: 1, movies: [{ videoId: "movie000001" }] })).toEqual(["movie000001"]);
    expect(extractCatalogVideoIds({
      schemaVersion: 1,
      movies: [{ videoId: "movie000001" }],
      shows: [{ episodes: [{ videoId: "episode0001" }, { videoId: "episode0002" }] }],
    })).toEqual(["movie000001", "episode0001", "episode0002"]);
  });

  it("rejects malformed or empty membership", () => {
    expect(() => extractCatalogVideoIds({ schemaVersion: 2, movies: [] })).toThrow(/schema/i);
    expect(() => extractCatalogVideoIds({ schemaVersion: 1, movies: [], shows: [] })).toThrow(/no valid/i);
  });
});
