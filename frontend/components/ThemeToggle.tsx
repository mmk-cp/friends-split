"use client";

import React from "react";
import { applyTheme, resolveTheme, THEME_KEY, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const t = resolveTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:translate-y-[-1px]"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="text-base">{theme === "dark" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">{theme === "dark" ? "دارک" : "روشن"}</span>
    </button>
  );
}
