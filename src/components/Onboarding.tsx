import { useState } from "react";
import PulpLogo from "./PulpLogo";
import styles from "./Onboarding.module.css";

interface OnboardingProps {
  open: boolean;
  onFinish: () => void;
}

const STEPS = 3;

export default function Onboarding({ open, onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else onFinish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className={styles.overlay} data-settings-root>
      <div className={styles.panel}>
        <button
          className={styles.skip}
          onClick={onFinish}
          aria-label="Skip onboarding"
        >
          Skip
        </button>

        <div className={styles.stepBody}>
          {step === 0 && (
            <>
              <div className={styles.heroLogo}>
                <PulpLogo size={64} />
              </div>
              <h1 className={styles.title}>Welcome to Pulp</h1>
              <p className={styles.body}>
                Pulp runs quietly in the background and saves everything you
                copy. It lives in your system tray — bottom-right corner of
                your screen, next to the clock. Look for the dark P icon.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className={styles.hotkey}>
                <kbd>Ctrl</kbd>
                <span className={styles.plus}>+</span>
                <kbd>Shift</kbd>
                <span className={styles.plus}>+</span>
                <kbd>V</kbd>
              </div>
              <h1 className={styles.title}>Open from anywhere</h1>
              <p className={styles.body}>
                Press this combination in any app and Pulp pops up. You can
                change it later in Settings.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.copyVisual}>
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="8"
                    y="3"
                    width="13"
                    height="13"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M5 8h-.5A1.5 1.5 0 0 0 3 9.5v10A1.5 1.5 0 0 0 4.5 21h10a1.5 1.5 0 0 0 1.5-1.5V19"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h1 className={styles.title}>Just copy</h1>
              <p className={styles.body}>
                Copy text, code, or images — Pulp captures it automatically.
                Click any clip to send it back to your clipboard, or use{" "}
                <kbd className={styles.inlineKbd}>↑↓</kbd> +{" "}
                <kbd className={styles.inlineKbd}>Enter</kbd> for keyboard
                navigation.
              </p>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.dots}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
              />
            ))}
          </div>

          <div className={styles.actions}>
            {step > 0 && (
              <button className={styles.secondary} onClick={back}>
                Back
              </button>
            )}
            <button className={styles.primary} onClick={next}>
              {step === STEPS - 1 ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
