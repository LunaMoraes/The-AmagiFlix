import { useSearchParams } from "react-router-dom";
import { CATEGORY_RULES, type SubcategoryId } from "../config/categories";
import type { CatalogTitle } from "../types/catalog";
import { titlePublishedAt } from "../lib/titles";
import { filterTitlesBySubcategory } from "../lib/category-engine";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function MoviesPage({ titles }: { titles: CatalogTitle[] }) {
  const [params, setParams] = useSearchParams();
  const active = params.get("category") ?? "all";
  const activeCategoryRule = CATEGORY_RULES.find((category) => category.id === active);
  const activeSubcategory = params.get("subcategory") ?? "all";

  let filtered = active === "all" ? titles : titles.filter((title) => title.categories.includes(active));
  if (activeCategoryRule?.subcategories && activeSubcategory !== "all") {
    filtered = filterTitlesBySubcategory(filtered, activeSubcategory as SubcategoryId);
  }
  filtered = [...filtered].sort((a, b) => Date.parse(titlePublishedAt(b)) - Date.parse(titlePublishedAt(a)));

  const setCategory = (category: string) => {
    const next = new URLSearchParams(params);
    if (category === "all") next.delete("category"); else next.set("category", category);
    next.delete("subcategory");
    next.delete("movie");
    next.delete("show");
    setParams(next);
  };

  const setSubcategory = (subcategory: string) => {
    const next = new URLSearchParams(params);
    if (subcategory === "all") next.delete("subcategory"); else next.set("subcategory", subcategory);
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
      {activeCategoryRule?.subcategories && (
        <div className={styles.filters} aria-label="Filter by subcategory">
          <button className={activeSubcategory === "all" ? styles.filterActive : ""} onClick={() => setSubcategory("all")}>All</button>
          {activeCategoryRule.subcategories.map((subcategory) => (
            <button key={subcategory.id} className={activeSubcategory === subcategory.id ? styles.filterActive : ""} onClick={() => setSubcategory(subcategory.id)}>{subcategory.label}</button>
          ))}
        </div>
      )}
      <p className={styles.resultCount}>{filtered.length} {filtered.length === 1 ? "title" : "titles"}</p>
      <MovieGrid titles={filtered} />
    </main>
  );
}
