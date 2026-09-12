import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "obsidian" | "crimson" | "emerald" | "cyberpunk" | "gold";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  applyThemeFromItem: (itemName: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("life_rpg_theme") as ThemeName | null;
      if (saved) return saved;
    }
    return "obsidian";
  });

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
    <ThemeContext.Provider value={{ theme, setTheme, applyThemeFromItem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
