import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: ToggleProps) {
  return (
    <button
      className={`${styles.toggle} ${checked ? styles.on : ""}`}
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className={styles.knob} />
    </button>
  );
}
