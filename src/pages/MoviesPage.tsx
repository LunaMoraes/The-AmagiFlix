import { useSearchParams } from "react-router-dom";
import { CATEGORY_RULES } from "../config/categories";
import type { CatalogTitle } from "../types/catalog";
import { titlePublishedAt } from "../lib/titles";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function MoviesPage({ titles }: { titles: CatalogTitle[] }) {
  const [params, setParams] = useSearchParams();
  const active = params.get("category") ?? "all";
  const filtered = [...(active === "all" ? titles : titles.filter((title) => title.categories.includes(active)))].sort((a, b) => Date.parse(titlePublishedAt(b)) - Date.parse(titlePublishedAt(a)));
  const setCategory = (category: string) => {
    const next = new URLSearchParams(params);
    if (category === "all") next.delete("category"); else next.set("category", category);
    next.delete("movie");
    next.delete("show");
    setParams(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}><p className={styles.eyebrow}>EXPLORE THE CATALOG</p><h1>Movies &amp; Shows</h1><p>Feature-length stories and episodic alternate timelines from The Amagi.</p></div>
      <div className={styles.filters} aria-label="Filter by category">
        <button className={active === "all" ? styles.filterActive : ""} onClick={() => setCategory("all")}>All</button>
        {CATEGORY_RULES.filter((category) => titles.some((title) => title.categories.includes(category.id))).map((category) => <button key={category.id} className={active === category.id ? styles.filterActive : ""} onClick={() => setCategory(category.id)}>{category.label}</button>)}
      </div>
      <p className={styles.resultCount}>{filtered.length} {filtered.length === 1 ? "title" : "titles"}</p>
      <MovieGrid titles={filtered} />
    </main>
  );
}
