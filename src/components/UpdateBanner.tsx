import type { UpdaterStatus } from "../hooks/useUpdater";
import styles from "./UpdateBanner.module.css";

interface UpdateBannerProps {
  status: UpdaterStatus;
  version?: string;
  progress?: number;
  error?: string;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({
  status,
  version,
  progress,
  error,
  onInstall,
  onDismiss,
}: UpdateBannerProps) {
  if (status === "idle" || status === "checking") return null;

  if (status === "error") {
    return (
      <div className={`${styles.banner} ${styles.error}`}>
        <span className={styles.text}>Update check failed</span>
        <button className={styles.dismiss} onClick={onDismiss}>
          ×
        </button>
      </div>
    );
  }

  if (status === "available") {
    return (
      <div className={styles.banner}>
        <div className={styles.text}>
          <strong>Update available</strong>
          {version ? <span className={styles.version}> · v{version}</span> : null}
        </div>
        <div className={styles.actions}>
          <button className={styles.install} onClick={onInstall}>
            Install
          </button>
          <button className={styles.dismiss} onClick={onDismiss} title="Later">
            ×
          </button>
        </div>
      </div>
    );
  }

  if (status === "downloading") {
    const pct = progress != null ? Math.round(progress * 100) : null;
    return (
      <div className={styles.banner}>
        <div className={styles.text}>
          Downloading update{pct != null ? ` · ${pct}%` : "…"}
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: pct != null ? `${pct}%` : "30%" }}
          />
        </div>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className={styles.banner}>
        <div className={styles.text}>Restarting to apply update…</div>
      </div>
    );
  }

  return null;
}
