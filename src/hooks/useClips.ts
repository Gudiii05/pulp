import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Clip, TabFilter } from "../types";

export function useClips(tab: TabFilter, query: string) {
  const [clips, setClips] = useState<Clip[]>([]);
  const debounceRef = useRef<number | undefined>(undefined);

  const fetchClips = useCallback(async () => {
    try {
      const trimmed = query.trim();
      let list: Clip[];
      if (trimmed.length > 0) {
        list = await invoke<Clip[]>("search_clips", { query: trimmed });
        if (tab !== "all") list = list.filter((c) => c.clipType === tab);
      } else {
        const clipType = tab === "all" ? null : tab;
        list = await invoke<Clip[]>("get_clips", { limit: 200, clipType });
      }
      setClips(list);
    } catch (err) {
      console.error("fetchClips failed", err);
    }
  }, [tab, query]);

  // Initial + tab change → immediate
  useEffect(() => {
    if (query.trim().length === 0) {
      fetchClips();
      return;
    }
    // Debounce search input
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(fetchClips, 150);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fetchClips, query]);

  const refresh = useCallback(() => {
    fetchClips();
  }, [fetchClips]);

  const copy = useCallback(async (clip: Clip): Promise<boolean> => {
    if (clip.clipType === "IMAGE") {
      // Images are stored as thumbnails only; we cannot reliably restore
      // full-res binary. Skip with a console note for now.
      console.warn("Image copy-back not supported yet");
      return false;
    }
    try {
      await invoke("copy_to_clipboard", { content: clip.content });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const pin = useCallback(
    async (clip: Clip) => {
      try {
        await invoke("pin_clip", { id: clip.id, pinned: !clip.pinned });
        fetchClips();
      } catch (e) {
        console.error(e);
      }
    },
    [fetchClips]
  );

  const remove = useCallback(
    async (clip: Clip) => {
      try {
        await invoke("delete_clip", { id: clip.id });
        fetchClips();
      } catch (e) {
        console.error(e);
      }
    },
    [fetchClips]
  );

  const clearAll = useCallback(async () => {
    try {
      await invoke("clear_history");
      setClips([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sorted = useMemo(() => clips, [clips]);

  return { clips: sorted, refresh, copy, pin, remove, clearAll };
}
