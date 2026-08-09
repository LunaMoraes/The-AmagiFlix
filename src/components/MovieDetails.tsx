import { Check, CheckCircle2, Play, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { getCategoryLabel } from "../config/categories";
import { useLibrary } from "../context/LibraryContext";
import { formatDuration } from "../lib/duration";
import { getThumbnail, youtubeWatchUrl } from "../lib/movies";
import { useMovieDetails } from "../hooks/useMovieDetails";
import type { CatalogMovie } from "../types/catalog";
import styles from "../styles/app.module.css";

export function MovieDetails({ movies }: { movies: CatalogMovie[] }) {
  const { movieId, closeMovie } = useMovieDetails();
  const movie = movies.find((item) => item.videoId === movieId);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const { stateFor, recordOpen, resetVideoProgress, toggleMyList, toggleWatched } = useLibrary();

  useEffect(() => {
    const element = dialog.current;
    if (!movie || !element) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      returnFocus.current?.focus();
    };
  }, [movie]);

  if (!movie) return null;
  const state = stateFor(movie.videoId);
  const thumbnail = getThumbnail(movie);
  const duration = formatDuration(movie.durationSeconds);
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(movie.publishedAt));
  const progressPercent = state.progress ? Math.round(Math.min(1, state.progress.currentSeconds / state.progress.durationSeconds) * 100) : undefined;

  return (
    <dialog className={styles.detailsDialog} ref={dialog} onCancel={(event) => { event.preventDefault(); closeMovie(); }} onClick={(event) => { if (event.target === event.currentTarget) closeMovie(); }} aria-labelledby="details-title">
      <article className={styles.detailsPanel}>
        <button className={styles.dialogClose} onClick={closeMovie} aria-label="Close details"><X /></button>
        <div className={styles.detailsArtwork} style={thumbnail ? { backgroundImage: `url("${thumbnail.replaceAll('"', '%22')}")` } : undefined}>
          <div className={styles.detailsArtworkFallback} aria-hidden="true">A</div>
          <div className={styles.detailsArtworkGradient} />
          <h2 id="details-title">{movie.title}</h2>
        </div>
        <div className={styles.detailsBody}>
          <div className={styles.detailsActions}>
            <a className={`${styles.button} ${styles.buttonPrimary}`} href={youtubeWatchUrl(movie.videoId)} target="_blank" rel="noopener noreferrer" onClick={() => recordOpen(movie.videoId)}><Play fill="currentColor" /> Watch on YouTube</a>
            <button className={styles.roundButton} onClick={() => toggleMyList(movie.videoId)} aria-label={state.inMyList ? "Remove from My List" : "Add to My List"}>{state.inMyList ? <Check /> : <Plus />}</button>
            <button className={styles.roundButton} onClick={() => toggleWatched(movie.videoId)} aria-label={state.watched ? "Mark as unwatched" : "Mark as watched"}>{state.watched ? <RotateCcw /> : <CheckCircle2 />}</button>
            {(state.progress || state.started) && <button className={styles.roundButton} onClick={() => resetVideoProgress(movie.videoId)} aria-label="Reset progress"><X /></button>}
          </div>
          <div className={styles.detailsColumns}>
            <div>
              <p className={styles.detailsMeta}><span>{date}</span>{duration && <span>{duration}</span>}{state.watched && <span className={styles.markedWatched}><Check /> Watched</span>}{!state.watched && progressPercent !== undefined && <span>{progressPercent}% watched</span>}{!state.watched && state.started && progressPercent === undefined && <span>Started</span>}</p>
              {!state.watched && state.progress && <div className={styles.detailsProgress} aria-label={`${progressPercent}% watched`}><span style={{ width: `${progressPercent}%` }} /></div>}
              <p className={styles.detailsDescription}>{movie.description || "No description is available for this movie."}</p>
            </div>
            <dl className={styles.detailsFacts}>
              <div><dt>Genres:</dt><dd>{movie.categories.map(getCategoryLabel).join(", ")}</dd></div>
              <div><dt>Playback:</dt><dd>YouTube</dd></div>
              {state.historyImport && <div><dt>History:</dt><dd>Imported{state.historyImport.lastKnownWatchedAt ? ` · ${new Date(state.historyImport.lastKnownWatchedAt).toLocaleDateString()}` : ""}</dd></div>}
            </dl>
          </div>
        </div>
      </article>
    </dialog>
  );
}
