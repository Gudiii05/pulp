import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Clip } from "../types";
import { detectColor, detectUrl } from "../utils/smartClip";
import styles from "./ClipItem.module.css";

interface ClipItemProps {
  clip: Clip;
  index: number;
  selected: boolean;
  onHover: () => void;
  onCopy: (c: Clip) => void;
  onPin: (c: Clip) => void;
  onDelete: (c: Clip) => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function badgeClass(kind: Clip["clipType"]) {
  if (kind === "CODE") return styles.badgeCode;
  if (kind === "IMAGE") return styles.badgeImg;
  return styles.badgeText;
}

function badgeLabel(kind: Clip["clipType"]) {
  if (kind === "CODE") return "code";
  if (kind === "IMAGE") return "image";
  return "text";
}

export default function ClipItem({
  clip,
  index,
  selected,
  onHover,
  onCopy,
  onPin,
  onDelete,
}: ClipItemProps) {
  const enterDelay = Math.min(index, 12) * 30;
  const itemRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [clip.content, clip.thumbnail]);

  // URL and color detection runs on any non-image clip. We can't rely on
  // clipType === "TEXT" because the type classifier (correctly or not) may
  // route content with certain chars (e.g. "//") to CODE.
  const url = useMemo(
    () => (clip.clipType !== "IMAGE" ? detectUrl(clip.content) : null),
    [clip.clipType, clip.content]
  );
  const color = useMemo(
    () => (clip.clipType !== "IMAGE" ? detectColor(clip.content) : null),
    [clip.clipType, clip.content]
  );

  const handleOpenUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    try {
      await invoke("open_url", { url });
    } catch (err) {
      console.error("open_url failed", err);
    }
  };

  // Scroll selected item into view when keyboard navigation moves to it
  useLayoutEffect(() => {
    if (selected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={itemRef}
      className={`${styles.item} ${selected ? styles.selected : ""}`}
      style={{ animationDelay: `${enterDelay}ms` }}
      onClick={() => onCopy(clip)}
      onMouseEnter={onHover}
      role="button"
      tabIndex={-1}
    >
      <div className={styles.row1}>
        <span className={`${styles.badge} ${badgeClass(clip.clipType)}`}>
          {badgeLabel(clip.clipType)}
        </span>
        {color && (
          <span
            className={styles.colorSwatch}
            style={{ background: color }}
            title={color}
            aria-label={`color ${color}`}
          />
        )}
        {url && (
          <button
            className={styles.urlBtn}
            onClick={handleOpenUrl}
            title={`Open ${url}`}
            aria-label="Open URL"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 3h7v7M21 3l-9 9M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Open
          </button>
        )}
        {index < 9 && (
          <span className={styles.shortcutHint} title={`Ctrl+${index + 1}`}>
            ⌃{index + 1}
          </span>
        )}
        <span className={styles.spacer} />
        {clip.pinned && (
          <span className={styles.pinIcon} title="pinned" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 4l6 6-4 1-3 7-2-5-5-2 7-3 1-4z" />
            </svg>
          </span>
        )}
        <span className={styles.time}>{formatTime(clip.timestamp)}</span>
      </div>

      <div
        ref={contentRef}
        className={`${styles.contentWrap} ${
          overflowing ? styles.overflowing : ""
        }`}
      >
        {clip.clipType === "IMAGE" && clip.thumbnail ? (
          <div className={styles.imageWrap}>
            <img
              className={styles.image}
              src={`data:image/png;base64,${clip.thumbnail}`}
              alt="clipboard preview"
              draggable={false}
            />
            <div className={styles.imageMeta}>{clip.content}</div>
          </div>
        ) : clip.clipType === "CODE" ? (
          <pre className={styles.code}>{clip.content}</pre>
        ) : (
          <div className={styles.text}>{clip.content}</div>
        )}
      </div>

      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.iconBtn}
          onClick={() => onPin(clip)}
          title={clip.pinned ? "Unpin" : "Pin"}
          aria-label={clip.pinned ? "Unpin" : "Pin"}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 4l6 6-4 1-3 7-2-5-5-2 7-3 1-4z" />
          </svg>
        </button>
        <button
          className={`${styles.iconBtn} ${styles.danger}`}
          onClick={() => onDelete(clip)}
          title="Delete"
          aria-label="Delete"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-7 0v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
