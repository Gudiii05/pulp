import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import HotkeyCapture from "./HotkeyCapture";
import Toggle from "./Toggle";
import { useAutostart } from "../hooks/useAutostart";
import styles from "./Settings.module.css";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onReplayOnboarding: () => void;
}

export default function Settings({
  open,
  onClose,
  onReplayOnboarding,
}: SettingsProps) {
  const [hotkey, setHotkey] = useState<string>("CommandOrControl+Shift+V");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autostart = useAutostart();

  useEffect(() => {
    if (!open) return;
    invoke<string>("get_hotkey")
      .then(setHotkey)
      .catch((e) => console.error("get_hotkey failed", e));
  }, [open]);

  const handleHotkeyChange = async (combo: string) => {
    setError(null);
    setSaving(true);
    try {
      await invoke("set_hotkey", { hotkey: combo });
      setHotkey(combo);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} data-settings-root>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.label}>Open shortcut</div>
          <HotkeyCapture value={hotkey} onChange={handleHotkeyChange} />
          <div className={styles.help}>
            Press the combination you want to use to open Pulp from anywhere.
            Must include at least one modifier (Ctrl, Alt or Shift).
          </div>
          {saving && <div className={styles.saving}>Saving…</div>}
          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.section}>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>Start with Windows</div>
              <div className={styles.help}>
                Pulp launches automatically when you sign in to your account.
              </div>
            </div>
            <Toggle
              checked={!!autostart.enabled}
              onChange={autostart.toggle}
              disabled={autostart.enabled === null || autostart.busy}
              label="Start with Windows"
            />
          </div>
        </div>

        <div className={styles.section}>
          <button
            className={styles.linkBtn}
            onClick={onReplayOnboarding}
          >
            Show welcome tour again
          </button>
        </div>
      </div>
    </div>
  );
}
