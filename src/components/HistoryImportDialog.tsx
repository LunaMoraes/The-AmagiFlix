import { FileArchive, ShieldCheck, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useHistoryImport } from "../context/HistoryImportContext";
import { useLibrary } from "../context/LibraryContext";
import { importHistory, type HistoryImportResult } from "../history-import/import-history";
import type { CatalogMovie } from "../types/catalog";
import styles from "../styles/app.module.css";

export function HistoryImportDialog({ movies }: { movies: CatalogMovie[] }) {
  const { dialogOpen, closeImport, complete } = useHistoryImport();
  const { mergeImport, stateFor } = useLibrary();
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [result, setResult] = useState<(HistoryImportResult & { newlyMarked: number; alreadyWatched: number })>();
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (dialogOpen && !element.open) element.showModal();
    if (!dialogOpen && element.open) element.close();
  }, [dialogOpen]);

  const close = () => { setStatus("idle"); setResult(undefined); setError(""); closeImport(); };
  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus("processing"); setError("");
    try {
      const imported = await importHistory(file, new Set(movies.map((movie) => movie.videoId)));
      const newlyMarked = imported.matches.filter((record) => !stateFor(record.videoId).watched).length;
      mergeImport(imported.matches);
      const metadata = { completed: true as const, completedAt: new Date().toISOString(), matchedCount: imported.matches.length };
      complete(metadata);
      setResult({ ...imported, newlyMarked, alreadyWatched: imported.matches.length - newlyMarked });
      setStatus("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't process this history export.");
      setStatus("error");
    }
  };

  return (
    <dialog ref={dialog} className={styles.importDialog} onCancel={(event) => { event.preventDefault(); close(); }} aria-labelledby="import-dialog-title">
      <button className={styles.dialogClose} onClick={close} aria-label="Close history import"><X /></button>
      <div className={styles.importDialogBody}>
        <FileArchive className={styles.importHeroIcon} aria-hidden="true" />
        <h2 id="import-dialog-title">{status === "success" ? "History import complete" : "Import YouTube History"}</h2>
        {status === "idle" && <>
          <p>Choose a Google activity JSON, HTML, or Takeout ZIP export. AmagiFlix will keep only watched markers for movies in this catalog.</p>
          <p className={styles.privacyNote}><ShieldCheck /> Your export is processed locally in this browser and is never uploaded.</p>
          <label className={`${styles.button} ${styles.buttonPrimary}`}>
            Choose history file
            <input type="file" accept=".json,.html,.htm,.zip,application/json,text/html,application/zip" onChange={choose} />
          </label>
        </>}
        {status === "processing" && <p role="status">Processing your export locally…</p>}
        {status === "error" && <>
          <p role="alert">{error}</p>
          <label className={`${styles.button} ${styles.buttonPrimary}`}>Choose another file<input type="file" accept=".json,.html,.htm,.zip" onChange={choose} /></label>
        </>}
        {status === "success" && result && <>
          <dl className={styles.importResults}>
            <div><dt>Records scanned</dt><dd>{result.recordsScanned.toLocaleString()}</dd></div>
            <div><dt>YouTube watched records</dt><dd>{result.youtubeWatchedRecords.toLocaleString()}</dd></div>
            <div><dt>AmagiFlix matches</dt><dd>{result.matches.length.toLocaleString()}</dd></div>
            <div><dt>Newly marked watched</dt><dd>{result.newlyMarked.toLocaleString()}</dd></div>
            <div><dt>Already watched</dt><dd>{result.alreadyWatched.toLocaleString()}</dd></div>
          </dl>
          <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={close}>Done</button>
        </>}
      </div>
    </dialog>
  );
}
