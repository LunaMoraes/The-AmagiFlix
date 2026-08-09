import { useMovieDetails } from "../hooks/useMovieDetails";
import { useLibrary } from "../context/LibraryContext";
import type { CatalogMovie } from "../types/catalog";
import { MovieCard } from "./MovieCard";
import styles from "../styles/app.module.css";

export function MovieGrid({ movies }: { movies: CatalogMovie[] }) {
  const { stateFor } = useLibrary();
  const { openMovie } = useMovieDetails();
  return (
    <div className={styles.movieGrid}>
      {movies.map((movie) => <MovieCard key={movie.videoId} movie={movie} state={stateFor(movie.videoId)} onOpen={() => openMovie(movie.videoId)} />)}
    </div>
  );
}
