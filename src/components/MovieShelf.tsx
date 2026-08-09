import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useMovieDetails } from "../hooks/useMovieDetails";
import { useLibrary } from "../context/LibraryContext";
import type { CatalogTitle } from "../types/catalog";
import { getTitleState } from "../lib/library";
import { isShow, titleId } from "../lib/titles";
import { MovieCard } from "./MovieCard";
import styles from "../styles/app.module.css";

export function MovieShelf({ title, titles }: { title: string; titles: CatalogTitle[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const { library } = useLibrary();
  const { openMovie, openShow } = useMovieDetails();
  const scroll = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.82, behavior: "smooth" });

  if (!titles.length) return null;
  return (
    <section className={styles.shelf} aria-labelledby={`shelf-${title.replace(/\W+/g, "-")}`}>
      <h2 id={`shelf-${title.replace(/\W+/g, "-")}`}>{title}</h2>
      <div className={styles.shelfWrap}>
        <button className={`${styles.shelfArrow} ${styles.shelfArrowLeft}`} onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft /></button>
        <div className={styles.shelfRail} ref={rail}>
          {titles.map((item) => <MovieCard key={titleId(item)} title={item} state={getTitleState(library, item)} onOpen={() => isShow(item) ? openShow(item.showId) : openMovie(item.videoId)} />)}
        </div>
        <button className={`${styles.shelfArrow} ${styles.shelfArrowRight}`} onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}><ChevronRight /></button>
      </div>
    </section>
  );
}
