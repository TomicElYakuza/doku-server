"use client";

import {
  updateAppSettings,
} from "../lib/appSettingsStorage";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({
  className = "",
}: ThemeToggleProps) {
  const {
    mounted,
    darkMode,
    theme,
  } = useAppSettings();

  if (!mounted) {
    return null;
  }

  function handleToggle() {
    const nextDarkMode =
      !darkMode;

    updateAppSettings({
      darkMode:
        nextDarkMode,

      theme:
        nextDarkMode
          ? "dark"
          : theme === "dark"
            ? "modern"
            : theme,
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition ${className}`}
      title={
        darkMode
          ? "Dark Mode deaktivieren"
          : "Dark Mode aktivieren"
      }
    >
      <span className="text-base">
        {darkMode ? "☀" : "☾"}
      </span>

      <span className="hidden md:inline">
        {darkMode ? "Hell" : "Dunkel"}
      </span>
    </button>
  );
}