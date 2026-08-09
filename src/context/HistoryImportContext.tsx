import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { loadHistoryImportMetadata, removeHistoryImportMetadata, saveHistoryImportMetadata } from "../history-import/metadata-storage";
import type { HistoryImportMetadata } from "../types/library";

interface HistoryImportContextValue {
  metadata?: HistoryImportMetadata;
  dialogOpen: boolean;
  openImport(): void;
  closeImport(): void;
  complete(metadata: HistoryImportMetadata): void;
  clear(): void;
}

const HistoryImportContext = createContext<HistoryImportContextValue | null>(null);

export function HistoryImportProvider({ children }: PropsWithChildren) {
  const [metadata, setMetadata] = useState(loadHistoryImportMetadata);
  const [dialogOpen, setDialogOpen] = useState(false);
  return <HistoryImportContext.Provider value={{
    metadata,
    dialogOpen,
    openImport: () => setDialogOpen(true),
    closeImport: () => setDialogOpen(false),
    complete: (next) => { saveHistoryImportMetadata(next); setMetadata(next); },
    clear: () => { removeHistoryImportMetadata(); setMetadata(undefined); },
  }}>{children}</HistoryImportContext.Provider>;
}

export function useHistoryImport() {
  const value = useContext(HistoryImportContext);
  if (!value) throw new Error("useHistoryImport must be used inside HistoryImportProvider.");
  return value;
}
