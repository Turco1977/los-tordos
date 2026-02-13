/**
 * Dark mode theme management.
 * Persists preference to localStorage.
 * Sets data-theme on <html> and injects CSS custom properties.
 */

import { useState, useEffect } from "react";
import { T, TD } from "@/lib/constants";

export type ThemeMode = "light" | "dark";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored) setMode(stored);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setMode("dark");
  }, []);

  // Sync data-theme attribute on document
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggle = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  const colors = mode === "dark" ? TD : T;
  const isDark = mode === "dark";
  const cardBg = isDark ? colors.g2 : "#fff";
  const headerBg = isDark ? colors.g2 : "#fff";

  return { mode, toggle, colors, isDark, cardBg, headerBg };
}

/** CSS string to inject for dark mode — handles inputs, selects, scrollbars */
export const darkCSS = `
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea {
  background: #1E293B !important;
  color: #E2E8F0 !important;
  border-color: #334155 !important;
}
[data-theme="dark"] input::placeholder,
[data-theme="dark"] textarea::placeholder {
  color: #94A3B8 !important;
}
[data-theme="dark"] ::-webkit-scrollbar { width: 6px; }
[data-theme="dark"] ::-webkit-scrollbar-track { background: #0F172A; }
[data-theme="dark"] ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
`;
