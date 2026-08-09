export const MIN_MEANINGFUL_WATCH_SECONDS = 30;
export const COMPLETE_THRESHOLD = 0.9;
export const CHECKPOINT_INTERVAL_MS = 15_000;

export function isComplete(currentSeconds: number, durationSeconds: number, ended = false) {
  return ended || (Number.isFinite(currentSeconds) && Number.isFinite(durationSeconds) && durationSeconds > 0 && currentSeconds / durationSeconds >= COMPLETE_THRESHOLD);
}
