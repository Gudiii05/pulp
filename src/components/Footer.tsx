import styles from "./Footer.module.css";

interface FooterProps {
  onClearHistory: () => void;
}

export default function Footer({ onClearHistory }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.hint}>
        <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> to open
      </div>
      <button className={styles.clearBtn} onClick={onClearHistory}>
        Clear history
      </button>
    </footer>
  );
}
