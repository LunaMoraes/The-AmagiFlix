import { CATEGORY_RULES, type CategoryRule } from "../config/categories";
import { OTHER_CATEGORY_ID, OTHER_SHOWS_CATEGORY_ID } from "../config/app";

import type { SubcategoryId } from "../config/categories";
import type { CatalogTitle } from "../types/catalog";
import { isShow } from "./titles";

export const FULL_MOVIE_REGEX = /\b(?:full\s+movie|compilation)\b/i;

export function isFullMovieTitle(title: string): boolean {
  return FULL_MOVIE_REGEX.test(title);
}

export function getTitleSubcategory(title: CatalogTitle): SubcategoryId {
  if (!isShow(title)) return "full-movie";
  return title.episodes.length === 1 ? "one-shot" : "series";
}

export function filterTitlesBySubcategory(titles: CatalogTitle[], subcategoryId: SubcategoryId): CatalogTitle[] {
  return titles.filter((title) => getTitleSubcategory(title) === subcategoryId);
}

export function classifyMovie(input: { title: string; description?: string; tags?: string[] }, rules: CategoryRule[] = CATEGORY_RULES): string[] {
  const searchable = input.title;
  const matches = rules
    .filter((rule) => rule.id !== OTHER_CATEGORY_ID && rule.patterns.some((pattern) => pattern.test(searchable)))
    .sort((a, b) => a.priority - b.priority)
    .map((rule) => rule.id);
  return matches.length ? matches : [OTHER_CATEGORY_ID];
}

export function classifyShow(input: { title: string; description?: string; tags?: string[] }, rules: CategoryRule[] = CATEGORY_RULES): string[] {
  const searchable = input.title;
  const matches = rules
    .filter((rule) => rule.id !== OTHER_CATEGORY_ID && rule.id !== OTHER_SHOWS_CATEGORY_ID && rule.patterns.some((pattern) => pattern.test(searchable)))
    .sort((a, b) => a.priority - b.priority)
    .map((rule) => rule.id);
  return matches.length ? matches : [OTHER_SHOWS_CATEGORY_ID];
}
