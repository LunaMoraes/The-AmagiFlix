import { useSearchParams } from "react-router-dom";
import { CATEGORY_RULES } from "../config/categories";
import type { CatalogMovie } from "../types/catalog";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function MoviesPage({ movies }: { movies: CatalogMovie[] }) {
  const [params, setParams] = useSearchParams();
  const active = params.get("category") ?? "all";
  const filtered = active === "all" ? movies : movies.filter((movie) => movie.categories.includes(active));
  const setCategory = (category: string) => {
    const next = new URLSearchParams(params);
    if (category === "all") next.delete("category"); else next.set("category", category);
    next.delete("movie");
    setParams(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}><p className={styles.eyebrow}>EXPLORE THE CATALOG</p><h1>Full Movies</h1><p>Feature-length stories, timelines, and character journeys from The Amagi.</p></div>
      <div className={styles.filters} aria-label="Filter by category">
        <button className={active === "all" ? styles.filterActive : ""} onClick={() => setCategory("all")}>All</button>
        {CATEGORY_RULES.filter((category) => movies.some((movie) => movie.categories.includes(category.id))).map((category) => <button key={category.id} className={active === category.id ? styles.filterActive : ""} onClick={() => setCategory(category.id)}>{category.label}</button>)}
      </div>
      <p className={styles.resultCount}>{filtered.length} {filtered.length === 1 ? "movie" : "movies"}</p>
      <MovieGrid movies={filtered} />
    </main>
  );
}
