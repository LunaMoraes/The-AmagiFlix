import { describe, expect, it } from "vitest";
import { CATEGORY_RULES, getCategoryLabel } from "../config/categories";
import { classifyMovie, classifyShow, filterTitlesBySubcategory, getTitleSubcategory, isFullMovieTitle } from "./category-engine";
import type { CatalogMovie, CatalogShow } from "../types/catalog";

describe("Full Movie filtering", () => {
  it.each(["What If X Happened? (Full Movie)", "FULL MOVIE - The Story", "A full   movie timeline", "What If Naruto Had Every Dojutsu? (Compilation)", "Compilation of all stories"])("includes %s", (title) => expect(isFullMovieTitle(title)).toBe(true));
  it.each(["Full Movies Ranked", "Part 1 - complete story"])("excludes %s", (title) => expect(isFullMovieTitle(title)).toBe(false));
});

describe("subcategory filtering", () => {
  const movie: CatalogMovie = { videoId: "m1", title: "Naruto Story (Full Movie)", description: "", publishedAt: "2026-01-01", durationSeconds: 5000, thumbnails: {}, categories: ["naruto"] };
  const seriesShow: CatalogShow = {
    showId: "s1",
    title: "What If Naruto Left Konoha",
    description: "",
    latestPublishedAt: "2026-01-02",
    thumbnails: {},
    categories: ["naruto"],
    seasonNumber: 1,
    episodes: [
      { videoId: "e1", title: "Part 1", description: "", publishedAt: "2026-01-01", durationSeconds: 600, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
      { videoId: "e2", title: "Part 2", description: "", publishedAt: "2026-01-02", durationSeconds: 600, thumbnails: {}, episodeNumber: 2, episodeLabel: "Episode 2" },
    ],
  };
  const oneShotShow: CatalogShow = {
    showId: "s2",
    title: "What If Sasuke Stayed",
    description: "",
    latestPublishedAt: "2026-01-03",
    thumbnails: {},
    categories: ["naruto"],
    seasonNumber: 1,
    episodes: [
      { videoId: "e3", title: "One Shot", description: "", publishedAt: "2026-01-03", durationSeconds: 900, thumbnails: {}, episodeNumber: 1, episodeLabel: "Episode 1" },
    ],
  };

  it("identifies title subcategories correctly", () => {
    expect(getTitleSubcategory(movie)).toBe("full-movie");
    expect(getTitleSubcategory(seriesShow)).toBe("series");
    expect(getTitleSubcategory(oneShotShow)).toBe("one-shot");
  });

  it("filters titles by subcategory", () => {
    const titles = [movie, seriesShow, oneShotShow];
    expect(filterTitlesBySubcategory(titles, "full-movie")).toEqual([movie]);
    expect(filterTitlesBySubcategory(titles, "series")).toEqual([seriesShow]);
    expect(filterTitlesBySubcategory(titles, "one-shot")).toEqual([oneShotShow]);
  });
});

describe("category classification", () => {
  it("supports many-to-many title matches", () => expect(classifyMovie({ title: "Naruto Meets Batman (Full Movie)" })).toEqual(["naruto", "dc"]));
  it("ignores incidental franchise references in descriptions and tags", () => expect(classifyMovie({
    title: "What If Naruto Had Every Dojutsu? (Full Movie)",
    description: "What colorful hair is to Dragon Ball, pretty eyes are to Naruto.",
    tags: ["Goku"],
  })).toEqual(["naruto"]));
  it("uses the fallback without dropping an eligible movie", () => expect(classifyMovie({ title: "An Unknown Timeline (Full Movie)" })).toEqual(["other-full-movies"]));
  it("exposes the fallback as Uncategorized Full Movies", () => expect(getCategoryLabel("other-full-movies")).toBe("Uncategorized Full Movies"));
  it("categorizes shows with a separate visible fallback", () => {
    expect(classifyShow({ title: "What If Naruto Left Konoha" })).toEqual(["naruto"]);
    expect(classifyShow({ title: "What If An Unknown Hero Vanished" })).toEqual(["other-shows"]);
    expect(getCategoryLabel("other-shows")).toBe("Uncategorized Shows");
  });
  it("ignores incidental franchise references in show descriptions and tags", () => expect(classifyShow({
    title: "What If An Unknown Hero Vanished",
    description: "Naruto, Goku, and Batman are mentioned in the promotional copy.",
    tags: ["Star Wars"],
  })).toEqual(["other-shows"]));
  it.each([
    ["What If Hiruzen Was Reborn With His Memories & Abilities?", "naruto"],
    ["What If Hiruzen Saved Orochimaru?", "naruto"],
    ["What If Sunagakure Threw A Coup Against Gaara?", "naruto"],
    ["What If Kimimaro Didn't Die?", "naruto"],
    ["What If Hiruzen Helped Fight The Nine-Tails?", "naruto"],
    ["What If Rin Was Reborn With Her Memories?", "naruto"],
    ["What If The Uzumaki Clan Had Their Own Dojutsu?", "naruto"],
    ["What If Karura Were The One-Tail?", "naruto"],
    ["What If Rock Lee Could Use Ninjutsu?", "naruto"],
    ["What If Hashirama Senju Was Reborn With His Memories & Abilities?", "naruto"],
    ["What If Sakumo Didn't Die?", "naruto"],
    ["What If There Were No Tailed Beasts?", "naruto"],
    ["What If Rin Was Never Captured?", "naruto"],
    ["What If There Was No Curse Of Hatred?", "naruto"],
    ["What If Neji Didn't Die?", "naruto"],
    ["What If Haku And Zabuza Didn't Die?", "naruto"],
    ["What If Hiruzen Killed Orochimaru?", "naruto"],
    ["What If Sakumo Hatake Didn't Die?", "naruto"],
    ["What If The Uzumaki Clan Was Never Destroyed?", "naruto"],
    ["What If Black Zetsu Never Existed?", "naruto"],
    ["What If Rock Lee Was The Main Character?", "naruto"],
    ["What If Rin Didn't Die?", "naruto"],
    ["What If Eren Went With Reiner and Bertholdt?", "attack-on-titan"],
    ["What If Eren Fought Shinji?", "attack-on-titan"],
    ["What If Zeke Controlled The Founding Titan?", "attack-on-titan"],
    ["What If Erwin Was The Colossal Titan?", "attack-on-titan"],
    ["What If Gohan Were The Legendary Super Saiyan?", "dragon-ball"],
    ["What if Uub Was in the Tournament of Power?", "dragon-ball"],
    ["What If Gohan Never Stopped Training?", "dragon-ball"],
    ["What If Sozin Saved Roku?", "avatar"],
    ["What If Iroh Was The Fire Lord Instead?", "avatar"],
    ["What If Rumi Embraced Her Demon Side? (Kpop Demon Hunters)", "kpop-demon-hunters"],
    ["What if HUNTR/X Met Devil May Cry?", "kpop-demon-hunters"],
    ["What If Katniss Didn't Volunteer As Tribute?", "hunger-games"],
    ["What If Jon Snow Didn't Kill Daenerys?", "game-of-thrones"],
    ["What If Jonathan Was Adopted By The Brandos?", "jojo"],
    ["What If The Wrong Half Of The Avengers Were Snapped?", "avengers"],
    ["What If Luke Turned To The Dark Side?", "star-wars"],
    ["What If Saitama Were Evil?", "one-punch-man"],
  ])("classifies the deployed show title %s as %s", (title, categoryId) => expect(classifyShow({ title })).toContain(categoryId));
  it("does not expose a Marvel category", () => expect(CATEGORY_RULES.some((rule) => rule.id === "marvel")).toBe(false));
});
