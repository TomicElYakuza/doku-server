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

type AccentDefinition = {
  accent: string;
  hover: string;
  soft: string;
  border: string;
  text: string;
  gradient: string;
  gradientSoft: string;
  shadow: string;
};

const accentDefinitions: Record<string, AccentDefinition> = {
  velunis: {
    accent: "#4f46e5",
    hover: "#4338ca",
    soft: "#eef2ff",
    border: "#c7d2fe",
    text: "#3730a3",
    gradient:
      "linear-gradient(135deg, #2563eb 0%, #4f46e5 45%, #7c3aed 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12))",
    shadow: "0 16px 40px rgba(79, 70, 229, 0.24)",
  },
  zinc: {
    accent: "#18181b",
    hover: "#27272a",
    soft: "#f4f4f5",
    border: "#d4d4d8",
    text: "#18181b",
    gradient:
      "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(24, 24, 27, 0.08), rgba(63, 63, 70, 0.08))",
    shadow: "0 16px 40px rgba(24, 24, 27, 0.16)",
  },
  blue: {
    accent: "#2563eb",
    hover: "#1d4ed8",
    soft: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    gradient:
      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(29, 78, 216, 0.12))",
    shadow: "0 16px 40px rgba(37, 99, 235, 0.22)",
  },
  purple: {
    accent: "#7c3aed",
    hover: "#6d28d9",
    soft: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
    gradient:
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(168, 85, 247, 0.12))",
    shadow: "0 16px 40px rgba(124, 58, 237, 0.22)",
  },
  indigo: {
    accent: "#4f46e5",
    hover: "#4338ca",
    soft: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
    gradient:
      "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(99, 102, 241, 0.12))",
    shadow: "0 16px 40px rgba(79, 70, 229, 0.22)",
  },
  emerald: {
    accent: "#059669",
    hover: "#047857",
    soft: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
    gradient:
      "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(16, 185, 129, 0.12))",
    shadow: "0 16px 40px rgba(5, 150, 105, 0.20)",
  },
  amber: {
    accent: "#d97706",
    hover: "#b45309",
    soft: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    gradient:
      "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(245, 158, 11, 0.12))",
    shadow: "0 16px 40px rgba(217, 119, 6, 0.18)",
  },
  red: {
    accent: "#dc2626",
    hover: "#b91c1c",
    soft: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
    gradient:
      "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(239, 68, 68, 0.12))",
    shadow: "0 16px 40px rgba(220, 38, 38, 0.18)",
  },
  orange: {
    accent: "#ea580c",
    hover: "#c2410c",
    soft: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    gradient:
      "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(249, 115, 22, 0.12))",
    shadow: "0 16px 40px rgba(234, 88, 12, 0.18)",
  },
  green: {
    accent: "#16a34a",
    hover: "#15803d",
    soft: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    gradient:
      "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    gradientSoft:
      "linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(34, 197, 94, 0.12))",
    shadow: "0 16px 40px rgba(22, 163, 74, 0.18)",
  },
};

function getAccentDefinition(accentColor?: string) {
  return accentDefinitions[accentColor || "velunis"] || accentDefinitions.velunis;
}

function getSystemDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getDarkModeEnabled(settings: AppSettings) {
  if (settings.theme === "dark") {
    return true;
  }

  if (settings.theme === "light") {
    return false;
  }

  if (settings.theme === "system") {
    return getSystemDarkMode();
  }

  return Boolean(settings.darkMode);
}

function applyTheme(settings: AppSettings) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const body = document.body;

  const accentColor =
    settings.appAccentColor ||
    settings.accentColor ||
    "velunis";

  const accentDefinition = getAccentDefinition(accentColor);
  const darkModeEnabled = getDarkModeEnabled(settings);

  root.classList.toggle("dark", darkModeEnabled);
  root.classList.toggle("light", !darkModeEnabled);

  root.dataset.theme = darkModeEnabled ? "dark" : "light";
  root.dataset.appTheme = settings.theme || "modern";
  root.dataset.accent = accentColor;

  root.style.setProperty("--app-accent", accentDefinition.accent);
  root.style.setProperty("--app-accent-hover", accentDefinition.hover);
  root.style.setProperty("--app-accent-soft", accentDefinition.soft);
  root.style.setProperty("--app-accent-border", accentDefinition.border);
  root.style.setProperty("--app-accent-text", accentDefinition.text);
  root.style.setProperty("--app-brand-gradient", accentDefinition.gradient);
  root.style.setProperty(
    "--app-brand-gradient-soft",
    accentDefinition.gradientSoft,
  );
  root.style.setProperty("--app-brand-shadow", accentDefinition.shadow);

  body.classList.toggle("app-dark", darkModeEnabled);
  body.classList.toggle("app-light", !darkModeEnabled);
  body.classList.toggle("app-compact", Boolean(settings.compactMode));
}

export default function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(
    appSettingsRepository.getDefault(),
  );

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const nextSettings = await appSettingsRepository.get();

        if (!active) {
          return;
        }

        setSettings(nextSettings);
      } catch (error) {
        console.error(
          "Theme-Einstellungen konnten nicht geladen werden:",
          error,
        );

        if (!active) {
          return;
        }

        setSettings(appSettingsRepository.getDefault());
      }
    }

    function handleSettingsUpdated() {
      void loadSettings();
    }

    void loadSettings();

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated,
    );

    return () => {
      active = false;

      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated,
      );
    };
  }, []);

  useEffect(() => {
    function handleSystemThemeChange() {
      setSettings((currentSettings) => ({
        ...currentSettings,
      }));
    }

    const mediaQuery =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    mediaQuery?.addEventListener(
      "change",
      handleSystemThemeChange,
    );

    return () => {
      mediaQuery?.removeEventListener(
        "change",
        handleSystemThemeChange,
      );
    };
  }, []);

  useEffect(() => {
    applyTheme(settings);
  }, [
    settings,
  ]);

  return (
    <>
      {children}
    </>
  );
}