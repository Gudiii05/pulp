import { useCallback, useEffect, useState } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

export function useAutostart() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isEnabled()
      .then(setEnabled)
      .catch((e) => {
        console.error("isEnabled failed", e);
        setEnabled(false);
      });
  }, []);

  const toggle = useCallback(async () => {
    if (enabled === null || busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disable();
      } else {
        await enable();
      }
      setEnabled(!enabled);
    } catch (e) {
      console.error("autostart toggle failed", e);
    } finally {
      setBusy(false);
    }
  }, [enabled, busy]);

  return { enabled, busy, toggle };
}
