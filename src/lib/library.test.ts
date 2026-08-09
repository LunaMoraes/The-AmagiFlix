import { describe, expect, it } from "vitest";
import { EMPTY_LIBRARY, markOpened, selectContinueWatching, selectWatchAgain, toggleMyList, toggleWatched } from "./library";
import type { CatalogMovie } from "../types/catalog";

const movies: CatalogMovie[] = [
  { videoId: "a", title: "A", description: "", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
  { videoId: "b", title: "B", description: "", publishedAt: "2026-01-02", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
];

describe("local library transitions", () => {
  it("records the first start and updates last opened", () => {
    const first = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const second = markOpened(first, "a", "2026-01-02T00:00:00Z");
    expect(second.videos.a).toMatchObject({ startedAt: "2026-01-01T00:00:00Z", lastOpenedAt: "2026-01-02T00:00:00Z", watched: false });
  });
  it("toggles watched without losing opened state", () => {
    const started = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const watched = toggleWatched(started, "a", "2026-01-02T00:00:00Z");
    const unwatched = toggleWatched(watched, "a", "2026-01-03T00:00:00Z");
    expect(watched.videos.a.watchedAt).toBe("2026-01-02T00:00:00Z");
    expect(unwatched.videos.a).toMatchObject({ watched: false, startedAt: "2026-01-01T00:00:00Z" });
    expect(unwatched.videos.a.watchedAt).toBeUndefined();
  });
  it("selects continue watching and watch again independently", () => {
    const opened = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const watched = toggleWatched(markOpened(opened, "b", "2026-01-02T00:00:00Z"), "b", "2026-01-03T00:00:00Z");
    expect(selectContinueWatching(movies, watched).map((movie) => movie.videoId)).toEqual(["a"]);
    expect(selectWatchAgain(movies, watched).map((movie) => movie.videoId)).toEqual(["b"]);
  });
  it("supports My List", () => expect(toggleMyList(EMPTY_LIBRARY, "a").videos.a.inMyList).toBe(true));
});
