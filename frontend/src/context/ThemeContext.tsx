import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type ColorMode = Theme;
export type ThemeName = Theme;

interface ThemeContextValue {
  theme: Theme;
  colorMode: Theme;
  setTheme: (theme: Theme) => void;
  setColorMode: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleColorMode: () => void;
  applyThemeFromItem: (itemName: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = (localStorage.getItem("life_rpg_theme") || localStorage.getItem("life_rpg_color_mode")) as Theme | null;
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.removeAttribute("data-theme");
      if (theme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
      localStorage.setItem("life_rpg_theme", theme);
      localStorage.setItem("life_rpg_color_mode", theme);
    }
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function applyThemeFromItem(itemName: string) {
    const lower = itemName.toLowerCase();
    if (lower.includes("light") || lower.includes("sun") || lower.includes("day")) {
      setThemeState("light");
    } else {
      setThemeState("dark");
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorMode: theme,
        setTheme,
        setColorMode: setTheme,
        toggleTheme,
        toggleColorMode: toggleTheme,
        applyThemeFromItem,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
