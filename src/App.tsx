import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import TabBar from "./components/TabBar";
import ClipList from "./components/ClipList";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import UpdateBanner from "./components/UpdateBanner";
import Settings from "./components/Settings";
import { useClips } from "./hooks/useClips";
import { useTheme } from "./hooks/useTheme";
import { useUpdater } from "./hooks/useUpdater";
import type { Clip, TabFilter } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [tab, setTab] = useState<TabFilter>("all");
  const [query, setQuery] = useState("");
  const { clips, refresh, copy, pin, remove, clearAll } = useClips(tab, query);
  const { theme, toggle: toggleTheme } = useTheme();
  const updater = useUpdater();
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const p1 = listen("clip-added", () => refresh());
    const p2 = listen("history-cleared", () => refresh());
    return () => {
      p1.then((fn) => fn());
      p2.then((fn) => fn());
    };
  }, [refresh]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const handleCopy = useCallback(
    async (clip: Clip) => {
      const ok = await copy(clip);
      if (ok) showToast("Copied!");
    },
    [copy, showToast]
  );

  const handleClear = useCallback(async () => {
    await clearAll();
    showToast("History cleared");
  }, [clearAll, showToast]);

  return (
    <div className={styles.app}>
      <Header
        count={clips.length}
        theme={theme}
        onToggleTheme={toggleTheme}
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
            onCopy={handleCopy}
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
      />
    </div>
  );
}
