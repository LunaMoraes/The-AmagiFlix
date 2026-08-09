import { useCallback, useEffect, useState } from "react";
import { loadCatalog } from "../lib/catalog";
import type { CatalogFile } from "../types/catalog";

type CatalogState =
  | { status: "loading"; catalog?: undefined; error?: undefined }
  | { status: "success"; catalog: CatalogFile; error?: undefined }
  | { status: "error"; catalog?: undefined; error: Error };

export function useCatalog() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadCatalog(controller.signal)
      .then((catalog) => setState({ status: "success", catalog }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error: error instanceof Error ? error : new Error("Unknown catalog error.") });
      });
    return () => controller.abort();
  }, [attempt]);
  return { ...state, retry: useCallback(() => setAttempt((value) => value + 1), []) };
}
