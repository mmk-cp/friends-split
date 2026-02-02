"use client";

import React from "react";
import { applyTheme, resolveTheme, THEME_KEY } from "@/lib/theme";

export default function ThemeManager() {
  React.useEffect(() => {
    const theme = resolveTheme();
    applyTheme(theme);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_KEY) return;
      applyTheme(resolveTheme());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
