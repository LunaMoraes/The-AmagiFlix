import { createContext, type PropsWithChildren, useCallback, useContext, useReducer, useRef } from "react";
import { getVideoState, markOpened, toggleMyList, toggleWatched } from "../lib/library";
import { loadLocalLibrary, saveLocalLibrary } from "../lib/storage";
import type { LocalLibrary, LocalVideoState } from "../types/library";

interface LibraryContextValue {
  library: LocalLibrary;
  persistenceAvailable: boolean;
  stateFor(videoId: string): LocalVideoState;
  recordOpen(videoId: string): LocalLibrary;
  toggleWatched(videoId: string): LocalLibrary;
  toggleMyList(videoId: string): LocalLibrary;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const initial = useRef(loadLocalLibrary());
  const current = useRef(initial.current);
  const [library, replaceLibrary] = useReducer((_state: LocalLibrary, next: LocalLibrary) => next, initial.current);
  const persistence = useRef(true);

  const apply = useCallback((transition: (library: LocalLibrary) => LocalLibrary) => {
    const next = transition(current.current);
    current.current = next;
    persistence.current = saveLocalLibrary(next);
    replaceLibrary(next);
    return next;
  }, []);

  const value: LibraryContextValue = {
    library,
    persistenceAvailable: persistence.current,
    stateFor: (videoId) => getVideoState(library, videoId),
    recordOpen: (videoId) => apply((state) => markOpened(state, videoId)),
    toggleWatched: (videoId) => apply((state) => toggleWatched(state, videoId)),
    toggleMyList: (videoId) => apply((state) => toggleMyList(state, videoId)),
  };
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider.");
  return value;
}
