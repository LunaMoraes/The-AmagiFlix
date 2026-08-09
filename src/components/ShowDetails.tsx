import { Check, CheckCircle2, Play, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { getCategoryLabel } from "../config/categories";
import { useLibrary } from "../context/LibraryContext";
import { useMovieDetails } from "../hooks/useMovieDetails";
import { formatDuration } from "../lib/duration";
import { getShowState } from "../lib/library";
import { titleThumbnail } from "../lib/titles";
import { youtubeWatchUrl } from "../lib/movies";
import type { CatalogShow } from "../types/catalog";
import styles from "../styles/app.module.css";

export function ShowDetails({ shows }: { shows: CatalogShow[] }) {
  const { showId, closeShow } = useMovieDetails();
  const show = shows.find((item) => item.showId === showId);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const { library, recordOpen, resetVideoProgress, stateFor, toggleShowMyList, toggleWatched } = useLibrary();

  useEffect(() => {
    const element = dialog.current;
    if (!show || !element) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      returnFocus.current?.focus();
    };
  }, [show]);

  if (!show) return null;
  const state = getShowState(library, show);
  const artwork = titleThumbnail(show);
  const resumeEpisode = show.episodes.find((episode) => episode.videoId === state.resumeVideoId) ?? show.episodes[0];

  return (
    <dialog className={styles.detailsDialog} ref={dialog} onCancel={(event) => { event.preventDefault(); closeShow(); }} onClick={(event) => { if (event.target === event.currentTarget) closeShow(); }} aria-labelledby="show-details-title">
      <article className={styles.detailsPanel}>
        <button className={styles.dialogClose} onClick={closeShow} aria-label="Close show details"><X /></button>
        <div className={styles.detailsArtwork} style={artwork ? { backgroundImage: `url("${artwork.replaceAll('"', '%22')}")` } : undefined}>
          <div className={styles.detailsArtworkFallback} aria-hidden="true">A</div>
          <div className={styles.detailsArtworkGradient} />
          <div><span className={styles.detailsSeriesLabel}>Series</span><h2 id="show-details-title">{show.title}</h2></div>
        </div>
        <div className={styles.detailsBody}>
          <div className={styles.detailsActions}>
            <a className={`${styles.button} ${styles.buttonPrimary}`} href={youtubeWatchUrl(resumeEpisode.videoId)} target="_blank" rel="noopener noreferrer" onClick={() => recordOpen(resumeEpisode.videoId)}><Play fill="currentColor" /> {state.watched ? "Watch Again" : state.started ? "Resume" : "Play Episode 1"}</a>
            <button className={styles.roundButton} onClick={() => toggleShowMyList(show.showId)} aria-label={state.inMyList ? "Remove show from My List" : "Add show to My List"}>{state.inMyList ? <Check /> : <Plus />}</button>
          </div>
          <div className={styles.showOverview}>
            <div><p className={styles.detailsMeta}><span>{new Date(show.latestPublishedAt).getFullYear()}</span><span>{show.episodes.length} episode{show.episodes.length === 1 ? "" : "s"}</span>{state.watched && <span className={styles.markedWatched}><Check /> Watched</span>}</p><p className={styles.detailsDescription}>{show.description || "No description is available for this show."}</p></div>
            <dl className={styles.detailsFacts}><div><dt>Genres:</dt><dd>{show.categories.map(getCategoryLabel).join(", ")}</dd></div><div><dt>Playback:</dt><dd>YouTube</dd></div></dl>
          </div>
          <div className={styles.seasonHeading}><h3>Season {show.seasonNumber}</h3><span>{show.episodes.length} episode{show.episodes.length === 1 ? "" : "s"}</span></div>
          <ol className={styles.episodeList}>
            {show.episodes.map((episode) => {
              const episodeState = stateFor(episode.videoId);
              const progress = !episodeState.watched && episodeState.progress ? Math.round(Math.min(1, episodeState.progress.currentSeconds / episodeState.progress.durationSeconds) * 100) : undefined;
              const thumbnail = episode.thumbnails.medium ?? episode.thumbnails.high ?? episode.thumbnails.default;
              return <li key={episode.videoId} className={styles.episodeItem}>
                <span className={styles.episodeNumber}>{episode.episodeNumber}</span>
                <a className={styles.episodeArtwork} href={youtubeWatchUrl(episode.videoId)} target="_blank" rel="noopener noreferrer" onClick={() => recordOpen(episode.videoId)} aria-label={`Watch ${episode.episodeLabel} on YouTube`}>{thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <span aria-hidden="true"><Play fill="currentColor" /></span>}</a>
                <div className={styles.episodeCopy}>
                  <div className={styles.episodeTitleRow}><h4>{episode.episodeLabel}</h4>{formatDuration(episode.durationSeconds) && <span>{formatDuration(episode.durationSeconds)}</span>}</div>
                  <p>{episode.description || episode.title}</p>
                  {progress !== undefined && <div className={styles.episodeProgress} aria-label={`${progress}% watched`}><span style={{ width: `${progress}%` }} /></div>}
                  <div className={styles.episodeStatus}>{episodeState.watched ? <span className={styles.markedWatched}><Check /> Watched</span> : episodeState.started ? <span>{progress === undefined ? "Started" : `${progress}% watched`}</span> : <span>Not started</span>}</div>
                </div>
                <div className={styles.episodeActions}>
                  <button onClick={() => toggleWatched(episode.videoId)} aria-label={`${episodeState.watched ? "Mark as unwatched" : "Mark as watched"}: ${episode.episodeLabel}`}>{episodeState.watched ? <RotateCcw /> : <CheckCircle2 />}</button>
                  {(episodeState.progress || episodeState.started) && <button onClick={() => resetVideoProgress(episode.videoId)} aria-label={`Reset progress: ${episode.episodeLabel}`}><X /></button>}
                </div>
              </li>;
            })}
          </ol>
        </div>
      </article>
    </dialog>
  );
}
