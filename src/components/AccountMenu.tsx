import { CheckCircle2, ChevronLeft, Download, History, Puzzle, RefreshCw, Settings, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useProfile } from "../context/ProfileContext";
import { useExtensionBridge } from "../context/ExtensionBridgeContext";
import { useHistoryImport } from "../context/HistoryImportContext";
import { useLibrary } from "../context/LibraryContext";
import { EXTENSION_DOWNLOAD_PATH } from "../config/app";
import styles from "../styles/app.module.css";

type MenuView = "menu" | "profile" | "extension" | "settings";

export function AccountMenu() {
  const { profile, updateName } = useProfile();
  const bridge = useExtensionBridge();
  const historyImport = useHistoryImport();
  const { clearImport } = useLibrary();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("menu");
  const [draftName, setDraftName] = useState(profile.name);

  const close = () => {
    setOpen(false);
    setView("menu");
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openProfile = () => {
    setDraftName(profile.name);
    setView("profile");
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    updateName(draftName);
    setView("menu");
  };

  const clearHistory = () => {
    if (!window.confirm("Clear imported history markers? Manual and extension watch state will be preserved.")) return;
    clearImport();
    historyImport.clear();
  };

  const extensionLabel = bridge.status === "connected" ? (bridge.updateAvailable ? "Update available" : "Connected") : bridge.status === "checking" ? "Checking…" : "Not installed";
  const extensionDownload = `${import.meta.env.BASE_URL}${EXTENSION_DOWNLOAD_PATH}`;

  return (
    <>
      <div className={styles.accountArea}>
        <button className={styles.accountTrigger} onClick={() => setOpen((value) => !value)} aria-label="Open account menu" aria-expanded={open} aria-controls="account-side-panel">
          <UserRound aria-hidden="true" />
        </button>
      </div>
      {open && createPortal(
        <>
          <button className={styles.accountBackdrop} onClick={close} aria-label="Dismiss account panel" />
          <aside id="account-side-panel" className={styles.accountPanel} role="dialog" aria-modal="true" aria-label="Account menu">
            <header className={styles.accountMenuHeader}>
              {view !== "menu" && <button onClick={() => setView("menu")} aria-label="Back to account menu"><ChevronLeft /></button>}
              <h2>{view === "profile" ? "Profile" : view === "settings" ? "Settings" : view === "extension" ? "Browser Extension" : "Account"}</h2>
              <button className={styles.accountClose} onClick={close} aria-label="Close account menu" autoFocus><X /></button>
            </header>

          {view === "menu" && (
            <div className={styles.accountMenuItems}>
              <button className={styles.profileMenuItem} onClick={openProfile}>
                <span className={styles.profileAvatar}><UserRound aria-hidden="true" /></span>
                <span><strong>Profile</strong><small>{profile.name}</small></span>
              </button>
              <button className={styles.accountMenuItem} onClick={() => setView("extension")}>
                <Puzzle aria-hidden="true" />
                <span><strong>Browser Extension</strong><small>{extensionLabel}</small></span>
              </button>
              <button className={styles.accountMenuItem} onClick={() => setView("settings")}>
                <Settings aria-hidden="true" />
                <span><strong>Settings</strong><small>Preferences and data</small></span>
              </button>
            </div>
          )}

          {view === "profile" && (
            <form className={styles.profileForm} onSubmit={saveProfile}>
              <span className={`${styles.profileAvatar} ${styles.profileAvatarLarge}`}><UserRound aria-hidden="true" /></span>
              <p>Profile pictures will be available in a future update.</p>
              <label htmlFor="profile-name">Display name</label>
              <input id="profile-name" maxLength={40} value={draftName} onChange={(event) => setDraftName(event.target.value)} autoFocus />
              <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">Save profile</button>
            </form>
          )}

          {view === "extension" && (
            <div className={styles.extensionPanel}>
              <div className={`${styles.extensionStatus} ${bridge.status === "connected" && !bridge.updateAvailable ? styles.extensionConnected : ""}`}>
                {bridge.status === "connected" && !bridge.updateAvailable ? <CheckCircle2 /> : <Puzzle />}
                <div><strong>AmagiFlix Companion</strong><span>{extensionLabel}{bridge.extensionVersion ? ` · v${bridge.extensionVersion}` : ""}</span></div>
              </div>
              {bridge.status === "connected" && !bridge.updateAvailable
                ? <p>Tracking Amagi videos watched on YouTube in this browser.</p>
                : <p>{bridge.updateAvailable ? "Download the latest ZIP, replace the extracted folder, then click Reload on chrome://extensions." : "Install the companion to update Continue Watching from real YouTube playback."}</p>}
              <p className={styles.privacyNote}><ShieldCheck /> Only public AmagiFlix catalog video IDs are tracked. Unrelated YouTube activity is ignored.</p>
              <a className={`${styles.button} ${styles.buttonPrimary}`} href={extensionDownload} download><Download /> Download Extension ZIP</a>
              <ol className={styles.installSteps}>
                <li>Download and extract the ZIP.</li>
                <li>Open <code>chrome://extensions</code>.</li>
                <li>Enable Developer mode.</li>
                <li>Choose Load unpacked and select the extracted folder.</li>
              </ol>
              <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={bridge.retry}><RefreshCw /> Check connection</button>
              <small className={styles.extensionDisclaimer}>Chrome does not directly install self-hosted extensions on Windows. This temporary package must be loaded unpacked.</small>
            </div>
          )}

          {view === "settings" && (
            <div className={styles.accountMenuItems}>
              <button className={styles.accountMenuItem} onClick={historyImport.openImport}>
                <History aria-hidden="true" />
                <span><strong>{historyImport.metadata ? "Re-import YouTube History" : "Import Watch History"}</strong><small>{historyImport.metadata ? `${historyImport.metadata.matchedCount} matched · ${new Date(historyImport.metadata.completedAt).toLocaleDateString()}` : "Process a Takeout export locally"}</small></span>
              </button>
              <button className={styles.accountMenuItem} onClick={clearHistory} disabled={!historyImport.metadata}>
                <Trash2 aria-hidden="true" />
                <span><strong>Clear Imported History</strong><small>Preserves manual and extension state</small></span>
              </button>
            </div>
          )}
          </aside>
        </>,
        document.body,
      )}
    </>
  );
}
