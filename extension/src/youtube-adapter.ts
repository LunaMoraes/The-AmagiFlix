export function currentVideoId(url = window.location.href): string | undefined {
  try {
    const parsed = new URL(url);
    const id = parsed.pathname === "/watch" ? parsed.searchParams.get("v") : undefined;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : undefined;
  } catch { return undefined; }
}

export function activeVideoElement(): HTMLVideoElement | undefined {
  const video = document.querySelector<HTMLVideoElement>("video.html5-main-video") ?? document.querySelector<HTMLVideoElement>("video");
  return video && Number.isFinite(video.duration) && video.duration > 0 ? video : undefined;
}

export function isAdPlaying() {
  const player = document.querySelector("#movie_player");
  return Boolean(player?.classList.contains("ad-showing") || document.querySelector(".ytp-ad-player-overlay, .video-ads.ytp-ad-module:not(:empty)"));
}
