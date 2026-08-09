import { describe, expect, it } from "vitest";
import { searchMovies } from "./search";
import type { CatalogMovie } from "../types/catalog";

const movies: CatalogMovie[] = [
  { videoId: "title", title: "Naruto Full Movie", description: "A hero story", publishedAt: "2025-01-01", durationSeconds: null, thumbnails: {}, categories: ["naruto"] },
  { videoId: "description", title: "The Ninja Story", description: "Naruto appears here", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
];

describe("catalog search", () => {
  it("is case insensitive and prioritizes title matches", () => expect(searchMovies(movies, "NARUTO").map((movie) => movie.videoId)).toEqual(["title", "description"]));
  it("requires all query tokens", () => expect(searchMovies(movies, "naruto hero").map((movie) => movie.videoId)).toEqual(["title"]));
});
