import { CATEGORY_RULES } from "../config/categories";
import type { CatalogMovie, CatalogTitle } from "../types/catalog";
import { titlePublishedAt } from "./titles";

export const selectFeaturedTitle = (titles: CatalogTitle[]): CatalogTitle | undefined => [...titles]
  .sort((left, right) => Date.parse(titlePublishedAt(right)) - Date.parse(titlePublishedAt(left)))[0];

export const getThumbnail = (movie: CatalogMovie): string | undefined => movie.thumbnails.maxres ?? movie.thumbnails.standard ?? movie.thumbnails.high ?? movie.thumbnails.medium ?? movie.thumbnails.default;

export const getCategoryShelves = (movies: CatalogMovie[]) => [...CATEGORY_RULES]
  .sort((a, b) => a.priority - b.priority)
  .map((category) => ({ category, movies: movies.filter((movie) => movie.categories.includes(category.id)) }))
  .filter((shelf) => shelf.movies.length > 0);

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
