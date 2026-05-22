import { useLayoutEffect, useRef, useState } from "react";
import type { Clip } from "../types";
import styles from "./ClipItem.module.css";

interface ClipItemProps {
  clip: Clip;
  index: number;
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
  onCopy,
  onPin,
  onDelete,
}: ClipItemProps) {
  const enterDelay = Math.min(index, 12) * 30;
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [clip.content, clip.thumbnail]);

  return (
    <div
      className={styles.item}
      style={{ animationDelay: `${enterDelay}ms` }}
      onClick={() => onCopy(clip)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.row1}>
        <span className={`${styles.badge} ${badgeClass(clip.clipType)}`}>
          {badgeLabel(clip.clipType)}
        </span>
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
