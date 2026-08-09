import { describe, expect, it } from "vitest";
import { searchMovies, searchTitles } from "./search";
import type { CatalogMovie, CatalogShow } from "../types/catalog";

const movies: CatalogMovie[] = [
  { videoId: "title", title: "Naruto Full Movie", description: "A hero story", publishedAt: "2025-01-01", durationSeconds: null, thumbnails: {}, categories: ["naruto"] },
  { videoId: "description", title: "The Ninja Story", description: "Naruto appears here", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
];
const show: CatalogShow = { showId: "show-naruto", title: "What If Naruto Left", description: "An alternate timeline", latestPublishedAt: "2026-02-01", thumbnails: {}, categories: ["naruto"], seasonNumber: 1, episodes: [
  { videoId: "episode-one", title: "What If Naruto Left Part 1", description: "Sasuke searches for him", publishedAt: "2026-01-01", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
  { videoId: "episode-two", title: "What If Naruto Left Final", description: "The final battle", publishedAt: "2026-02-01", durationSeconds: 600, thumbnails: {}, episodeNumber: 2, episodeLabel: "Final" },
] };

describe("catalog search", () => {
  it("is case insensitive and prioritizes title matches", () => expect(searchMovies(movies, "NARUTO").map((movie) => movie.videoId)).toEqual(["title", "description"]));
  it("requires all query tokens", () => expect(searchMovies(movies, "naruto hero").map((movie) => movie.videoId)).toEqual(["title"]));
  it("returns one show result when an episode title or description matches", () => {
    expect(searchTitles(movies, [show], "sasuke")).toEqual([show]);
    expect(searchTitles(movies, [show], "final battle")).toEqual([show]);
  });
});
