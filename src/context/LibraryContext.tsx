import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { useExtensionBridge } from "./ExtensionBridgeContext";
import { clearImportedHistory, getVideoState, markOpened, mergeExtensionStates, mergeImportedHistory, resetProgress, toggleMyList, toggleWatched } from "../lib/library";
import { loadLocalLibrary, saveLocalLibrary } from "../lib/storage";
import type { ExtensionVideoState, ImportedWatchState, LocalLibrary, ResolvedVideoState } from "../types/library";

interface LibraryContextValue {
  library: LocalLibrary;
  persistenceAvailable: boolean;
  stateFor(videoId: string): ResolvedVideoState;
  recordOpen(videoId: string): LocalLibrary;
  toggleWatched(videoId: string): LocalLibrary;
  toggleMyList(videoId: string): LocalLibrary;
  mergeImport(records: ImportedWatchState[]): LocalLibrary;
  mergeExtension(states: ExtensionVideoState[]): LocalLibrary;
  clearImport(): LocalLibrary;
  resetVideoProgress(videoId: string): LocalLibrary;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const bridge = useExtensionBridge();
  const initial = useRef(loadLocalLibrary());
  const current = useRef(initial.current);
  const [library, replaceLibrary] = useReducer((_state: LocalLibrary, next: LocalLibrary) => next, initial.current);
  const persistence = useRef(true);
  const synced = useRef(false);

  const apply = useCallback((transition: (library: LocalLibrary) => LocalLibrary) => {
    const next = transition(current.current);
    current.current = next;
    persistence.current = saveLocalLibrary(next);
    replaceLibrary(next);
    return next;
  }, []);

  useEffect(() => {
    if (bridge.states.length) apply((state) => mergeExtensionStates(state, bridge.states));
  }, [apply, bridge.states]);

  useEffect(() => {
    if (bridge.status !== "connected" || synced.current) return;
    synced.current = true;
    const imports: ImportedWatchState[] = [];
    for (const [videoId, state] of Object.entries(current.current.videos)) {
      if (state.manualDecision) void bridge.setManualWatched(videoId, state.manualDecision).catch(() => undefined);
      if (state.historyImport) imports.push(state.historyImport);
    }
    if (imports.length) void bridge.importHistory(imports).catch(() => undefined);
  }, [bridge]);

  const value: LibraryContextValue = {
    library,
    persistenceAvailable: persistence.current,
    stateFor: (videoId) => getVideoState(library, videoId),
    recordOpen: (videoId) => apply((state) => markOpened(state, videoId)),
    toggleWatched: (videoId) => {
      const next = apply((state) => toggleWatched(state, videoId));
      const decision = next.videos[videoId].manualDecision;
      if (decision) void bridge.setManualWatched(videoId, decision).catch(() => undefined);
      return next;
    },
    toggleMyList: (videoId) => apply((state) => toggleMyList(state, videoId)),
    mergeImport: (records) => {
      const next = apply((state) => mergeImportedHistory(state, records));
      void bridge.importHistory(records).catch(() => undefined);
      return next;
    },
    mergeExtension: (states) => apply((state) => mergeExtensionStates(state, states)),
    clearImport: () => {
      const next = apply(clearImportedHistory);
      void bridge.clearImportedHistory().catch(() => undefined);
      return next;
    },
    resetVideoProgress: (videoId) => {
      const next = apply((state) => resetProgress(state, videoId));
      void bridge.resetProgress(videoId).catch(() => undefined);
      return next;
    },
  };
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider.");
  return value;
}
