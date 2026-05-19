"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAppSettings,
  getDefaultAppSettings,
} from "../lib/appSettingsStorage";

import type {
  AppAccentColor,
  AppSettings,
} from "../lib/appSettingsStorage";

type AppThemeProviderProps = {
  children: ReactNode;
};

type AccentColors = {
  primary: string;
  primaryHover: string;
  soft: string;
  border: string;
  text: string;
};

const accentColors: Record<AppAccentColor, AccentColors> = {
  zinc:
    {
      primary:
        "#18181b",

      primaryHover:
        "#27272a",

      soft:
        "#f4f4f5",

      border:
        "#e4e4e7",

      text:
        "#18181b",
    },

  blue:
    {
      primary:
        "#2563eb",

      primaryHover:
        "#1d4ed8",

      soft:
        "#eff6ff",

      border:
        "#bfdbfe",

      text:
        "#1d4ed8",
    },

  indigo:
    {
      primary:
        "#4f46e5",

      primaryHover:
        "#4338ca",

      soft:
        "#eef2ff",

      border:
        "#c7d2fe",

      text:
        "#4338ca",
    },

  emerald:
    {
      primary:
        "#059669",

      primaryHover:
        "#047857",

      soft:
        "#ecfdf5",

      border:
        "#a7f3d0",

      text:
        "#047857",
    },

  amber:
    {
      primary:
        "#d97706",

      primaryHover:
        "#b45309",

      soft:
        "#fffbeb",

      border:
        "#fde68a",

      text:
        "#b45309",
    },

  orange:
    {
      primary:
        "#ea580c",

      primaryHover:
        "#c2410c",

      soft:
        "#fff7ed",

      border:
        "#fed7aa",

      text:
        "#c2410c",
    },

  red:
    {
      primary:
        "#dc2626",

      primaryHover:
        "#b91c1c",

      soft:
        "#fef2f2",

      border:
        "#fecaca",

      text:
        "#b91c1c",
    },
};

function getSafeAccentColor(
  value: unknown
): AppAccentColor {
  if (value === "blue") {
    return "blue";
  }

  if (value === "indigo") {
    return "indigo";
  }

  if (value === "emerald") {
    return "emerald";
  }

  if (value === "amber") {
    return "amber";
  }

  if (value === "orange") {
    return "orange";
  }

  if (value === "red") {
    return "red";
  }

  return "zinc";
}

function getSafeColors(
  settings: AppSettings
): AccentColors {
  const accentColor =
    getSafeAccentColor(
      settings.appAccentColor ||
        settings.accentColor
    );

  return (
    accentColors[
      accentColor
    ] || accentColors.zinc
  );
}

function applySettings(
  settings: AppSettings
) {
  if (typeof document === "undefined") {
    return;
  }

  const colors =
    getSafeColors(
      settings
    );

  const safeAccentColor =
    getSafeAccentColor(
      settings.appAccentColor ||
        settings.accentColor
    );

  const theme =
    settings.theme ||
    "modern";

  document.documentElement.dataset.theme =
    theme;

  document.documentElement.dataset.accent =
    safeAccentColor;

  document.documentElement.classList.toggle(
    "dark",
    Boolean(
      settings.darkMode ||
        theme === "dark"
    )
  );

  document.documentElement.style.setProperty(
    "--app-accent",
    colors.primary
  );

  document.documentElement.style.setProperty(
    "--app-accent-hover",
    colors.primaryHover
  );

  document.documentElement.style.setProperty(
    "--app-accent-soft",
    colors.soft
  );

  document.documentElement.style.setProperty(
    "--app-accent-border",
    colors.border
  );

  document.documentElement.style.setProperty(
    "--app-accent-text",
    colors.text
  );
}

export default function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  const [settings, setSettings] =
    useState(
      () =>
        getDefaultAppSettings()
    );

  useMemo(
    () =>
      getSafeColors(
        settings
      ),
    [
      settings,
    ]
  );

  useEffect(() => {
    const loadedSettings =
      getAppSettings();

    setSettings(
      loadedSettings
    );

    applySettings(
      loadedSettings
    );
  }, []);

  useEffect(() => {
    function handleSettingsUpdated() {
      const nextSettings =
        getAppSettings();

      setSettings(
        nextSettings
      );

      applySettings(
        nextSettings
      );
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    window.addEventListener(
      "storage",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );

      window.removeEventListener(
        "storage",
        handleSettingsUpdated
      );
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
}