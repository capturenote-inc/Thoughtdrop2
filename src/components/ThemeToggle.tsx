"use client";

type Theme = "light" | "dark";

function activeTheme(): Theme {
  if (typeof window === "undefined") return "light";
  if (document.documentElement.dataset.theme === "dark") return "dark";
  if (document.documentElement.dataset.theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  function toggleTheme() {
    const next = activeTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("thoughtdrop-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Toggle light or dark appearance"
      aria-label="Toggle light or dark appearance"
      className={`flex items-center rounded-lg text-rail-muted transition-colors hover:bg-rail-active hover:text-rail-ink ${compact ? "h-9 w-9 justify-center" : "h-9 w-full px-[11px] text-[12px]"}`}
    >
      <span aria-hidden className="theme-icon-dark text-[15px] leading-none">◐</span>
      <span aria-hidden className="theme-icon-light text-[15px] leading-none">☀</span>
      {!compact && <span className="theme-label ml-3">Dark mode</span>}
    </button>
  );
}
