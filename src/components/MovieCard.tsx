import { Check, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { getThumbnail } from "../lib/movies";
import type { CatalogMovie } from "../types/catalog";
import type { LocalVideoState } from "../types/library";
import styles from "../styles/app.module.css";

interface MovieCardProps {
  movie: CatalogMovie;
  state: LocalVideoState;
  onOpen(movie: CatalogMovie): void;
}

const artworkStyle = (movie: CatalogMovie) => {
  const hue = [...movie.videoId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
  return { "--art-hue": hue } as CSSProperties;
};

export function MovieCard({ movie, state, onOpen }: MovieCardProps) {
  const thumbnail = getThumbnail(movie);
  return (
    <button className={styles.movieCard} style={artworkStyle(movie)} onClick={() => onOpen(movie)} aria-label={`More information about ${movie.title}`}>
      <span className={styles.cardArtwork}>
        {thumbnail ? <img src={thumbnail} alt="" loading="lazy" decoding="async" /> : <span className={styles.placeholderArt} aria-hidden="true">A</span>}
      </span>
      <span className={styles.cardShade} />
      <span className={styles.cardTitle}>{movie.title}</span>
      <span className={styles.cardBadges}>
        {state.watched && <span className={styles.watchedBadge}><Check aria-hidden="true" /> Watched</span>}
        {state.inMyList && <span className={styles.iconBadge} aria-label="In My List"><Plus aria-hidden="true" /></span>}
      </span>
    </button>
  );
}
