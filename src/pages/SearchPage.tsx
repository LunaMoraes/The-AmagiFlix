import { Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchMovies } from "../lib/search";
import type { CatalogMovie } from "../types/catalog";
import { MovieGrid } from "../components/MovieGrid";
import styles from "../styles/app.module.css";

export function SearchPage({ movies }: { movies: CatalogMovie[] }) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  const results = searchMovies(movies, query);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.delete("movie");
    if (draft.trim()) next.set("q", draft.trim()); else next.delete("q");
    setParams(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}><p className={styles.eyebrow}>FIND YOUR NEXT STORY</p><h1>Search</h1></div>
      <form className={styles.searchBox} onSubmit={submit} role="search"><Search /><input autoFocus aria-label="Search the catalog" placeholder="Search titles, descriptions, and genres" value={draft} onChange={(event) => setDraft(event.target.value)} /><button type="submit">Search</button></form>
      {query ? <><p className={styles.resultCount}>{results.length ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”` : `No matches for “${query}”`}</p><MovieGrid movies={results} /></> : <div className={styles.emptyState}><Search /><h2>Search the full catalog.</h2><p>Try a title, character, franchise, or story detail.</p></div>}
    </main>
  );
}
