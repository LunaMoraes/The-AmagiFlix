import type { CatalogMovie } from "../types/catalog";
import type { LocalLibrary, LocalVideoState } from "../types/library";

export const EMPTY_LIBRARY: LocalLibrary = { schemaVersion: 1, videos: {} };

export const getVideoState = (library: LocalLibrary, videoId: string): LocalVideoState => library.videos[videoId] ?? { watched: false, inMyList: false };

function updateVideo(library: LocalLibrary, videoId: string, update: (state: LocalVideoState) => LocalVideoState): LocalLibrary {
  return {
    schemaVersion: 1,
    videos: { ...library.videos, [videoId]: update(getVideoState(library, videoId)) },
  };
}

export function markOpened(library: LocalLibrary, videoId: string, now = new Date().toISOString()): LocalLibrary {
  return updateVideo(library, videoId, (state) => ({
    ...state,
    startedAt: state.startedAt ?? now,
    lastOpenedAt: now,
  }));
}

export function toggleWatched(library: LocalLibrary, videoId: string, now = new Date().toISOString()): LocalLibrary {
  return updateVideo(library, videoId, (state) => state.watched
    ? { ...state, watched: false, watchedAt: undefined }
    : { ...state, watched: true, watchedAt: now });
}

export function toggleMyList(library: LocalLibrary, videoId: string): LocalLibrary {
  return updateVideo(library, videoId, (state) => ({ ...state, inMyList: !state.inMyList }));
}

const movieById = (movies: CatalogMovie[]) => new Map(movies.map((movie) => [movie.videoId, movie]));

export function selectContinueWatching(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  const lookup = movieById(movies);
  return Object.entries(library.videos)
    .filter(([, state]) => Boolean(state.startedAt) && !state.watched)
    .sort(([, a], [, b]) => Date.parse(b.lastOpenedAt ?? b.startedAt ?? "") - Date.parse(a.lastOpenedAt ?? a.startedAt ?? ""))
    .map(([id]) => lookup.get(id))
    .filter((movie): movie is CatalogMovie => Boolean(movie));
}

export function selectMyList(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  return movies.filter((movie) => getVideoState(library, movie.videoId).inMyList);
}

export function selectWatchAgain(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  return movies
    .filter((movie) => getVideoState(library, movie.videoId).watched)
    .sort((a, b) => Date.parse(getVideoState(library, b.videoId).watchedAt ?? "") - Date.parse(getVideoState(library, a.videoId).watchedAt ?? ""));
}
