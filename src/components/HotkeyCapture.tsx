import { useEffect, useRef, useState } from "react";
import styles from "./HotkeyCapture.module.css";

interface HotkeyCaptureProps {
  value: string;
  onChange: (combo: string) => void;
}

/**
 * Translates a KeyboardEvent into Tauri's shortcut format,
 * e.g. "CommandOrControl+Shift+V".
 */
function comboFromEvent(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  const key = e.key;
  // Ignore modifier-only keys
  if (
    key === "Control" ||
    key === "Shift" ||
    key === "Alt" ||
    key === "Meta"
  ) {
    return null;
  }

  // Normalize key to Tauri/electron-accelerator style
  let mainKey = key.length === 1 ? key.toUpperCase() : key;
  // Special-case function keys, arrow keys, etc. which already match
  if (key.startsWith("Arrow")) mainKey = key.replace("Arrow", "");
  if (key === " ") mainKey = "Space";

  if (parts.length === 0) return null; // require at least one modifier
  parts.push(mainKey);
  return parts.join("+");
}

function display(combo: string): string {
  return combo
    .replace("CommandOrControl", "Ctrl")
    .split("+")
    .join(" + ");
}

export default function HotkeyCapture({ value, onChange }: HotkeyCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const combo = comboFromEvent(e);
      if (combo) {
        onChange(combo);
        setCapturing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [capturing, onChange]);

  useEffect(() => {
    if (capturing && boxRef.current) {
      boxRef.current.focus();
    }
  }, [capturing]);

  return (
    <div
      ref={boxRef}
      className={`${styles.box} ${capturing ? styles.capturing : ""}`}
      tabIndex={0}
      onClick={() => setCapturing(true)}
      onBlur={() => setCapturing(false)}
      role="button"
    >
      {capturing ? (
        <span className={styles.hint}>Press a combination…</span>
      ) : (
        <span className={styles.combo}>{display(value)}</span>
      )}
      <span className={styles.edit}>
        {capturing ? "Esc to cancel" : "Click to change"}
      </span>
    </div>
  );
}
