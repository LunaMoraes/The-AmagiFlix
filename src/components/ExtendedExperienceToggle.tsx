import { useExtendedExperience } from "../context/ExtendedExperienceContext";
import styles from "../styles/app.module.css";

export function ExtendedExperienceToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { extendedExperience, toggleExtendedExperience } = useExtendedExperience();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={extendedExperience}
      aria-label="Toggle Extended Experience"
      className={`${styles.extendedToggle} ${extendedExperience ? styles.extendedToggleActive : ""} ${className ?? ""}`}
      onClick={toggleExtendedExperience}
    >
      <span className={styles.extendedToggleLabel}>Extended Experience</span>
      <span className={`${styles.sliderTrack} ${extendedExperience ? styles.sliderTrackActive : ""}`} aria-hidden="true">
        <span className={styles.sliderThumb} />
      </span>
    </button>
  );
}
