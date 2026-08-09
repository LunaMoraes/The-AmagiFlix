import { Check, Info, Play, Plus } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FocusEvent } from "react";
import { getCategoryLabel } from "../config/categories";
import { useLibrary } from "../context/LibraryContext";
import { useMovieDetails } from "../hooks/useMovieDetails";
import { getShowState } from "../lib/library";
import { youtubeWatchUrl } from "../lib/movies";
import { isShow, titlePublishedAt, titleThumbnail } from "../lib/titles";
import type { CatalogTitle } from "../types/catalog";
import styles from "../styles/app.module.css";

const CAROUSEL_INTERVAL_MS = 8_000;

export function Hero({ title }: { title: CatalogTitle }) {
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const [paused, setPaused] = useState(false);
  const { library, recordOpen, stateFor, toggleMyList, toggleShowMyList } = useLibrary();
  const { openMovie, openShow } = useMovieDetails();
  const show = isShow(title);
  const featureState = isShow(title) ? (() => {
    const state = getShowState(library, title);
    const resumeEpisode = title.episodes.find((episode) => episode.videoId === state.resumeVideoId) ?? title.episodes[0];
    return { state, playbackVideoId: resumeEpisode.videoId };
  })() : { state: stateFor(title.videoId), playbackVideoId: title.videoId };
  const { state, playbackVideoId } = featureState;
  const image = titleThumbnail(title);
  const featureStyle = image ? { backgroundImage: `url("${image.replaceAll('"', "%22")}")` } as CSSProperties : undefined;
  const excerpt = title.description.length > 220 ? `${title.description.slice(0, 217).trimEnd()}…` : title.description;

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setActiveSlide((current) => current === 0 ? 1 : 0), CAROUSEL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeSlide, paused, title]);

  const leaveFocus = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };

  const toggleTitleMyList = () => isShow(title) ? toggleShowMyList(title.showId) : toggleMyList(title.videoId);
  const openDetails = () => isShow(title) ? openShow(title.showId) : openMovie(title.videoId);
  const primaryLabel = show ? state.watched ? "Watch Again" : state.started ? "Resume" : "Play Episode 1" : "Watch on YouTube";

  return (
    <section
      className={styles.hero}
      aria-label="Featured carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={leaveFocus}
    >
      <div className={`${styles.heroBackdrop} ${styles.heroBrandBackdrop} ${activeSlide === 0 ? styles.heroBackdropActive : ""}`} aria-hidden="true"><span>AMAGI</span></div>
      <div className={`${styles.heroBackdrop} ${styles.heroFeatureBackdrop} ${activeSlide === 1 ? styles.heroBackdropActive : ""}`} style={featureStyle} aria-hidden="true" />
      <div className={styles.heroGradient} />

      {activeSlide === 0 ? (
        <div className={`${styles.heroContent} ${styles.heroBrandContent}`} key="brand">
          <h1 className={styles.heroBrandWordmark} aria-label="The AmagiFlix"><span>THE</span> AMAGIFLIX</h1>
        </div>
      ) : (
        <div className={styles.heroContent} key="feature">
          <p className={styles.eyebrow}>THE AMAGIFLIX FEATURE</p>
          <h1>{title.title}</h1>
          <p className={styles.heroMeta}>{new Date(titlePublishedAt(title)).getFullYear()} <span>•</span> {show && <>Series <span>•</span> </>}{getCategoryLabel(title.categories[0])}</p>
          <p className={styles.heroDescription}>{excerpt}</p>
          <div className={styles.heroActions}>
            <a className={`${styles.button} ${styles.buttonPrimary}`} href={youtubeWatchUrl(playbackVideoId)} target="_blank" rel="noopener noreferrer" onClick={() => recordOpen(playbackVideoId)}><Play fill="currentColor" /> {primaryLabel}</a>
            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={openDetails}><Info /> More Info</button>
            <button className={styles.roundButton} onClick={toggleTitleMyList} aria-label={state.inMyList ? "Remove from My List" : "Add to My List"}>{state.inMyList ? <Check /> : <Plus />}</button>
          </div>
        </div>
      )}

      <div className={styles.heroCarouselDots} aria-label="Choose hero slide">
        <button type="button" aria-label="Show The AmagiFlix logo" aria-current={activeSlide === 0 ? "true" : undefined} onClick={() => setActiveSlide(0)} />
        <button type="button" aria-label={`Show newest title: ${title.title}`} aria-current={activeSlide === 1 ? "true" : undefined} onClick={() => setActiveSlide(1)} />
      </div>
    </section>
  );
}
