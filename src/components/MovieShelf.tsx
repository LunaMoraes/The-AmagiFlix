import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useMovieDetails } from "../hooks/useMovieDetails";
import { useLibrary } from "../context/LibraryContext";
import type { CatalogMovie } from "../types/catalog";
import { MovieCard } from "./MovieCard";
import styles from "../styles/app.module.css";

export function MovieShelf({ title, movies }: { title: string; movies: CatalogMovie[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const { stateFor } = useLibrary();
  const { openMovie } = useMovieDetails();
  const scroll = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.82, behavior: "smooth" });

  if (!movies.length) return null;
  return (
    <section className={styles.shelf} aria-labelledby={`shelf-${title.replace(/\W+/g, "-")}`}>
      <h2 id={`shelf-${title.replace(/\W+/g, "-")}`}>{title}</h2>
      <div className={styles.shelfWrap}>
        <button className={`${styles.shelfArrow} ${styles.shelfArrowLeft}`} onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft /></button>
        <div className={styles.shelfRail} ref={rail}>
          {movies.map((movie) => <MovieCard key={movie.videoId} movie={movie} state={stateFor(movie.videoId)} onOpen={() => openMovie(movie.videoId)} />)}
        </div>
        <button className={`${styles.shelfArrow} ${styles.shelfArrowRight}`} onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}><ChevronRight /></button>
      </div>
    </section>
  );
}
