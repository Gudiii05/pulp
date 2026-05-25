import { invoke } from "@tauri-apps/api/core";
import PulpLogo from "./PulpLogo";
import type { Theme } from "../hooks/useTheme";
import styles from "./Header.module.css";

interface HeaderProps {
  count: number;
  theme: Theme;
  paused: boolean;
  locked: boolean;
  onToggleTheme: () => void;
  onTogglePaused: () => void;
  onToggleLocked: () => void;
  onOpenSettings: () => void;
}

export default function Header({
  count,
  theme,
  paused,
  locked,
  onToggleTheme,
  onTogglePaused,
  onToggleLocked,
  onOpenSettings,
}: HeaderProps) {
  const isDark = theme === "dark";

  const handleDrag = async (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // don't drag from interactive controls
    try {
      await invoke("start_window_drag");
    } catch (err) {
      console.error("start_window_drag failed", err);
    }
  };

  return (
    <header className={styles.header} onMouseDown={handleDrag}>
      <div className={styles.brand}>
        <div className={styles.logoBadge} aria-hidden>
          <PulpLogo size={22} className={styles.logo} />
        </div>
        <span className={styles.wordmark}>Pulp</span>
      </div>

      <button
        className={`${styles.live} ${paused ? styles.livePaused : ""}`}
        onClick={onTogglePaused}
        title={paused ? "Resume capture" : "Pause capture"}
        aria-label={paused ? "Resume capture" : "Pause capture"}
      >
        <span className={styles.dot} />
        <span className={styles.liveLabel}>
          {paused ? "paused" : "listening"}
        </span>
      </button>

      <div className={styles.right}>
        <span className={styles.countPill} title="clips stored">
          {count}
        </span>
        <button
          className={`${styles.themeToggle} ${locked ? styles.lockActive : ""}`}
          onClick={onToggleLocked}
          aria-label={locked ? "Unlock window (auto-hide on copy)" : "Lock window open (stay open on copy)"}
          aria-pressed={locked}
          title={locked ? "Locked open — click to unlock" : "Lock window open"}
        >
          {locked ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 11V8a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 11V8a4 4 0 0 1 7.5-2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <button
          className={styles.themeToggle}
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 4.6 16.96l.06-.06A1.65 1.65 0 0 0 5 15.09a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 5 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.44 4.29l.06.06A1.65 1.65 0 0 0 9.31 5 1.65 1.65 0 0 0 10.31 3.49V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.31 5a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19 9c.13.34.34.65.6.91.26.26.57.47.91.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        </button>
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <line x1="12" y1="2.5" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="21.5" />
                <line x1="2.5" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="21.5" y2="12" />
                <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
                <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
                <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
                <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
              </g>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                fill="currentColor"
                d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
