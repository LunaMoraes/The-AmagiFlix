import { History, ShieldCheck } from "lucide-react";
import { useHistoryImport } from "../context/HistoryImportContext";
import styles from "../styles/app.module.css";

export function HistoryImportCard() {
  const { metadata, openImport } = useHistoryImport();
  if (metadata) return null;
  return (
    <section className={styles.historyImportCard} aria-labelledby="history-import-title">
      <div className={styles.historyImportIcon}><History aria-hidden="true" /></div>
      <div>
        <h2 id="history-import-title">Import your existing YouTube history</h2>
        <p>Already watched some of these movies or episodes? Import your Google/YouTube activity export and AmagiFlix will mark matching titles as watched.</p>
        <small><ShieldCheck aria-hidden="true" /> Processed locally. Non-Amagi activity is discarded and never uploaded.</small>
      </div>
      <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={openImport}>Import History</button>
    </section>
  );
}
