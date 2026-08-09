import { describe, expect, it } from "vitest";
import { CATEGORY_RULES, getCategoryLabel } from "../config/categories";
import { classifyMovie, classifyShow, isFullMovieTitle } from "./category-engine";

describe("Full Movie filtering", () => {
  it.each(["What If X Happened? (Full Movie)", "FULL MOVIE - The Story", "A full   movie timeline"])("includes %s", (title) => expect(isFullMovieTitle(title)).toBe(true));
  it.each(["Compilation", "Full Movies Ranked", "Part 1 - complete story"])("excludes %s", (title) => expect(isFullMovieTitle(title)).toBe(false));
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
  it("does not expose a Marvel category", () => expect(CATEGORY_RULES.some((rule) => rule.id === "marvel")).toBe(false));
});
