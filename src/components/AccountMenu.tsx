import { ChevronLeft, History, Puzzle, Settings, UserRound, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useProfile } from "../context/ProfileContext";
import styles from "../styles/app.module.css";

type MenuView = "menu" | "profile" | "settings";

export function AccountMenu() {
  const { profile, updateName } = useProfile();
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
              <h2>{view === "profile" ? "Profile" : view === "settings" ? "Settings" : "Account"}</h2>
              <button className={styles.accountClose} onClick={close} aria-label="Close account menu" autoFocus><X /></button>
            </header>

          {view === "menu" && (
            <div className={styles.accountMenuItems}>
              <button className={styles.profileMenuItem} onClick={openProfile}>
                <span className={styles.profileAvatar}><UserRound aria-hidden="true" /></span>
                <span><strong>Profile</strong><small>{profile.name}</small></span>
              </button>
              <button className={styles.accountMenuItem} disabled>
                <Puzzle aria-hidden="true" />
                <span><strong>Browser Extension</strong><small>Coming soon</small></span>
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

          {view === "settings" && (
            <div className={styles.accountMenuItems}>
              <button className={styles.accountMenuItem} disabled>
                <History aria-hidden="true" />
                <span><strong>Import Watch History</strong><small>Coming soon</small></span>
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
