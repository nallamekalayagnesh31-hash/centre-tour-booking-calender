import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "intellitots" | "cosmic" | "forest" | "candy" | "ocean";
export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("app-theme") as ThemeName;
    return saved && ["intellitots", "cosmic", "forest", "candy", "ocean"].includes(saved)
      ? saved
      : "intellitots";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("app-theme-mode") as ThemeMode;
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("app-theme-mode", newMode);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Manage Dark Mode class
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 2. Manage Theme classes
    const themeClasses = ["theme-cosmic", "theme-forest", "theme-candy", "theme-ocean"];
    themeClasses.forEach((cls) => root.classList.remove(cls));

    if (theme !== "intellitots") {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
