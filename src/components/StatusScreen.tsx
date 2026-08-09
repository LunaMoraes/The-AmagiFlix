import { AlertTriangle, RotateCw } from "lucide-react";
import styles from "../styles/app.module.css";

export function LoadingScreen() {
  return <main className={styles.statusScreen}><div className={styles.loadingMark}>A</div><p>Loading the catalog…</p></main>;
}

export function ErrorScreen({ retry }: { retry(): void }) {
  return <main className={styles.statusScreen}><AlertTriangle /><h1>The AmagiFlix could not load the catalog.</h1><p>Check your connection and try again.</p><button className={`${styles.button} ${styles.buttonPrimary}`} onClick={retry}><RotateCw /> Retry</button></main>;
}
