import { useCallback, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getSystemPrefersDark(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch {
    return false;
  }
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    const prefersDark = getSystemPrefersDark();
    return prefersDark ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemPrefersDark());

  // Keep system preference in sync when using system mode
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDark = "matches" in e ? e.matches : (e as MediaQueryList).matches;
      setSystemDark(isDark);
    };
    // Initial sync
    handler(mql);
    mql.addEventListener?.("change", handler as (ev: MediaQueryListEvent) => void);
    return () => {
      mql.removeEventListener?.("change", handler as (ev: MediaQueryListEvent) => void);
    };
  }, []);

  const effectiveTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") return systemDark ? "dark" : "light";
    return theme;
  }, [theme, systemDark]);

  // Apply class on html element and persist
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore persistence errors
    }
  }, [theme, effectiveTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setLight = useCallback(() => setTheme("light"), []);
  const setDark = useCallback(() => setTheme("dark"), []);
  const setSystem = useCallback(() => setTheme("system"), []);

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === "dark",
    toggleTheme,
    setLight,
    setDark,
    setSystem,
  };
}



