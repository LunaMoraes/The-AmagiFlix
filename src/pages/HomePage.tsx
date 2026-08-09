import { CATEGORY_RULES } from "../config/categories";
import { useLibrary } from "../context/LibraryContext";
import { selectContinueWatching, selectMyList, selectWatchAgain } from "../lib/library";
import { selectFeaturedMovie } from "../lib/movies";
import type { CatalogMovie } from "../types/catalog";
import { Hero } from "../components/Hero";
import { HistoryImportCard } from "../components/HistoryImportCard";
import { MovieShelf } from "../components/MovieShelf";
import styles from "../styles/app.module.css";

export function HomePage({ movies }: { movies: CatalogMovie[] }) {
  const { library } = useLibrary();
  const featured = selectFeaturedMovie(movies);
  if (!featured) return null;
  const continueWatching = selectContinueWatching(movies, library);
  const myList = selectMyList(movies, library);
  const watchAgain = selectWatchAgain(movies, library);

  return (
    <main>
      <Hero movie={featured} />
      <div className={styles.homeShelves}>
        <HistoryImportCard />
        <MovieShelf title="Continue Watching" movies={continueWatching} />
        <MovieShelf title="My List" movies={myList} />
        <MovieShelf title="Recently Added Full Movies" movies={movies} />
        {CATEGORY_RULES.map((category) => <MovieShelf key={category.id} title={category.label} movies={movies.filter((movie) => movie.categories.includes(category.id))} />)}
        <MovieShelf title="Watch Again" movies={watchAgain} />
      </div>
    </main>
  );
}
