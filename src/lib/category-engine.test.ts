import { describe, expect, it } from "vitest";
import { classifyMovie, isFullMovieTitle } from "./category-engine";

describe("Full Movie filtering", () => {
  it.each(["What If X Happened? (Full Movie)", "FULL MOVIE - The Story", "A full   movie timeline"])("includes %s", (title) => expect(isFullMovieTitle(title)).toBe(true));
  it.each(["Compilation", "Full Movies Ranked", "Part 1 - complete story"])("excludes %s", (title) => expect(isFullMovieTitle(title)).toBe(false));
});

describe("category classification", () => {
  it("supports many-to-many matches", () => expect(classifyMovie({ title: "Marvel and DC Comics Full Movie", description: "Batman meets the Avengers" })).toEqual(["marvel", "dc"]));
  it("uses the fallback without dropping an eligible movie", () => expect(classifyMovie({ title: "An Unknown Timeline (Full Movie)" })).toEqual(["other-full-movies"]));
});
