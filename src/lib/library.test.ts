import { describe, expect, it } from "vitest";
import { EMPTY_LIBRARY, getVideoState, markOpened, mergeExtensionStates, mergeImportedHistory, resetProgress, selectContinueWatching, selectWatchAgain, toggleMyList, toggleWatched } from "./library";
import type { CatalogMovie } from "../types/catalog";

const movies: CatalogMovie[] = [
  { videoId: "a", title: "A", description: "", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
  { videoId: "b", title: "B", description: "", publishedAt: "2026-01-02", durationSeconds: null, thumbnails: {}, categories: ["other-full-movies"] },
];

describe("local library transitions", () => {
  it("records the first start and updates last opened", () => {
    const first = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const second = markOpened(first, "a", "2026-01-02T00:00:00Z");
    expect(getVideoState(second, "a")).toMatchObject({ startedAt: "2026-01-01T00:00:00Z", lastOpenedAt: "2026-01-02T00:00:00Z", watched: false });
  });
  it("toggles watched without losing opened state", () => {
    const started = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const watched = toggleWatched(started, "a", "2026-01-02T00:00:00Z");
    const unwatched = toggleWatched(watched, "a", "2026-01-03T00:00:00Z");
    expect(getVideoState(watched, "a").watchedAt).toBe("2026-01-02T00:00:00Z");
    expect(getVideoState(unwatched, "a")).toMatchObject({ watched: false, startedAt: "2026-01-01T00:00:00Z" });
    expect(getVideoState(unwatched, "a").watchedAt).toBeUndefined();
  });
  it("selects continue watching and watch again independently", () => {
    const opened = markOpened(EMPTY_LIBRARY, "a", "2026-01-01T00:00:00Z");
    const watched = toggleWatched(markOpened(opened, "b", "2026-01-02T00:00:00Z"), "b", "2026-01-03T00:00:00Z");
    expect(selectContinueWatching(movies, watched).map((movie) => movie.videoId)).toEqual(["a"]);
    expect(selectWatchAgain(movies, watched).map((movie) => movie.videoId)).toEqual(["b"]);
  });
  it("supports My List", () => expect(toggleMyList(EMPTY_LIBRARY, "a").videos.a.inMyList).toBe(true));
  it("keeps measured progress when import marks a movie watched", () => {
    const measured = mergeExtensionStates(EMPTY_LIBRARY, [{ videoId: "a", started: true, watched: false, progress: { currentSeconds: 35, durationSeconds: 100, measuredAt: "2026-01-01T00:00:00Z" }, sources: ["extension"] }]);
    const imported = mergeImportedHistory(measured, [{ videoId: "a", watched: true, importCount: 1, importedAt: "2026-01-02T00:00:00Z" }]);
    expect(getVideoState(imported, "a")).toMatchObject({ watched: true, progress: { currentSeconds: 35 } });
    expect(selectContinueWatching(movies, imported)).toEqual([]);
  });
  it("lets newer manual unwatched override older evidence without deleting progress", () => {
    const imported = mergeImportedHistory(EMPTY_LIBRARY, [{ videoId: "a", watched: true, importCount: 1, importedAt: "2026-01-01T00:00:00Z" }]);
    const unwatched = toggleWatched(imported, "a", "2026-01-02T00:00:00Z");
    expect(getVideoState(unwatched, "a").watched).toBe(false);
  });
  it("merges repeated import evidence idempotently and resets only progress", () => {
    const record = { videoId: "a", watched: true as const, importCount: 3, importedAt: "2026-01-01T00:00:00Z" };
    const twice = mergeImportedHistory(mergeImportedHistory(EMPTY_LIBRARY, [record]), [record]);
    expect(twice.videos.a.historyImport?.importCount).toBe(3);
    const opened = markOpened(twice, "a");
    expect(getVideoState(resetProgress(opened, "a"), "a").watched).toBe(true);
  });
});
