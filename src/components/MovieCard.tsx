import { Check, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { isShow, titleId, titleThumbnail } from "../lib/titles";
import type { CatalogTitle } from "../types/catalog";
import type { ResolvedTitleState } from "../types/library";
import styles from "../styles/app.module.css";

interface MovieCardProps {
  title: CatalogTitle;
  state: ResolvedTitleState;
  onOpen(title: CatalogTitle): void;
}

const artworkStyle = (title: CatalogTitle) => {
  const hue = [...titleId(title)].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
  return { "--art-hue": hue } as CSSProperties;
};

export function MovieCard({ title, state, onOpen }: MovieCardProps) {
  const thumbnail = titleThumbnail(title);
  const progress = !state.watched && state.progress ? Math.max(0, Math.min(1, state.progress.currentSeconds / state.progress.durationSeconds)) : undefined;
  return (
    <button className={styles.movieCard} style={artworkStyle(title)} onClick={() => onOpen(title)} aria-label={`More information about ${title.title}`}>
      <span className={styles.cardArtwork}>
        {thumbnail ? <img src={thumbnail} alt="" loading="lazy" decoding="async" /> : <span className={styles.placeholderArt} aria-hidden="true">A</span>}
      </span>
      <span className={styles.cardShade} />
      <span className={styles.cardTitle}>{title.title}</span>
      <span className={styles.cardBadges}>
        {isShow(title) && <span className={styles.seriesBadge}>Series</span>}
        {state.watched && <span className={styles.watchedBadge}><Check aria-hidden="true" /> Watched</span>}
        {!state.watched && !state.progress && state.started && <span className={styles.startedBadge}>Started</span>}
        {state.inMyList && <span className={styles.iconBadge} aria-label="In My List"><Plus aria-hidden="true" /></span>}
      </span>
      {progress !== undefined && <span className={styles.cardProgress} aria-label={`${Math.round(progress * 100)}% watched`}><span style={{ width: `${progress * 100}%` }} /><b>{Math.round(progress * 100)}%</b></span>}
    </button>
  );
}
