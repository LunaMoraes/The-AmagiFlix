import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CHANNELS, type ChannelConfig } from "../src/config/channels";
import { classifyMovie, isFullMovieTitle } from "../src/lib/category-engine";
import { SHOW_IDENTITY_ALIASES } from "../src/config/show-aliases";
import { parseIsoDuration } from "../src/lib/duration";
import { normalizeCatalogDescription } from "../src/lib/description";
import { aggregateShows, isShowCandidateTitle, type ShowVideoCandidate } from "../src/lib/show-catalog";
import type { CatalogFile, CatalogMovie } from "../src/types/catalog";

const API_ROOT = "https://youtube.googleapis.com/youtube/v3";
const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  throw new Error("YOUTUBE_API_KEY is required to build the live catalog.");
}

interface ApiErrorBody {
  error?: { message?: string };
}

async function youtubeRequest<T>(method: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ ...params, key: apiKey! });
  const response = await fetch(`${API_ROOT}/${method}?${query}`);
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as ApiErrorBody;
      detail = body.error?.message ? `: ${body.error.message}` : "";
    } catch {
      // Status and method are enough; never echo the credential-bearing URL.
    }
    throw new Error(`YouTube ${method} failed (${response.status})${detail}`);
  }
  return (await response.json()) as T;
}

async function resolveChannel(handle: string): Promise<{ channelId: string; uploadsPlaylistId: string }> {
  const response = await youtubeRequest<{
    items?: Array<{ id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
  }>("channels", { part: "contentDetails", forHandle: handle });
  const item = response.items?.[0];
  const channelId = item?.id;
  const uploadsPlaylistId = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!channelId || !uploadsPlaylistId || response.items?.length !== 1) {
    throw new Error(`Could not resolve one uploads playlist for ${handle}.`);
  }
  return { channelId, uploadsPlaylistId };
}

async function getUploadIds(playlistId: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const response = await youtubeRequest<{
      nextPageToken?: string;
      items?: Array<{ contentDetails?: { videoId?: string } }>;
    }>("playlistItems", {
      part: "contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of response.items ?? []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  if (!ids.length) throw new Error("The uploads playlist returned no videos.");
  return [...new Set(ids)];
}

interface YouTubeVideo {
  id?: string;
  snippet?: {
    channelId?: string;
    title?: string;
    description?: string;
    publishedAt?: string;
    tags?: string[];
    thumbnails?: Record<string, { url?: string }>;
  };
  contentDetails?: { duration?: string };
}

async function getVideos(ids: string[]): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  for (let index = 0; index < ids.length; index += 50) {
    const response = await youtubeRequest<{ items?: YouTubeVideo[] }>("videos", {
      part: "snippet,contentDetails",
      id: ids.slice(index, index + 50).join(","),
      maxResults: "50",
    });
    videos.push(...(response.items ?? []));
  }
  return videos;
}

function normalizeMovie(video: YouTubeVideo, channelId: string, channel: ChannelConfig): CatalogMovie | null {
  const { snippet, contentDetails } = video;
  if (!video.id || !snippet?.title || !snippet.publishedAt || snippet.channelId !== channelId || !isFullMovieTitle(snippet.title)) return null;
  const thumbnails = snippet.thumbnails ?? {};
  return {
    videoId: video.id,
    title: snippet.title.replace(/\s+/g, " ").trim(),
    description: normalizeCatalogDescription(snippet.description ?? ""),
    publishedAt: snippet.publishedAt,
    durationSeconds: parseIsoDuration(contentDetails?.duration),
    thumbnails: {
      default: thumbnails.default?.url,
      medium: thumbnails.medium?.url,
      high: thumbnails.high?.url,
      standard: thumbnails.standard?.url,
      maxres: thumbnails.maxres?.url,
    },
    categories: classifyMovie({ title: snippet.title }),
    channelHandle: channel.handle,
    channelName: channel.name,
    isExtended: !channel.isPrimary,
  };
}

function normalizeShowCandidate(video: YouTubeVideo, channelId: string, channel: ChannelConfig): (ShowVideoCandidate & { channelHandle?: string; channelName?: string; isExtended?: boolean }) | null {
  const { snippet, contentDetails } = video;
  if (!video.id || !snippet?.title || !snippet.publishedAt || snippet.channelId !== channelId || !isShowCandidateTitle(snippet.title)) return null;
  const thumbnails = snippet.thumbnails ?? {};
  return {
    videoId: video.id,
    title: snippet.title.replace(/\s+/g, " ").trim(),
    description: normalizeCatalogDescription(snippet.description ?? ""),
    publishedAt: snippet.publishedAt,
    durationSeconds: parseIsoDuration(contentDetails?.duration),
    thumbnails: {
      default: thumbnails.default?.url,
      medium: thumbnails.medium?.url,
      high: thumbnails.high?.url,
      standard: thumbnails.standard?.url,
      maxres: thumbnails.maxres?.url,
    },
    channelHandle: channel.handle,
    channelName: channel.name,
    isExtended: !channel.isPrimary,
  };
}

async function main(): Promise<void> {
  const allMovies: CatalogMovie[] = [];
  const allShowCandidates: ShowVideoCandidate[] = [];
  let primaryChannelId = "";

  for (const channel of CHANNELS) {
    try {
      console.log(`Resolving channel: ${channel.name} (${channel.handle})...`);
      const { channelId, uploadsPlaylistId } = await resolveChannel(channel.handle);
      if (channel.isPrimary) primaryChannelId = channelId;

      const uploadIds = await getUploadIds(uploadsPlaylistId);
      const rawVideos = await getVideos(uploadIds);

      const channelMovies = rawVideos
        .map((video) => normalizeMovie(video, channelId, channel))
        .filter((movie): movie is CatalogMovie => movie !== null);

      const channelShowCandidates = rawVideos
        .map((video) => normalizeShowCandidate(video, channelId, channel))
        .filter((candidate): candidate is ShowVideoCandidate => candidate !== null);

      allMovies.push(...channelMovies);
      allShowCandidates.push(...channelShowCandidates);
      console.log(`Fetched ${channelMovies.length} movies and ${channelShowCandidates.length} show candidates from ${channel.name}.`);
    } catch (error) {
      if (channel.isPrimary) throw error;
      console.warn(`Failed to fetch extended channel ${channel.handle}:`, error);
    }
  }

  const movies = allMovies.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const showCatalog = aggregateShows(allShowCandidates, movies, SHOW_IDENTITY_ALIASES);

  if (!movies.length) throw new Error("No eligible Full Movie videos were found; refusing to publish an empty catalog.");

  const unmatched = movies.filter((movie) => movie.categories.includes("other-full-movies"));
  if (unmatched.length) {
    console.warn(`Uncategorized Full Movies (${unmatched.length}):`);
    for (const movie of unmatched) console.warn(`- ${movie.title}`);
  }

  for (const show of showCatalog.shows) console.log(`Show: ${show.title} (${show.episodes.length} episode${show.episodes.length === 1 ? "" : "s"})`);
  for (const item of showCatalog.suppressed) console.log(`Suppressed show: ${item.title} -> Full Movie ${item.movieVideoIds.join(", ")}`);
  for (const item of showCatalog.ambiguous) console.warn(`Ambiguous show/movie match left visible: ${item.title} <> ${item.movieTitle} (${item.movieVideoId})`);
  for (const warning of showCatalog.warnings) console.warn(`Show warning: ${warning}`);
  const uncategorizedShows = showCatalog.shows.filter((show) => show.categories.includes("other-shows"));
  if (uncategorizedShows.length) {
    console.warn(`Uncategorized Shows (${uncategorizedShows.length}):`);
    for (const show of uncategorizedShows) console.warn(`- ${show.title}`);
  }

  const catalog: CatalogFile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceChannelId: primaryChannelId || "multi-channel",
    movieCount: movies.length,
    movies,
    showCount: showCatalog.shows.length,
    shows: showCatalog.shows,
  };

  if (catalog.movieCount !== catalog.movies.length || catalog.showCount !== catalog.shows.length || catalog.shows.some((show) => !show.showId || !show.episodes.length)) throw new Error("Generated catalog failed validation.");

  const destination = resolve("public/data/catalog.json");
  const temporary = `${destination}.${process.pid}.tmp`;
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  console.log(`Generated ${movies.length} movies and ${showCatalog.shows.length} shows across configured channels.`);
}

await main();
