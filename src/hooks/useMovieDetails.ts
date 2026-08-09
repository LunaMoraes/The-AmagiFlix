import { useSearchParams } from "react-router-dom";

export function useMovieDetails() {
  const [params, setParams] = useSearchParams();
  return {
    movieId: params.get("movie"),
    openMovie: (videoId: string) => {
      const next = new URLSearchParams(params);
      next.set("movie", videoId);
      setParams(next);
    },
    closeMovie: () => {
      const next = new URLSearchParams(params);
      next.delete("movie");
      setParams(next, { replace: true });
    },
  };
}
