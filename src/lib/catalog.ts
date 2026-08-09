import type { CatalogFile, CatalogMovie } from "../types/catalog";

const isMovie = (value: unknown): value is CatalogMovie => {
  if (!value || typeof value !== "object") return false;
  const movie = value as Record<string, unknown>;
  return typeof movie.videoId === "string" && typeof movie.title === "string" && typeof movie.description === "string" && typeof movie.publishedAt === "string" && Array.isArray(movie.categories) && typeof movie.thumbnails === "object";
};

export function validateCatalog(value: unknown): CatalogFile {
  if (!value || typeof value !== "object") throw new Error("Catalog is not an object.");
  const catalog = value as Record<string, unknown>;
  if (catalog.schemaVersion !== 1 || typeof catalog.generatedAt !== "string" || typeof catalog.sourceChannelId !== "string" || !Array.isArray(catalog.movies) || !catalog.movies.every(isMovie) || catalog.movieCount !== catalog.movies.length) {
    throw new Error("Catalog schema is invalid.");
  }
  return catalog as unknown as CatalogFile;
}

export async function loadCatalog(signal?: AbortSignal): Promise<CatalogFile> {
  const catalogUrl = `${import.meta.env.BASE_URL}data/catalog.json`;
  const response = await fetch(catalogUrl, { signal, cache: "no-cache" });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  return validateCatalog(await response.json());
}
