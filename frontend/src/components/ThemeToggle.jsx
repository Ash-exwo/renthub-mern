import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      if (localStorage.getItem("theme") === "dark") {
        localStorage.removeItem("theme");
      }
      return localStorage.getItem("renthub_theme_v2") === "dark";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("renthub_theme_v2", theme);
    } catch (e) {}
  }, [isDark]);

  return (
    <button
      type="button"
      className={`relative w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-espresso)] grid place-items-center cursor-pointer transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-primary)] hover:scale-105 active:scale-95 shadow-sm shrink-0 group ${className}`}
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="grid place-items-center transition-transform duration-300 group-hover:rotate-45">
        {isDark ? (
          <Sun size={17} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
        ) : (
          <Moon size={17} className="text-[var(--color-brand-primary)]" />
        )}
      </div>
    </button>
  );
}

export default ThemeToggle;
