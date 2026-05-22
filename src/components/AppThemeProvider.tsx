"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  appSettingsRepository,
} from "../lib/appSettingsRepository";

import type {
  AppSettings,
} from "../types/settings";

type AppThemeProviderProps = {
  children: ReactNode;
};

function getAccentColorValue(
  accentColor?: string
) {
  if (accentColor === "blue") {
    return "#2563eb";
  }

  if (accentColor === "green") {
    return "#16a34a";
  }

  if (accentColor === "red") {
    return "#dc2626";
  }

  if (accentColor === "orange") {
    return "#ea580c";
  }

  if (accentColor === "purple") {
    return "#7c3aed";
  }

  if (accentColor === "indigo") {
    return "#4f46e5";
  }

  return "#18181b";
}

function applyTheme(
  settings: AppSettings
) {
  if (typeof document === "undefined") {
    return;
  }

  const root =
    document.documentElement;

  const body =
    document.body;

  const darkModeEnabled =
    Boolean(
      settings.darkMode
    ) ||
    settings.theme === "dark";

  root.classList.toggle(
    "dark",
    darkModeEnabled
  );

  root.classList.toggle(
    "light",
    !darkModeEnabled
  );

  root.dataset.theme =
    darkModeEnabled
      ? "dark"
      : "light";

  root.dataset.accent =
    settings.accentColor ||
    settings.appAccentColor ||
    "zinc";

  root.style.setProperty(
    "--app-accent",
    getAccentColorValue(
      settings.accentColor ||
      settings.appAccentColor
    )
  );

  body.classList.toggle(
    "app-dark",
    darkModeEnabled
  );

  body.classList.toggle(
    "app-light",
    !darkModeEnabled
  );

  body.classList.toggle(
    "app-compact",
    Boolean(
      settings.compactMode
    )
  );
}

export default function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

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

  useEffect(() => {
    applyTheme(
      settings
    );
  }, [
    settings,
  ]);

  async function loadSettings() {
    try {
      const nextSettings =
        await appSettingsRepository.get();

      setSettings(
        nextSettings
      );

      applyTheme(
        nextSettings
      );
    } catch (error) {
      console.error(
        "Theme-Einstellungen konnten nicht geladen werden:",
        error
      );

      const fallbackSettings =
        appSettingsRepository.getDefault();

      setSettings(
        fallbackSettings
      );

      applyTheme(
        fallbackSettings
      );
    }
  }

  return (
    <>
      {children}
    </>
  );
}