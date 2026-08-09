import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { AMAGI_CHANNEL_HANDLE } from "../src/config/app";
import { classifyMovie, isFullMovieTitle } from "../src/lib/category-engine";
import { parseIsoDuration } from "../src/lib/duration";
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

async function resolveChannel(): Promise<{ channelId: string; uploadsPlaylistId: string }> {
  const response = await youtubeRequest<{
    items?: Array<{ id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
  }>("channels", { part: "contentDetails", forHandle: AMAGI_CHANNEL_HANDLE });
  const item = response.items?.[0];
  const channelId = item?.id;
  const uploadsPlaylistId = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!channelId || !uploadsPlaylistId || response.items?.length !== 1) {
    throw new Error(`Could not resolve one uploads playlist for ${AMAGI_CHANNEL_HANDLE}.`);
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

function normalizeMovie(video: YouTubeVideo, channelId: string): CatalogMovie | null {
  const { snippet, contentDetails } = video;
  if (!video.id || !snippet?.title || !snippet.publishedAt || snippet.channelId !== channelId || !isFullMovieTitle(snippet.title)) return null;
  const thumbnails = snippet.thumbnails ?? {};
  return {
    videoId: video.id,
    title: snippet.title.replace(/\s+/g, " ").trim(),
    description: (snippet.description ?? "").replace(/\s+/g, " ").trim(),
    publishedAt: snippet.publishedAt,
    durationSeconds: parseIsoDuration(contentDetails?.duration),
    thumbnails: {
      default: thumbnails.default?.url,
      medium: thumbnails.medium?.url,
      high: thumbnails.high?.url,
      standard: thumbnails.standard?.url,
      maxres: thumbnails.maxres?.url,
    },
    categories: classifyMovie({ title: snippet.title, description: snippet.description, tags: snippet.tags }),
  };
}

async function main(): Promise<void> {
  const { channelId, uploadsPlaylistId } = await resolveChannel();
  const uploadIds = await getUploadIds(uploadsPlaylistId);
  const rawVideos = await getVideos(uploadIds);
  const movies = rawVideos
    .map((video) => normalizeMovie(video, channelId))
    .filter((movie): movie is CatalogMovie => movie !== null)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  if (!movies.length) throw new Error("No eligible Full Movie videos were found; refusing to publish an empty catalog.");

  const unmatched = movies.filter((movie) => movie.categories.includes("other-full-movies"));
  if (unmatched.length) {
    console.warn(`Other Full Movies (${unmatched.length}):`);
    for (const movie of unmatched) console.warn(`- ${movie.title}`);
  }

  const catalog: CatalogFile = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceChannelId: channelId,
    movieCount: movies.length,
    movies,
  };

  const destination = resolve("public/data/catalog.json");
  const temporary = `${destination}.${process.pid}.tmp`;
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  console.log(`Generated ${movies.length} movies from channel ${channelId}.`);
}

await main();
