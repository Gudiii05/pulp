import type { TabFilter } from "../types";
import styles from "./TabBar.module.css";

interface TabBarProps {
  active: TabFilter;
  onChange: (t: TabFilter) => void;
}

const TABS: { key: TabFilter; label: string; dot: string }[] = [
  { key: "all", label: "All", dot: "var(--text-tertiary)" },
  { key: "TEXT", label: "Text", dot: "var(--badge-text-fg)" },
  { key: "CODE", label: "Code", dot: "var(--badge-code-fg)" },
  { key: "IMAGE", label: "Image", dot: "var(--badge-img-fg)" },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className={styles.tabs}>
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`${styles.tab} ${active === t.key ? styles.active : ""}`}
          onClick={() => onChange(t.key)}
        >
          <span
            className={styles.dot}
            style={{ background: t.dot }}
            aria-hidden
          />
          {t.label}
        </button>
      ))}
    </div>
  );
}
