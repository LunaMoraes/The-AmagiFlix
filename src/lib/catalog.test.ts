import { describe, expect, it } from "vitest";
import { validateCatalog } from "./catalog";
import { selectFeaturedMovie, youtubeWatchUrl } from "./movies";
import type { CatalogMovie } from "../types/catalog";

const movie: CatalogMovie = { videoId: "abc 123", title: "Movie", description: "", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] };

describe("catalog helpers", () => {
  it("validates schema and movie count", () => expect(validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 1, movies: [movie] }).movies).toHaveLength(1));
  it("rejects mismatched counts", () => expect(() => validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 0, movies: [movie] })).toThrow());
  it("selects the stable newest fallback", () => expect(selectFeaturedMovie([movie])).toBe(movie));
  it("builds canonical encoded watch URLs", () => expect(youtubeWatchUrl(movie.videoId)).toBe("https://www.youtube.com/watch?v=abc%20123"));
});
