export interface CatalogFile {
  schemaVersion: 1;
  generatedAt: string;
  sourceChannelId: string;
  movieCount: number;
  movies: CatalogMovie[];
}

export interface CatalogMovie {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number | null;
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
    standard?: string;
    maxres?: string;
  };
  categories: string[];
}
