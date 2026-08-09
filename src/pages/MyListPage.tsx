import { ListPlus } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { selectMyListTitles } from "../lib/library";
import type { CatalogMovie, CatalogShow } from "../types/catalog";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function MyListPage({ movies, shows }: { movies: CatalogMovie[]; shows: CatalogShow[] }) {
  const { library } = useLibrary();
  const myList = selectMyListTitles(movies, shows, library);
  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}><p className={styles.eyebrow}>YOUR PICKS</p><h1>My List</h1><p>Movies and shows saved in this browser stay here for your next visit.</p></div>
      {myList.length ? <MovieGrid titles={myList} /> : <div className={styles.emptyState}><ListPlus /><h2>Your list is waiting.</h2><p>Add movies or shows from any details screen and they’ll appear here.</p></div>}
    </main>
  );
}
