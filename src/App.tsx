import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import TabBar from "./components/TabBar";
import ClipList from "./components/ClipList";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import UpdateBanner from "./components/UpdateBanner";
import Settings from "./components/Settings";
import Onboarding from "./components/Onboarding";
import { useClips } from "./hooks/useClips";
import { useTheme } from "./hooks/useTheme";
import { useUpdater } from "./hooks/useUpdater";
import { usePaused } from "./hooks/usePaused";
import { useOnboarding } from "./hooks/useOnboarding";
import type { Clip, TabFilter } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [tab, setTab] = useState<TabFilter>("all");
  const [query, setQuery] = useState("");
  const { clips, refresh, copy, pin, remove, clearAll } = useClips(tab, query);
  const { theme, toggle: toggleTheme } = useTheme();
  const { paused, toggle: togglePaused } = usePaused();
  const updater = useUpdater();
  const onboarding = useOnboarding();
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const p1 = listen("clip-added", () => refresh());
    const p2 = listen("history-cleared", () => refresh());
    return () => {
      p1.then((fn) => fn());
      p2.then((fn) => fn());
    };
  }, [refresh]);

  // Sync the lock toggle to the backend so the blur handler in Rust knows
  // whether it should hide the window when focus moves to another app.
  useEffect(() => {
    invoke("set_locked", { locked }).catch((e) => {
      console.error("set_locked failed", e);
    });
  }, [locked]);

  // Reset selection when list changes shape (new tab, new search)
  useEffect(() => {
    setSelectedIndex(0);
  }, [tab, query]);

  // Keep selection inside the list bounds when clips array shrinks/grows
  useEffect(() => {
    if (selectedIndex >= clips.length && clips.length > 0) {
      setSelectedIndex(clips.length - 1);
    }
  }, [clips.length, selectedIndex]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const handleCopy = useCallback(
    async (clip: Clip) => {
      const ok = await copy(clip);
      if (ok) showToast("Copied!");
      return ok;
    },
    [copy, showToast]
  );

  const handleClear = useCallback(async () => {
    await clearAll();
    showToast("History cleared");
  }, [clearAll, showToast]);

  const hideWindow = useCallback(async () => {
    try {
      await invoke("hide_window");
    } catch (e) {
      console.error(e);
    }
  }, []);

  const copyAndClose = useCallback(
    async (clip: Clip) => {
      const ok = await handleCopy(clip);
      if (ok && !locked) {
        // Give the toast a moment to render before hiding
        setTimeout(() => hideWindow(), 120);
      }
    },
    [handleCopy, hideWindow, locked]
  );

  // Global keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't interfere when typing inside the settings panel inputs
      const target = e.target as HTMLElement | null;
      const inSettings = target?.closest("[data-settings-root]");
      if (inSettings) return;

      // Ctrl+1..9 → copy the Nth visible clip directly, regardless of focus
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        const clip = clips[idx];
        if (clip) copyAndClose(clip);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        hideWindow();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(clips.length - 1, 0)));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        // Skip if currently focused inside a button (let onClick handle)
        const tag = target?.tagName?.toLowerCase();
        if (tag === "button") return;
        const clip = clips[selectedIndex];
        if (clip) {
          e.preventDefault();
          copyAndClose(clip);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clips, selectedIndex, copyAndClose, hideWindow]);

  return (
    <div className={styles.app}>
      <Header
        count={clips.length}
        theme={theme}
        paused={paused}
        locked={locked}
        onToggleTheme={toggleTheme}
        onTogglePaused={togglePaused}
        onToggleLocked={() => setLocked((v) => !v)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <UpdateBanner
        status={updater.status}
        version={updater.version}
        progress={updater.progress}
        error={updater.error}
        onInstall={updater.installUpdate}
        onDismiss={updater.dismiss}
      />
      <SearchBar value={query} onChange={setQuery} />
      <TabBar active={tab} onChange={setTab} />
      <div className={`${styles.body} scroll-area`}>
        {clips.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Nothing here yet</div>
            <div>Copy something and it shows up.</div>
          </div>
        ) : (
          <ClipList
            clips={clips}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onCopy={copyAndClose}
            onPin={pin}
            onDelete={remove}
          />
        )}
      </div>
      <Footer onClearHistory={handleClear} />
      {toast && <Toast message={toast} />}
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onReplayOnboarding={() => {
          setSettingsOpen(false);
          onboarding.replay();
        }}
      />
      <Onboarding open={onboarding.open} onFinish={onboarding.finish} />
    </div>
  );
}
