import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function usePaused() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    invoke<boolean>("get_paused")
      .then(setPaused)
      .catch((e) => console.error("get_paused failed", e));
  }, []);

  const toggle = useCallback(async () => {
    const next = !paused;
    setPaused(next);
    try {
      await invoke("set_paused", { paused: next });
    } catch (e) {
      // Revert on error
      console.error("set_paused failed", e);
      setPaused(!next);
    }
  }, [paused]);

  return { paused, toggle };
}
