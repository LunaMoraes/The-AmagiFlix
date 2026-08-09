export interface LocalLibrary {
  schemaVersion: 1;
  videos: Record<string, LocalVideoState>;
}

export interface LocalVideoState {
  startedAt?: string;
  lastOpenedAt?: string;
  watched: boolean;
  watchedAt?: string;
  inMyList: boolean;
}
