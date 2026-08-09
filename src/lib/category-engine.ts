import { CATEGORY_RULES, type CategoryRule } from "../config/categories";
import { OTHER_CATEGORY_ID } from "../config/app";

export const FULL_MOVIE_REGEX = /\bfull\s+movie\b/i;

export function isFullMovieTitle(title: string): boolean {
  return FULL_MOVIE_REGEX.test(title);
}

export function classifyMovie(input: { title: string; description?: string; tags?: string[] }, rules: CategoryRule[] = CATEGORY_RULES): string[] {
  const searchable = [input.title, input.description ?? "", ...(input.tags ?? [])].join(" ");
  const matches = rules
    .filter((rule) => rule.id !== OTHER_CATEGORY_ID && rule.patterns.some((pattern) => pattern.test(searchable)))
    .sort((a, b) => a.priority - b.priority)
    .map((rule) => rule.id);
  return matches.length ? matches : [OTHER_CATEGORY_ID];
}
