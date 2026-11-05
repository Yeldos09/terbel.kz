import { createContext, useContext } from "react";

export type ThemeName = "dark" | "light";

export const THEME_STORAGE_KEY = "terbel.theme";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function readTheme(): ThemeName {
  if (document.documentElement.dataset.theme === "light") return "light";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider missing");
  return value;
}
