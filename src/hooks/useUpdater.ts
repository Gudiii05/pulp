import { useCallback, useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

interface UpdaterState {
  status: UpdaterStatus;
  version?: string;
  notes?: string;
  progress?: number; // 0..1
  error?: string;
}

const CHECK_ON_STARTUP_DELAY_MS = 4000;

export function useUpdater() {
  const [state, setState] = useState<UpdaterState>({ status: "idle" });
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    setState({ status: "checking" });
    try {
      const u = await check();
      if (u) {
        setUpdate(u);
        setState({
          status: "available",
          version: u.version,
          notes: u.body ?? undefined,
        });
      } else {
        setState({ status: "idle" });
      }
    } catch (err) {
      // Update check failures (network down, endpoint 404 because no
      // latest.json is published yet, etc.) should not bother the user.
      // We just stay idle and log it.
      console.warn("update check skipped:", err);
      setState({ status: "idle" });
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!update) return;
    setState((s) => ({ ...s, status: "downloading", progress: 0 }));
    let downloaded = 0;
    let total = 0;
    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setState((s) => ({
              ...s,
              status: "downloading",
              progress: total > 0 ? downloaded / total : undefined,
            }));
            break;
          case "Finished":
            setState((s) => ({ ...s, status: "ready" }));
            break;
        }
      });
      // After install, restart the app to apply.
      await relaunch();
    } catch (err) {
      console.error("update install failed", err);
      setState({ status: "error", error: String(err) });
    }
  }, [update]);

  const dismiss = useCallback(() => {
    setState({ status: "idle" });
    setUpdate(null);
  }, []);

  // Auto-check on startup (after a small delay so the app boots first).
  useEffect(() => {
    const t = window.setTimeout(checkForUpdate, CHECK_ON_STARTUP_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [checkForUpdate]);

  return { ...state, checkForUpdate, installUpdate, dismiss };
}
