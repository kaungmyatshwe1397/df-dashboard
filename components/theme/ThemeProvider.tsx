// ThemeProvider keeps the persisted appearance choice available to authenticated controls.

"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
} from "react";

export type ThemeModeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeModeType;
  setTheme: (theme: ThemeModeType) => void;
}

const THEME_STORAGE_KEY = "dc-fms-theme";
const ThemeContext = createContext<ThemeContextType | null>(null);
let currentTheme: ThemeModeType = "dark";
const themeListeners = new Set<() => void>();

function applyTheme(theme: ThemeModeType) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
}

function getThemeSnapshot(): ThemeModeType {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      currentTheme = savedTheme;
    }
  } catch {
    return currentTheme;
  }
  return currentTheme;
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    currentTheme = event.newValue === "light" ? "light" : "dark";
    applyTheme(currentTheme);
    themeListeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    (): ThemeModeType => "dark",
  );

  function setTheme(nextTheme: ThemeModeType) {
    currentTheme = nextTheme;
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The in-memory state still applies when browser storage is unavailable.
    }
    themeListeners.forEach((notify) => notify());
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
