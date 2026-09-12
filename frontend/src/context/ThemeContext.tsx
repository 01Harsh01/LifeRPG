import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "obsidian" | "crimson" | "emerald" | "cyberpunk" | "gold";
export type ColorMode = "dark" | "light";

interface ThemeContextValue {
  theme: ThemeName;
  colorMode: ColorMode;
  setTheme: (theme: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  applyThemeFromItem: (itemName: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("life_rpg_color_mode") as ColorMode | null;
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("life_rpg_theme") as ThemeName | null;
      if (saved) return saved;
    }
    return "obsidian";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (colorMode === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
      localStorage.setItem("life_rpg_color_mode", colorMode);
    }
  }, [colorMode]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "obsidian") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
      localStorage.setItem("life_rpg_theme", theme);
    }
  }, [theme]);

  function setColorMode(mode: ColorMode) {
    setColorModeState(mode);
  }

  function toggleColorMode() {
    setColorModeState((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function setTheme(newTheme: ThemeName) {
    setThemeState(newTheme);
  }

  function applyThemeFromItem(itemName: string) {
    const lower = itemName.toLowerCase();
    if (lower.includes("crimson")) {
      setThemeState("crimson");
    } else if (lower.includes("emerald")) {
      setThemeState("emerald");
    } else if (lower.includes("cyberpunk")) {
      setThemeState("cyberpunk");
    } else if (lower.includes("gold")) {
      setThemeState("gold");
    } else {
      setThemeState("obsidian");
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorMode,
        setTheme,
        setColorMode,
        toggleColorMode,
        applyThemeFromItem,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
