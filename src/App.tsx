import { useEffect } from "react";
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

export default function App() {
  const state = useCatalog();
  const bridge = useExtensionBridge();
  useEffect(() => {
    if (state.status === "success" && bridge.status === "connected") void bridge.refreshCatalog(state.catalog.generatedAt).catch(() => undefined);
  }, [bridge.status, state.status === "success" ? state.catalog.generatedAt : undefined]);
  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "error") return <ErrorScreen retry={state.retry} />;
  const movies = state.catalog.movies;
  return (
    <div className={styles.app}>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage movies={movies} />} />
        <Route path="/movies" element={<MoviesPage movies={movies} />} />
        <Route path="/my-list" element={<MyListPage movies={movies} />} />
        <Route path="/search" element={<SearchPage movies={movies} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MovieDetails movies={movies} />
      <HistoryImportDialog movies={movies} />
      <footer className={styles.footer}>Fan-made project. Video content is hosted and played on YouTube. The AmagiFlix is not affiliated with Netflix or The Amagi.</footer>
    </div>
  );
}
