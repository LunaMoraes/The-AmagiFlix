export interface CatalogFile {
  schemaVersion: 1;
  generatedAt: string;
  sourceChannelId: string;
  movieCount: number;
  movies: CatalogMovie[];
  showCount: number;
  shows: CatalogShow[];
}

export interface CatalogArtwork {
  default?: string;
  medium?: string;
  high?: string;
  standard?: string;
  maxres?: string;
}

export interface CatalogMovie {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  thumbnails: CatalogArtwork;
  categories: string[];
  channelHandle?: string;
  channelName?: string;
  isExtended?: boolean;
}

export interface CatalogEpisode {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  thumbnails: CatalogArtwork;
  episodeNumber: number;
  episodeLabel: string;
  channelHandle?: string;
  channelName?: string;
  isExtended?: boolean;
}

export interface CatalogShow {
  showId: string;
  title: string;
  description: string;
  latestPublishedAt: string;
  thumbnails: CatalogArtwork;
  categories: string[];
  seasonNumber: 1;
  episodes: CatalogEpisode[];
  channelHandle?: string;
  channelName?: string;
  isExtended?: boolean;
}

export type CatalogTitle = CatalogMovie | CatalogShow;
