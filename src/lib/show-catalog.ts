import { classifyShow } from "./category-engine";
import { isFullMovieTitle } from "./category-engine";
import { CATEGORY_RULES } from "../config/categories";
import { SHOW_CATEGORY_OVERRIDES, type ShowCategoryOverrides } from "../config/show-category-overrides";
import { OTHER_CATEGORY_ID, OTHER_SHOWS_CATEGORY_ID } from "../config/app";
import type { CatalogArtwork, CatalogEpisode, CatalogMovie, CatalogShow } from "../types/catalog";

export interface ShowVideoCandidate {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  thumbnails: CatalogArtwork;
}

export interface ShowCatalogReport {
  shows: CatalogShow[];
  suppressed: Array<{ showId: string; title: string; movieVideoIds: string[]; episodeVideoIds: string[] }>;
  ambiguous: Array<{ showId: string; title: string; movieVideoId: string; movieTitle: string }>;
  warnings: string[];
}

export type ShowIdentityAliases = Record<string, string>;

const NUMBERED_SUFFIX = /\s*(?:[-–—:|]\s*)?[([\s]*(?:part|pt\.?|episode|ep\.?)\s*(\d+)\s*[)\]]?\s*$/i;
const FINAL_SUFFIX = /\s*(?:[-–—:|]\s*)?[([\s]*(?:final(?:\s+part)?|finale)\s*[)\]]?\s*$/i;
const FULL_MOVIE_MARKER = /\b(?:(?:updated\s+)?full\s+movie|compilation)\b/gi;

export function isShowCandidateTitle(title: string): boolean {
  return /^\s*what\s+if\b/i.test(title) && !isFullMovieTitle(title);
}

export function normalizeStoryIdentity(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseCandidate(candidate: ShowVideoCandidate) {
  const normalizedTitle = candidate.title.replace(/\s+/g, " ").trim();
  const numbered = normalizedTitle.match(NUMBERED_SUFFIX);
  const final = !numbered && FINAL_SUFFIX.test(normalizedTitle);
  const baseTitle = (numbered ? normalizedTitle.slice(0, numbered.index) : final ? normalizedTitle.replace(FINAL_SUFFIX, "") : normalizedTitle)
    .replace(/\s*[-–—:|]+\s*$/, "")
    .trim();
  return { candidate: { ...candidate, title: normalizedTitle }, baseTitle, identity: normalizeStoryIdentity(baseTitle), explicitNumber: numbered ? Number(numbered[1]) : undefined, final };
}

function stableShowId(identity: string): string {
  let hash = 0x811c9dc5;
  for (const character of identity) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const slug = identity.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "show";
  return `show-${slug}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function applyAlias(identity: string, aliases: ShowIdentityAliases): string {
  return normalizeStoryIdentity(aliases[identity] ?? identity);
}

function movieIdentity(title: string): string {
  return normalizeStoryIdentity(title.replace(FULL_MOVIE_MARKER, " "));
}

function resolveShowCategories(identity: string, searchableTitle: string, categoryOverrides: ShowCategoryOverrides): string[] {
  const overridden = categoryOverrides[identity] ?? [];
  const knownCategoryIds = new Set(CATEGORY_RULES.map((rule) => rule.id));
  const invalid = overridden.filter((categoryId) => !knownCategoryIds.has(categoryId) || categoryId === OTHER_CATEGORY_ID || categoryId === OTHER_SHOWS_CATEGORY_ID);
  if (invalid.length) throw new Error(`Unknown or fallback show category override(s) for "${identity}": ${invalid.join(", ")}.`);

  const selected = new Set([
    ...classifyShow({ title: searchableTitle }).filter((categoryId) => categoryId !== OTHER_SHOWS_CATEGORY_ID),
    ...overridden,
  ]);
  const categories = CATEGORY_RULES
    .filter((rule) => selected.has(rule.id))
    .sort((left, right) => left.priority - right.priority)
    .map((rule) => rule.id);
  return categories.length ? categories : [OTHER_SHOWS_CATEGORY_ID];
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(a.split(" "));
  const right = new Set(b.split(" "));
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / new Set([...left, ...right]).size;
}

function editSimilarity(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= a.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= b.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(previous[rightIndex] + 1, previous[rightIndex - 1] + 1, diagonal + (a[leftIndex - 1] === b[rightIndex - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length, 1);
}

export function aggregateShows(candidates: ShowVideoCandidate[], movies: CatalogMovie[], aliases: ShowIdentityAliases = {}, categoryOverrides: ShowCategoryOverrides = SHOW_CATEGORY_OVERRIDES): ShowCatalogReport {
  const warnings: string[] = [];
  const groups = new Map<string, ReturnType<typeof parseCandidate>[]>();
  for (const candidate of candidates.filter((item) => isShowCandidateTitle(item.title))) {
    const parsed = parseCandidate(candidate);
    const identity = applyAlias(parsed.identity, aliases);
    groups.set(identity, [...(groups.get(identity) ?? []), { ...parsed, identity }]);
  }

  const built = [...groups.entries()].map(([identity, entries]) => {
    const chronological = [...entries].sort((a, b) => Date.parse(a.candidate.publishedAt) - Date.parse(b.candidate.publishedAt));
    const maximumNumber = Math.max(0, ...entries.map((entry) => entry.explicitNumber ?? 0));
    const finalNumber = Math.max(maximumNumber + 1, entries.length);
    const ordered = [...entries].sort((a, b) => {
      const position = (entry: typeof a) => entry.final ? Number.MAX_SAFE_INTEGER : entry.explicitNumber ?? 1;
      return position(a) - position(b) || Date.parse(a.candidate.publishedAt) - Date.parse(b.candidate.publishedAt);
    });
    const episodes: CatalogEpisode[] = ordered.map((entry) => {
      const episodeNumber = entry.final ? finalNumber : entry.explicitNumber ?? 1;
      return { ...entry.candidate, episodeNumber, episodeLabel: entry.final ? "Final" : `Episode ${episodeNumber}` };
    });
    const numbered = episodes.map((episode) => episode.episodeNumber).filter((number) => number < finalNumber || !entries.some((entry) => entry.final));
    const duplicates = numbered.filter((number, index) => numbered.indexOf(number) !== index);
    if (duplicates.length) warnings.push(`${chronological[0].baseTitle}: duplicate episode number(s) ${[...new Set(duplicates)].join(", ")}.`);
    const uniqueNumbers = [...new Set(numbered)].sort((a, b) => a - b);
    for (let expected = 1; expected < (uniqueNumbers.at(-1) ?? 1); expected += 1) if (!uniqueNumbers.includes(expected)) warnings.push(`${chronological[0].baseTitle}: missing episode ${expected}.`);
    const first = chronological[0];
    const latestPublishedAt = chronological.at(-1)!.candidate.publishedAt;
    const show: CatalogShow = {
      showId: stableShowId(identity),
      title: first.baseTitle,
      description: first.candidate.description,
      latestPublishedAt,
      thumbnails: first.candidate.thumbnails,
      categories: resolveShowCategories(identity, `${first.baseTitle} ${episodes.map((episode) => episode.title).join(" ")}`, categoryOverrides),
      seasonNumber: 1,
      episodes,
    };
    return { identity, show };
  });

  const suppressed: ShowCatalogReport["suppressed"] = [];
  const ambiguous: ShowCatalogReport["ambiguous"] = [];
  const shows = built.filter(({ identity, show }) => {
    const matchingMovies = movies.filter((movie) => applyAlias(movieIdentity(movie.title), aliases) === identity);
    if (matchingMovies.length) {
      suppressed.push({ showId: show.showId, title: show.title, movieVideoIds: matchingMovies.map((movie) => movie.videoId), episodeVideoIds: show.episodes.map((episode) => episode.videoId) });
      return false;
    }
    for (const movie of movies) {
      const compared = applyAlias(movieIdentity(movie.title), aliases);
      if (compared !== identity && (tokenSimilarity(compared, identity) >= 0.75 || editSimilarity(compared, identity) >= 0.82)) ambiguous.push({ showId: show.showId, title: show.title, movieVideoId: movie.videoId, movieTitle: movie.title });
    }
    return true;
  }).map(({ show }) => show).sort((a, b) => Date.parse(b.latestPublishedAt) - Date.parse(a.latestPublishedAt));

  return { shows, suppressed, ambiguous, warnings };
}
