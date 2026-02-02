export type Theme = "light" | "dark";

export const THEME_KEY = "fs-theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getPreferredTheme();
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
