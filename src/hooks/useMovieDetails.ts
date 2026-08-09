import { useSearchParams } from "react-router-dom";

export function useMovieDetails() {
  const [params, setParams] = useSearchParams();
  return {
    movieId: params.get("movie"),
    showId: params.get("show"),
    openMovie: (videoId: string) => {
      const next = new URLSearchParams(params);
      next.set("movie", videoId);
      next.delete("show");
      setParams(next);
    },
    openShow: (showId: string) => {
      const next = new URLSearchParams(params);
      next.set("show", showId);
      next.delete("movie");
      setParams(next);
    },
    closeMovie: () => {
      const next = new URLSearchParams(params);
      next.delete("movie");
      next.delete("show");
      setParams(next, { replace: true });
    },
    closeShow: () => {
      const next = new URLSearchParams(params);
      next.delete("show");
      next.delete("movie");
      setParams(next, { replace: true });
    },
  };
}
