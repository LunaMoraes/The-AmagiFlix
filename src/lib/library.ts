import type { CatalogMovie, CatalogShow, CatalogTitle } from "../types/catalog";
import type { ExtensionVideoState, ImportedWatchState, LocalLibrary, ResolvedShowState, ResolvedTitleState, ResolvedVideoState, WebVideoState } from "../types/library";
import { isShow } from "./titles";

export const EMPTY_LIBRARY: LocalLibrary = { schemaVersion: 2, videos: {}, shows: {} };

const emptyVideo = (): WebVideoState => ({ inMyList: false });

const timestamp = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;

export function resolveVideoState(state: WebVideoState = emptyVideo()): ResolvedVideoState {
  const positiveEvidence = [
    state.historyImport ? { at: state.historyImport.importedAt, source: "history-import" as const } : undefined,
    state.extension?.watched ? { at: state.extension.lastWatchedAt ?? state.extension.lastObservedAt, source: "extension" as const } : undefined,
    state.manualDecision?.watched ? { at: state.manualDecision.changedAt, source: "manual" as const } : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const latestPositive = positiveEvidence.sort((a, b) => timestamp(b.at) - timestamp(a.at))[0];
  const manualFalseAt = state.manualDecision?.watched === false ? timestamp(state.manualDecision.changedAt) : 0;
  const watched = Boolean(latestPositive) && manualFalseAt <= timestamp(latestPositive?.at);
  const progress = state.extension?.progress;
  const sources = new Set(state.extension?.sources ?? []);
  if (state.historyImport) sources.add("history-import");
  if (state.manualDecision) sources.add("manual");
  return {
    ...state,
    started: Boolean(state.startedAt || state.extension?.started || progress),
    watched,
    ...(watched && latestPositive?.at ? { watchedAt: latestPositive.at } : {}),
    ...(progress ? { progress } : {}),
    sources: [...sources],
  };
}

export const getVideoState = (library: LocalLibrary, videoId: string): ResolvedVideoState => resolveVideoState(library.videos[videoId]);

function updateVideo(library: LocalLibrary, videoId: string, update: (state: WebVideoState) => WebVideoState): LocalLibrary {
  return {
    schemaVersion: 2,
    videos: { ...library.videos, [videoId]: update(library.videos[videoId] ?? emptyVideo()) },
    shows: library.shows,
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
  const watched = getVideoState(library, videoId).watched;
  return updateVideo(library, videoId, (state) => ({ ...state, manualDecision: { watched: !watched, changedAt: now } }));
}

export function toggleMyList(library: LocalLibrary, videoId: string): LocalLibrary {
  return updateVideo(library, videoId, (state) => ({ ...state, inMyList: !state.inMyList }));
}

export function toggleShowMyList(library: LocalLibrary, showId: string): LocalLibrary {
  return {
    ...library,
    shows: { ...library.shows, [showId]: { inMyList: !library.shows[showId]?.inMyList } },
  };
}

export function mergeImportedHistory(library: LocalLibrary, records: ImportedWatchState[]): LocalLibrary {
  return records.reduce((next, record) => updateVideo(next, record.videoId, (state) => ({
    ...state,
    historyImport: state.historyImport ? {
      ...record,
      firstKnownWatchedAt: [state.historyImport.firstKnownWatchedAt, record.firstKnownWatchedAt].filter(Boolean).sort()[0],
      lastKnownWatchedAt: [state.historyImport.lastKnownWatchedAt, record.lastKnownWatchedAt].filter(Boolean).sort().at(-1),
      importCount: Math.max(state.historyImport.importCount, record.importCount),
    } : record,
  })), library);
}

export function mergeExtensionStates(library: LocalLibrary, states: ExtensionVideoState[]): LocalLibrary {
  return states.reduce((next, extension) => updateVideo(next, extension.videoId, (state) => ({ ...state, extension })), library);
}

export function clearImportedHistory(library: LocalLibrary): LocalLibrary {
  return {
    ...library,
    videos: Object.fromEntries(Object.entries(library.videos).map(([videoId, state]) => [videoId, { ...state, historyImport: undefined }])),
  };
}

export function resetProgress(library: LocalLibrary, videoId: string): LocalLibrary {
  return updateVideo(library, videoId, (state) => ({
    ...state,
    startedAt: undefined,
    lastOpenedAt: undefined,
    extension: state.extension ? { ...state.extension, started: false, progress: undefined, firstStartedAt: undefined, lastObservedAt: undefined } : undefined,
  }));
}

const movieById = (movies: CatalogMovie[]) => new Map(movies.map((movie) => [movie.videoId, movie]));

export function selectContinueWatching(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  const lookup = movieById(movies);
  return Object.entries(library.videos)
    .filter(([, state]) => { const resolved = resolveVideoState(state); return resolved.started && !resolved.watched; })
    .sort(([, a], [, b]) => timestamp(resolveVideoState(b).progress?.measuredAt ?? b.extension?.lastObservedAt ?? b.lastOpenedAt ?? b.startedAt) - timestamp(resolveVideoState(a).progress?.measuredAt ?? a.extension?.lastObservedAt ?? a.lastOpenedAt ?? a.startedAt))
    .map(([id]) => lookup.get(id))
    .filter((movie): movie is CatalogMovie => Boolean(movie));
}

export function selectMyList(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  return movies.filter((movie) => getVideoState(library, movie.videoId).inMyList);
}

export function selectWatchAgain(movies: CatalogMovie[], library: LocalLibrary): CatalogMovie[] {
  return movies
    .filter((movie) => getVideoState(library, movie.videoId).watched)
    .sort((a, b) => timestamp(getVideoState(library, b.videoId).watchedAt) - timestamp(getVideoState(library, a.videoId).watchedAt));
}

export function getShowState(library: LocalLibrary, show: CatalogShow): ResolvedShowState {
  const episodeStates = show.episodes.map((episode) => ({ episode, state: getVideoState(library, episode.videoId) }));
  const started = episodeStates.some(({ state }) => state.started);
  const watched = episodeStates.length > 0 && episodeStates.every(({ state }) => state.watched);
  const startedIncomplete = episodeStates.find(({ state }) => state.started && !state.watched);
  const earliestUnwatched = episodeStates.find(({ state }) => !state.watched);
  const resume = startedIncomplete ?? earliestUnwatched ?? episodeStates[0];
  const watchedAt = watched
    ? episodeStates.map(({ state }) => state.watchedAt).filter((value): value is string => Boolean(value)).sort((a, b) => timestamp(b) - timestamp(a))[0]
    : undefined;
  const sources = new Set(episodeStates.flatMap(({ state }) => state.sources));
  return {
    inMyList: library.shows[show.showId]?.inMyList === true,
    started,
    watched,
    ...(watchedAt ? { watchedAt } : {}),
    ...(resume?.state.progress ? { progress: resume.state.progress } : {}),
    sources: [...sources],
    resumeVideoId: resume?.episode.videoId ?? show.episodes[0]?.videoId ?? "",
  };
}

export function getTitleState(library: LocalLibrary, title: CatalogTitle): ResolvedTitleState {
  return isShow(title) ? getShowState(library, title) : getVideoState(library, title.videoId);
}

function showActivity(library: LocalLibrary, show: CatalogShow): number {
  return Math.max(0, ...show.episodes.map(({ videoId }) => {
    const state = library.videos[videoId];
    return timestamp(resolveVideoState(state).progress?.measuredAt ?? state?.extension?.lastObservedAt ?? state?.lastOpenedAt ?? state?.startedAt);
  }));
}

export function selectContinueWatchingTitles(movies: CatalogMovie[], shows: CatalogShow[], library: LocalLibrary): CatalogTitle[] {
  const moviesWithActivity = movies
    .filter((movie) => { const state = getVideoState(library, movie.videoId); return state.started && !state.watched; })
    .map((title) => ({ title, activity: timestamp(getVideoState(library, title.videoId).progress?.measuredAt ?? library.videos[title.videoId]?.extension?.lastObservedAt ?? library.videos[title.videoId]?.lastOpenedAt ?? library.videos[title.videoId]?.startedAt) }));
  const showsWithActivity = shows
    .filter((show) => { const state = getShowState(library, show); return state.started && !state.watched; })
    .map((title) => ({ title, activity: showActivity(library, title) }));
  return [...moviesWithActivity, ...showsWithActivity].sort((a, b) => b.activity - a.activity).map(({ title }) => title);
}

export function selectWatchAgainTitles(movies: CatalogMovie[], shows: CatalogShow[], library: LocalLibrary): CatalogTitle[] {
  return [...movies, ...shows]
    .filter((title) => getTitleState(library, title).watched)
    .sort((a, b) => timestamp(getTitleState(library, b).watchedAt) - timestamp(getTitleState(library, a).watchedAt));
}

export function selectMyListTitles(movies: CatalogMovie[], shows: CatalogShow[], library: LocalLibrary): CatalogTitle[] {
  return [...movies.filter((movie) => getVideoState(library, movie.videoId).inMyList), ...shows.filter((show) => getShowState(library, show).inMyList)];
}

export function selectRecommendedTitles(randomizedTitles: CatalogTitle[], library: LocalLibrary, limit = 20): CatalogTitle[] {
  return randomizedTitles.filter((title) => {
    const state = getTitleState(library, title);
    return !state.started && !state.watched;
  }).slice(0, limit);
}
