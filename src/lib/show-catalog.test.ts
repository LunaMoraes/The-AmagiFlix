import { describe, expect, it } from "vitest";
import type { CatalogMovie } from "../types/catalog";
import { aggregateShows, isShowCandidateTitle } from "./show-catalog";

const video = (videoId: string, title: string, publishedAt: string) => ({
  videoId,
  title,
  description: `${title} description`,
  publishedAt,
  durationSeconds: 600,
  thumbnails: {},
});

describe("show catalog aggregation", () => {
  it("aggregates eligible What If uploads into an ordered Season 1 show", () => {
    expect(isShowCandidateTitle("What If Jiraiya Trained Naruto Part 2")).toBe(true);
    expect(isShowCandidateTitle("What If Jiraiya Trained Naruto Full Movie")).toBe(false);
    expect(isShowCandidateTitle("The Story of Naruto Part 1")).toBe(false);

    const result = aggregateShows([
      video("episode00002", "What If Jiraiya Trained Naruto Part 2", "2026-02-02T00:00:00Z"),
      video("episode00003", "What If Jiraiya Trained Naruto Final", "2026-02-03T00:00:00Z"),
      video("episode00001", "What If Jiraiya Trained Naruto", "2026-02-01T00:00:00Z"),
    ], []);

    expect(result.shows).toHaveLength(1);
    expect(result.shows[0]).toMatchObject({
      title: "What If Jiraiya Trained Naruto",
      seasonNumber: 1,
      latestPublishedAt: "2026-02-03T00:00:00Z",
      categories: ["naruto"],
    });
    expect(result.shows[0].episodes.map((episode) => [episode.videoId, episode.episodeNumber, episode.episodeLabel])).toEqual([
      ["episode00001", 1, "Episode 1"],
      ["episode00002", 2, "Episode 2"],
      ["episode00003", 3, "Final"],
    ]);
    expect(result.shows[0].showId).toMatch(/^show-/);
    const reversed = aggregateShows([...result.shows[0].episodes].reverse(), []);
    expect(reversed.shows[0].showId).toBe(result.shows[0].showId);
  });

  it("suppresses a complete show when any Full Movie has the same story identity", () => {
    const movies: CatalogMovie[] = [
      { ...video("fullmovie01", "What If Jiraiya Trained Naruto (Full Movie)", "2026-03-01T00:00:00Z"), categories: ["naruto"] },
      { ...video("fullmovie02", "What If Jiraiya Trained Naruto Updated Full Movie", "2026-04-01T00:00:00Z"), categories: ["naruto"] },
    ];
    const result = aggregateShows([
      video("episode00001", "What If Jiraiya Trained Naruto Part 1", "2026-02-01T00:00:00Z"),
      video("episode00002", "What If Jiraiya Trained Naruto Part 2", "2026-02-02T00:00:00Z"),
    ], movies);

    expect(result.shows).toEqual([]);
    expect(result.suppressed).toEqual([expect.objectContaining({ movieVideoIds: ["fullmovie01", "fullmovie02"], episodeVideoIds: ["episode00001", "episode00002"] })]);
    expect(movies).toHaveLength(2);
  });

  it("uses explicit aliases, reports ambiguity, and keeps uncertain shows visible", () => {
    const movies: CatalogMovie[] = [
      { ...video("fullmovie01", "What If Jiraiya Trained Naruto (Full Movie)", "2026-03-01T00:00:00Z"), categories: ["naruto"] },
      { ...video("fullmovie02", "What If Naruto Trained With Jiraiya Full Movie", "2026-03-02T00:00:00Z"), categories: ["naruto"] },
    ];
    const candidates = [video("episode00001", "What If Jiraya Trained Naruto Part 1", "2026-02-01T00:00:00Z")];

    const uncertain = aggregateShows(candidates, movies);
    expect(uncertain.shows).toHaveLength(1);
    expect(uncertain.ambiguous).toEqual(expect.arrayContaining([expect.objectContaining({ movieVideoId: "fullmovie01" })]));

    const aliased = aggregateShows(candidates, movies, { "what if jiraya trained naruto": "what if jiraiya trained naruto" });
    expect(aliased.shows).toEqual([]);
    expect(aliased.suppressed[0].movieVideoIds).toContain("fullmovie01");
  });

  it("publishes standalone shows and reports missing or conflicting episode numbers", () => {
    const standalone = aggregateShows([video("standalone1", "What If Naruto Joined The Akatsuki", "2026-01-01T00:00:00Z")], []);
    expect(standalone.shows[0].episodes[0]).toMatchObject({ episodeNumber: 1, episodeLabel: "Episode 1" });

    const irregular = aggregateShows([
      video("episode00001", "What If Naruto Left Konoha Part 1", "2026-01-01T00:00:00Z"),
      video("episode00003", "What If Naruto Left Konoha Part 3", "2026-01-03T00:00:00Z"),
      video("episode003du", "What If Naruto Left Konoha Episode 3", "2026-01-04T00:00:00Z"),
    ], []);
    expect(irregular.shows).toHaveLength(1);
    expect(irregular.warnings.join(" ")).toMatch(/missing episode 2/i);
    expect(irregular.warnings.join(" ")).toMatch(/duplicate episode number.*3/i);
  });
});
