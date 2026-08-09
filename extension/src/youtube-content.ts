import type { TrackerCheckpoint } from "./storage";
import { activeVideoElement, currentVideoId, isAdPlaying } from "./youtube-adapter";
import { CHECKPOINT_INTERVAL_MS, isComplete, MIN_MEANINGFUL_WATCH_SECONDS } from "./tracking-rules";

let trackedId: string | undefined;
let video: HTMLVideoElement | undefined;
let playedSeconds = 0;
let lastTick = performance.now();
let checkpointPending = false;
let session = 0;

function send<T>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

async function checkpoint(completed = false) {
  if (!trackedId || !video || checkpointPending || isAdPlaying()) return;
  if (!Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) return;
  const started = playedSeconds >= MIN_MEANINGFUL_WATCH_SECONDS;
  const ratioComplete = isComplete(video.currentTime, video.duration);
  if (!started && !completed && !ratioComplete) return;
  checkpointPending = true;
  const payload: TrackerCheckpoint = {
    videoId: trackedId,
    started,
    completed: completed || ratioComplete,
    progress: {
      currentSeconds: Math.max(0, Math.min(video.currentTime, video.duration)),
      durationSeconds: video.duration,
      measuredAt: new Date().toISOString(),
    },
  };
  try { await send({ type: "AMAGIFLIX_TRACKER_CHECKPOINT", checkpoint: payload }); } finally { checkpointPending = false; }
}

function accumulatePlayback() {
  const now = performance.now();
  const elapsed = Math.min((now - lastTick) / 1_000, 2);
  lastTick = now;
  if (video && !video.paused && !video.ended && !isAdPlaying()) playedSeconds += elapsed;
}

const onPause = () => { accumulatePlayback(); void checkpoint(); };
const onEnded = () => { accumulatePlayback(); void checkpoint(true); };
const onPlaying = () => { lastTick = performance.now(); };
const onTimeUpdate = () => accumulatePlayback();

function detach() {
  void checkpoint();
  video?.removeEventListener("pause", onPause);
  video?.removeEventListener("ended", onEnded);
  video?.removeEventListener("playing", onPlaying);
  video?.removeEventListener("timeupdate", onTimeUpdate);
  video = undefined;
  trackedId = undefined;
  playedSeconds = 0;
}

async function bindForCurrentPage() {
  const token = ++session;
  const nextId = currentVideoId();
  if (nextId === trackedId && video?.isConnected) return;
  detach();
  if (!nextId) return;
  const response = await send<{ tracked: boolean }>({ type: "AMAGIFLIX_CHECK_VIDEO", videoId: nextId });
  if (token !== session || !response?.tracked) return;
  for (let attempt = 0; attempt < 40 && token === session; attempt += 1) {
    const candidate = activeVideoElement();
    if (candidate) {
      trackedId = nextId;
      video = candidate;
      lastTick = performance.now();
      video.addEventListener("pause", onPause);
      video.addEventListener("ended", onEnded);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("timeupdate", onTimeUpdate);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "AMAGIFLIX_NAVIGATED") void bindForCurrentPage();
});

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void checkpoint(); });
window.addEventListener("pagehide", () => { void checkpoint(); });
new MutationObserver(() => { if (trackedId && !video?.isConnected) void bindForCurrentPage(); }).observe(document.documentElement, { childList: true, subtree: true });
setInterval(() => { accumulatePlayback(); void checkpoint(); }, CHECKPOINT_INTERVAL_MS);
setInterval(() => { if (currentVideoId() !== trackedId || (trackedId && !video?.isConnected)) void bindForCurrentPage(); }, 1_000);
void bindForCurrentPage();
