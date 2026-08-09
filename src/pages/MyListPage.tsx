import { ListPlus } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { selectMyList } from "../lib/library";
import type { CatalogMovie } from "../types/catalog";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function MyListPage({ movies }: { movies: CatalogMovie[] }) {
  const { library } = useLibrary();
  const myList = selectMyList(movies, library);
  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}><p className={styles.eyebrow}>YOUR PICKS</p><h1>My List</h1><p>Movies saved in this browser stay here for your next visit.</p></div>
      {myList.length ? <MovieGrid movies={myList} /> : <div className={styles.emptyState}><ListPlus /><h2>Your list is waiting.</h2><p>Add movies from any card or details screen and they’ll appear here.</p></div>}
    </main>
  );
}
