import { CATEGORY_RULES } from "../config/categories";
import { FEATURED_VIDEO_ID } from "../config/app";
import type { CatalogMovie } from "../types/catalog";

export const selectFeaturedMovie = (movies: CatalogMovie[]): CatalogMovie | undefined => movies.find((movie) => movie.videoId === FEATURED_VIDEO_ID) ?? movies[0];

export const getThumbnail = (movie: CatalogMovie): string | undefined => movie.thumbnails.maxres ?? movie.thumbnails.standard ?? movie.thumbnails.high ?? movie.thumbnails.medium ?? movie.thumbnails.default;

export const getCategoryShelves = (movies: CatalogMovie[]) => [...CATEGORY_RULES]
  .sort((a, b) => a.priority - b.priority)
  .map((category) => ({ category, movies: movies.filter((movie) => movie.categories.includes(category.id)) }))
  .filter((shelf) => shelf.movies.length > 0);

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
