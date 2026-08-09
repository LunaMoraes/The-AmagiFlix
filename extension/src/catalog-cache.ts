import { loadStore, saveStore } from "./storage";

const CATALOG_URL = "https://theamagiflix.com/data/catalog.json";
const MAX_AGE_MS = 12 * 60 * 60 * 1_000;
let refreshPromise: Promise<Set<string>> | undefined;

function cachedSet(videoIds?: string[]) { return new Set(videoIds ?? []); }

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function extractCatalogVideoIds(value: unknown): string[] {
  if (!value || typeof value !== "object") throw new Error("Catalog schema is invalid.");
  const catalog = value as Record<string, unknown>;
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.movies) || (catalog.shows !== undefined && !Array.isArray(catalog.shows))) throw new Error("Catalog schema is invalid.");
  const movieIds = catalog.movies.map((movie) => (movie as Record<string, unknown>)?.videoId);
  const episodeIds = (catalog.shows ?? []).flatMap((show) => {
    const episodes = (show as Record<string, unknown>)?.episodes;
    if (!Array.isArray(episodes)) throw new Error("Catalog show schema is invalid.");
    return episodes.map((episode) => (episode as Record<string, unknown>)?.videoId);
  });
  const videoIds = [...new Set([...movieIds, ...episodeIds].filter((id): id is string => typeof id === "string" && VIDEO_ID.test(id)))];
  if (!videoIds.length) throw new Error("Catalog contains no valid video IDs.");
  return videoIds;
}

export async function getCatalogVideoIds(): Promise<Set<string>> {
  const store = await loadStore();
  const cached = cachedSet(store.catalog?.videoIds);
  const stale = !store.catalog || Date.now() - Date.parse(store.catalog.fetchedAt) >= MAX_AGE_MS;
  if (stale) void refreshCatalog().catch(() => undefined);
  if (cached.size) return cached;
  return refreshCatalog();
}

export async function refreshCatalog(force = false): Promise<Set<string>> {
  if (refreshPromise && !force) return refreshPromise;
  refreshPromise = (async () => {
    const response = await fetch(CATALOG_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
    const catalog = await response.json() as Record<string, unknown>;
    const videoIds = extractCatalogVideoIds(catalog);
    const store = await loadStore();
    store.catalog = {
      schemaVersion: 1,
      videoIds: [...new Set(videoIds)],
      fetchedAt: new Date().toISOString(),
      ...(typeof catalog.generatedAt === "string" ? { catalogGeneratedAt: catalog.generatedAt } : {}),
    };
    await saveStore(store);
    return cachedSet(store.catalog.videoIds);
  })();
  try { return await refreshPromise; } finally { refreshPromise = undefined; }
}

export async function isCatalogVideo(videoId: string) {
  return (await getCatalogVideoIds()).has(videoId);
}
