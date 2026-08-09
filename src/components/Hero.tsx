import { Check, Info, Play, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { useLibrary } from "../context/LibraryContext";
import { useMovieDetails } from "../hooks/useMovieDetails";
import { getCategoryLabel } from "../config/categories";
import { getThumbnail, youtubeWatchUrl } from "../lib/movies";
import type { CatalogMovie } from "../types/catalog";
import styles from "../styles/app.module.css";

export function Hero({ movie }: { movie: CatalogMovie }) {
  const { stateFor, recordOpen, toggleMyList } = useLibrary();
  const { openMovie } = useMovieDetails();
  const state = stateFor(movie.videoId);
  const image = getThumbnail(movie);
  const heroStyle = image ? { backgroundImage: `url("${image.replaceAll('"', '%22')}")` } as CSSProperties : undefined;
  const excerpt = movie.description.length > 220 ? `${movie.description.slice(0, 217).trimEnd()}…` : movie.description;

  return (
    <section className={styles.hero} style={heroStyle} aria-labelledby="featured-title">
      <div className={styles.heroFallback} aria-hidden="true"><span>AMAGI</span></div>
      <div className={styles.heroGradient} />
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>THE AMAGIFLIX FEATURE</p>
        <h1 id="featured-title">{movie.title}</h1>
        <p className={styles.heroMeta}>{new Date(movie.publishedAt).getFullYear()} <span>•</span> {getCategoryLabel(movie.categories[0])}</p>
        <p className={styles.heroDescription}>{excerpt}</p>
        <div className={styles.heroActions}>
          <a className={`${styles.button} ${styles.buttonPrimary}`} href={youtubeWatchUrl(movie.videoId)} target="_blank" rel="noopener noreferrer" onClick={() => recordOpen(movie.videoId)}><Play fill="currentColor" /> Watch on YouTube</a>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => openMovie(movie.videoId)}><Info /> More Info</button>
          <button className={styles.roundButton} onClick={() => toggleMyList(movie.videoId)} aria-label={state.inMyList ? "Remove from My List" : "Add to My List"}>{state.inMyList ? <Check /> : <Plus />}</button>
        </div>
      </div>
    </section>
  );
}
