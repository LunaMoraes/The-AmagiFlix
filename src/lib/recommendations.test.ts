import { describe, expect, it } from "vitest";
import { createRecommendationOrder } from "./recommendations";
import type { CatalogMovie } from "../types/catalog";

const titles: CatalogMovie[] = ["a", "b", "c", "d"].map((videoId) => ({ videoId, title: videoId, description: "", publishedAt: "2026-01-01", durationSeconds: null, thumbnails: {}, categories: [] }));

describe("recommendation ordering", () => {
  it("creates a shuffled copy without mutating the catalog order", () => {
    const randomValues = [0, 0, 0];
    const result = createRecommendationOrder(titles, () => randomValues.shift() ?? 0);
    expect(result.map((title) => title.title)).toEqual(["b", "c", "d", "a"]);
    expect(titles.map((title) => title.title)).toEqual(["a", "b", "c", "d"]);
  });
});
