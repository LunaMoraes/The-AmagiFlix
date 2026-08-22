import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { MovieDetails } from "./components/MovieDetails";
import { ErrorScreen, LoadingScreen } from "./components/StatusScreen";
import { useCatalog } from "./hooks/useCatalog";
import { HomePage } from "./pages/HomePage";
import { MoviesPage } from "./pages/MoviesPage";
import { MyListPage } from "./pages/MyListPage";
import { SearchPage } from "./pages/SearchPage";
import styles from "./styles/app.module.css";
import { HistoryImportDialog } from "./components/HistoryImportDialog";
import { useExtensionBridge } from "./context/ExtensionBridgeContext";
import { useExtendedExperience } from "./context/ExtendedExperienceContext";
import { ShowDetails } from "./components/ShowDetails";
import type { CatalogTitle } from "./types/catalog";
import { createRecommendationOrder } from "./lib/recommendations";
import { isExtendedTitle } from "./lib/titles";

export default function App() {
  const state = useCatalog();
  const bridge = useExtensionBridge();
  const { extendedExperience } = useExtendedExperience();
  const recommendations = useRef<{ key: string; titles: CatalogTitle[] } | undefined>(undefined);

  useEffect(() => {
    if (state.status === "success" && bridge.status === "connected") void bridge.refreshCatalog(state.catalog.generatedAt).catch(() => undefined);
  }, [bridge.status, state.status === "success" ? state.catalog.generatedAt : undefined]);

  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "error") return <ErrorScreen retry={state.retry} />;

  const allMovies = state.catalog.movies;
  const allShows = state.catalog.shows;
  const movies = extendedExperience ? allMovies : allMovies.filter((movie) => !isExtendedTitle(movie));
  const shows = extendedExperience ? allShows : allShows.filter((show) => !isExtendedTitle(show));
  const titles: CatalogTitle[] = [...movies, ...shows];

  const recKey = `${state.catalog.generatedAt}:${extendedExperience}`;
  if (recommendations.current?.key !== recKey) recommendations.current = { key: recKey, titles: createRecommendationOrder(titles) };

  return (
    <div className={styles.app}>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage movies={movies} shows={shows} recommendationOrder={recommendations.current.titles} />} />
        <Route path="/movies" element={<MoviesPage titles={titles} />} />
        <Route path="/my-list" element={<MyListPage movies={movies} shows={shows} />} />
        <Route path="/search" element={<SearchPage movies={movies} shows={shows} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MovieDetails movies={allMovies} />
      <ShowDetails shows={allShows} />
      <HistoryImportDialog movies={allMovies} shows={allShows} />
      <footer className={styles.footer}>Fan-made project. Video content is hosted and played on YouTube. The AmagiFlix is not affiliated with Netflix or The Amagi.</footer>
    </div>
  );
}
