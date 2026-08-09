import type { CatalogEpisode, CatalogFile, CatalogMovie, CatalogShow } from "../types/catalog";

const isMovie = (value: unknown): value is CatalogMovie => {
  if (!value || typeof value !== "object") return false;
  const movie = value as Record<string, unknown>;
  return typeof movie.videoId === "string" && typeof movie.title === "string" && typeof movie.description === "string" && typeof movie.publishedAt === "string" && Array.isArray(movie.categories) && typeof movie.thumbnails === "object";
};

const isEpisode = (value: unknown): value is CatalogEpisode => {
  if (!value || typeof value !== "object") return false;
  const episode = value as Record<string, unknown>;
  return isMovie({ ...episode, categories: [] }) && Number.isInteger(episode.episodeNumber) && Number(episode.episodeNumber) > 0 && typeof episode.episodeLabel === "string";
};

const isShow = (value: unknown): value is CatalogShow => {
  if (!value || typeof value !== "object") return false;
  const show = value as Record<string, unknown>;
  return typeof show.showId === "string" && typeof show.title === "string" && typeof show.description === "string" && typeof show.latestPublishedAt === "string" && typeof show.thumbnails === "object" && Array.isArray(show.categories) && show.seasonNumber === 1 && Array.isArray(show.episodes) && show.episodes.length > 0 && show.episodes.every(isEpisode);
};

export function validateCatalog(value: unknown): CatalogFile {
  if (!value || typeof value !== "object") throw new Error("Catalog is not an object.");
  const catalog = value as Record<string, unknown>;
  const shows = catalog.shows === undefined ? [] : catalog.shows;
  const showCount = catalog.showCount === undefined ? 0 : catalog.showCount;
  if (catalog.schemaVersion !== 1 || typeof catalog.generatedAt !== "string" || typeof catalog.sourceChannelId !== "string" || !Array.isArray(catalog.movies) || !catalog.movies.every(isMovie) || catalog.movieCount !== catalog.movies.length || !Array.isArray(shows) || !shows.every(isShow) || showCount !== shows.length) {
    throw new Error("Catalog schema is invalid.");
  }
  return { ...catalog, shows, showCount } as unknown as CatalogFile;
}

export async function loadCatalog(signal?: AbortSignal): Promise<CatalogFile> {
  const catalogUrl = `${import.meta.env.BASE_URL}data/catalog.json`;
  const response = await fetch(catalogUrl, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  return validateCatalog(await response.json());
}
