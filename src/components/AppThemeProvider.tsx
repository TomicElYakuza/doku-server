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
  AppAccentColor,
  AppSettings,
} from "../types/settings";

type AppThemeProviderProps = {
  children: ReactNode;
};

function getAccentClass(
  color: AppAccentColor | string
) {
  if (color === "blue") {
    return "theme-blue";
  }

  if (color === "indigo") {
    return "theme-indigo";
  }

  if (color === "emerald") {
    return "theme-emerald";
  }

  if (color === "amber") {
    return "theme-amber";
  }

  if (color === "red") {
    return "theme-red";
  }

  return "theme-zinc";
}

function applyTheme(
  settings: AppSettings
) {
  if (typeof document === "undefined") {
    return;
  }

  const root =
    document.documentElement;

  root.classList.remove(
    "dark",
    "theme-zinc",
    "theme-blue",
    "theme-indigo",
    "theme-emerald",
    "theme-amber",
    "theme-red",
    "compact-mode"
  );

  if (
    settings.darkMode ||
    settings.theme === "dark"
  ) {
    root.classList.add(
      "dark"
    );
  }

  root.classList.add(
    getAccentClass(
      settings.accentColor ||
        settings.appAccentColor ||
        "zinc"
    )
  );

  if (settings.compactMode) {
    root.classList.add(
      "compact-mode"
    );
  }
}

export default function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(
      true
    );

    void loadAndApplyTheme();

    function handleSettingsUpdated() {
      void loadAndApplyTheme();
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

  async function loadAndApplyTheme() {
    try {
      const settings =
        await appSettingsRepository.get();

      applyTheme(
        settings
      );
    } catch (error) {
      console.error(
        "Theme konnte nicht geladen werden:",
        error
      );

      applyTheme(
        appSettingsRepository.getDefault()
      );
    }
  }

  if (!mounted) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <>
      {children}
    </>
  );
}