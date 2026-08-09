import { describe, expect, it } from "vitest";
import { validateCatalog } from "./catalog";
import { selectFeaturedTitle, youtubeWatchUrl } from "./movies";
import type { CatalogMovie, CatalogShow } from "../types/catalog";

const movie: CatalogMovie = { videoId: "abc 123", title: "Movie", description: "", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] };
const show: CatalogShow = { showId: "show-test", title: "What If Naruto Left", description: "", latestPublishedAt: "2026-01-02", thumbnails: {}, categories: ["naruto"], seasonNumber: 1, episodes: [{ videoId: "abcDEF12345", title: "What If Naruto Left", description: "", publishedAt: "2026-01-02", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" }] };

describe("catalog helpers", () => {
  it("validates schema and movie count", () => expect(validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 1, movies: [movie] }).movies).toHaveLength(1));
  it("rejects mismatched counts", () => expect(() => validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 0, movies: [movie] })).toThrow());
  it("validates additive shows and treats legacy catalogs as having none", () => {
    expect(validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 1, movies: [movie], showCount: 1, shows: [show] }).shows).toEqual([show]);
    expect(validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 1, movies: [movie] }).shows).toEqual([]);
    expect(() => validateCatalog({ schemaVersion: 1, generatedAt: "now", sourceChannelId: "channel", movieCount: 1, movies: [movie], showCount: 0, shows: [show] })).toThrow();
  });
  it("selects the newest movie or show without mutating the catalog order", () => {
    const titles = [movie, show];
    expect(selectFeaturedTitle(titles)).toBe(show);
    expect(titles).toEqual([movie, show]);
  });
  it("builds canonical encoded watch URLs", () => expect(youtubeWatchUrl(movie.videoId)).toBe("https://www.youtube.com/watch?v=abc%20123"));
});
