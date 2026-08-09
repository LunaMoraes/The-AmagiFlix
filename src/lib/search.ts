import { getCategoryLabel } from "../config/categories";
import type { CatalogMovie, CatalogShow, CatalogTitle } from "../types/catalog";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export function searchMovies(movies: CatalogMovie[], query: string): CatalogMovie[] {
  return searchTitles(movies, [], query) as CatalogMovie[];
}

export function searchTitles(movies: CatalogMovie[], shows: CatalogShow[], query: string): CatalogTitle[] {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  return [...movies, ...shows]
    .map((item) => {
      const title = normalize(item.title);
      const categories = normalize(item.categories.map(getCategoryLabel).join(" "));
      const description = normalize(item.description);
      const episodes = "episodes" in item ? normalize(item.episodes.map((episode) => `${episode.title} ${episode.description}`).join(" ")) : "";
      const combined = `${title} ${categories} ${description} ${episodes}`;
      if (!tokens.every((token) => combined.includes(token))) return null;
      const score = tokens.reduce((total, token) => total + (title.includes(token) ? 100 : categories.includes(token) ? 20 : episodes.includes(token) ? 5 : 1), 0);
      return { item, score };
    })
    .filter((result): result is { item: CatalogTitle; score: number } => result !== null)
    .sort((a, b) => b.score - a.score || Date.parse("latestPublishedAt" in b.item ? b.item.latestPublishedAt : b.item.publishedAt) - Date.parse("latestPublishedAt" in a.item ? a.item.latestPublishedAt : a.item.publishedAt))
    .map(({ item }) => item);
}
