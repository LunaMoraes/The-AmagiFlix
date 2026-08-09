import { useMovieDetails } from "../hooks/useMovieDetails";
import { useLibrary } from "../context/LibraryContext";
import type { CatalogTitle } from "../types/catalog";
import { getTitleState } from "../lib/library";
import { isShow, titleId } from "../lib/titles";
import { MovieCard } from "./MovieCard";
import styles from "../styles/app.module.css";

export function MovieGrid({ titles }: { titles: CatalogTitle[] }) {
  const { library } = useLibrary();
  const { openMovie, openShow } = useMovieDetails();
  return (
    <div className={styles.movieGrid}>
      {titles.map((item) => <MovieCard key={titleId(item)} title={item} state={getTitleState(library, item)} onOpen={() => isShow(item) ? openShow(item.showId) : openMovie(item.videoId)} />)}
    </div>
  );
}
