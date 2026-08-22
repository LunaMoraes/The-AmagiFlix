import { describe, expect, it } from "vitest";
import { isExtendedTitle, isShow } from "./titles";
import type { CatalogMovie, CatalogShow } from "../types/catalog";

describe("titles helpers", () => {
  const amagiMovie: CatalogMovie = {
    videoId: "m1",
    title: "The Life of Naruto (Full Movie)",
    description: "",
    publishedAt: "2026-01-01",
    durationSeconds: 7000,
    thumbnails: {},
    categories: ["naruto"],
  };

  const extendedMovieByFlag: CatalogMovie = {
    videoId: "m2",
    title: "What If Darth Vader Overthrew The Emperor? (Full Movie)",
    description: "",
    publishedAt: "2026-01-02",
    durationSeconds: 8000,
    thumbnails: {},
    categories: ["star-wars"],
    isExtended: true,
  };

  const extendedMovieByHandle: CatalogMovie = {
    videoId: "m3",
    title: "What If Darth Vader Won? (Full Movie)",
    description: "",
    publishedAt: "2026-01-03",
    durationSeconds: 8000,
    thumbnails: {},
    categories: ["star-wars"],
    channelHandle: "@vadersorder",
  };

  const amagiShow: CatalogShow = {
    showId: "s1",
    title: "What If Naruto Left Konoha",
    description: "",
    latestPublishedAt: "2026-01-02",
    thumbnails: {},
    categories: ["naruto"],
    seasonNumber: 1,
    episodes: [
      { videoId: "e1", title: "Part 1", description: "", publishedAt: "2026-01-01", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
    ],
  };

  const extendedShowByFlag: CatalogShow = {
    showId: "s2",
    title: "What If Anakin Left The Jedi Order",
    description: "",
    latestPublishedAt: "2026-01-03",
    thumbnails: {},
    categories: ["star-wars"],
    seasonNumber: 1,
    isExtended: true,
    episodes: [
      { videoId: "e2", title: "Part 1", description: "", publishedAt: "2026-01-03", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
    ],
  };

  const extendedShowByHandle: CatalogShow = {
    showId: "s3",
    title: "What If Yoda Trained Anakin",
    description: "",
    latestPublishedAt: "2026-01-04",
    thumbnails: {},
    categories: ["star-wars"],
    seasonNumber: 1,
    channelHandle: "@vadersorder",
    episodes: [
      { videoId: "e3", title: "Part 1", description: "", publishedAt: "2026-01-04", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
    ],
  };

  const extendedShowByEpisodeHandle: CatalogShow = {
    showId: "s4",
    title: "What If Palpatine Was Good",
    description: "",
    latestPublishedAt: "2026-01-05",
    thumbnails: {},
    categories: ["star-wars"],
    seasonNumber: 1,
    episodes: [
      { videoId: "e4", title: "Part 1", description: "", publishedAt: "2026-01-05", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1", channelHandle: "@vadersorder" },
    ],
  };

  it("distinguishes shows from movies", () => {
    expect(isShow(amagiShow)).toBe(true);
    expect(isShow(amagiMovie)).toBe(false);
  });

  it("identifies extended titles by flag, channel handle, or episode handle", () => {
    expect(isExtendedTitle(amagiMovie)).toBe(false);
    expect(isExtendedTitle(amagiShow)).toBe(false);
    expect(isExtendedTitle(extendedMovieByFlag)).toBe(true);
    expect(isExtendedTitle(extendedMovieByHandle)).toBe(true);
    expect(isExtendedTitle(extendedShowByFlag)).toBe(true);
    expect(isExtendedTitle(extendedShowByHandle)).toBe(true);
    expect(isExtendedTitle(extendedShowByEpisodeHandle)).toBe(true);
  });
});
