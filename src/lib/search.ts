import { getCategoryLabel } from "../config/categories";
import type { CatalogMovie } from "../types/catalog";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export function searchMovies(movies: CatalogMovie[], query: string): CatalogMovie[] {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  return movies
    .map((movie) => {
      const title = normalize(movie.title);
      const categories = normalize(movie.categories.map(getCategoryLabel).join(" "));
      const description = normalize(movie.description);
      const combined = `${title} ${categories} ${description}`;
      if (!tokens.every((token) => combined.includes(token))) return null;
      const score = tokens.reduce((total, token) => total + (title.includes(token) ? 100 : categories.includes(token) ? 20 : 1), 0);
      return { movie, score };
    })
    .filter((result): result is { movie: CatalogMovie; score: number } => result !== null)
    .sort((a, b) => b.score - a.score || Date.parse(b.movie.publishedAt) - Date.parse(a.movie.publishedAt))
    .map(({ movie }) => movie);
}
