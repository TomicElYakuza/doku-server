"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  appSettingsRepository,
} from "../lib/appSettingsRepository";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    void loadSettings();

    function handleSettingsUpdated() {
      void loadSettings();
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

  async function loadSettings() {
    try {
      const settings =
        await appSettingsRepository.get();

      setDarkMode(
        Boolean(
          settings.darkMode ||
            settings.theme === "dark"
        )
      );
    } catch (error) {
      console.error(
        "Theme konnte nicht geladen werden:",
        error
      );
    }
  }

  async function toggleTheme() {
    try {
      setLoading(
        true
      );

      const nextDarkMode =
        !darkMode;

      const settings =
        await appSettingsRepository.update({
          darkMode:
            nextDarkMode,

          theme:
            nextDarkMode
              ? "dark"
              : "modern",
        });

      setDarkMode(
        Boolean(
          settings.darkMode ||
            settings.theme === "dark"
        )
      );
    } catch (error) {
      console.error(
        "Theme konnte nicht geändert werden:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Theme konnte nicht geändert werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-100 transition disabled:opacity-50"
      title="Theme wechseln"
    >
      {darkMode
        ? "☀️ Hell"
        : "🌙 Dunkel"}
    </button>
  );
}