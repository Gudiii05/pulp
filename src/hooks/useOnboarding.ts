import { useCallback, useState } from "react";

const STORAGE_KEY = "pulp.onboarded";

function isOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function useOnboarding() {
  const [open, setOpen] = useState(() => !isOnboarded());

  const finish = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }, []);

  const replay = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setOpen(true);
  }, []);

  return { open, finish, replay };
}
