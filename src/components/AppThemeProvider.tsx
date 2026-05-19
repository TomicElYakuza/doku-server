"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  getAppSettings,
} from "../lib/appSettingsStorage";

import type {
  AppAccentColor,
  AppTheme,
} from "../lib/appSettingsStorage";

type AppThemeProviderProps = {
  children: ReactNode;
};

const accentColors: Record<
  AppAccentColor,
  {
    primary: string;
    primaryHover: string;
    soft: string;
    text: string;
    border: string;
  }
> = {
  zinc: {
    primary: "#18181b",
    primaryHover: "#3f3f46",
    soft: "#f4f4f5",
    text: "#27272a",
    border: "#d4d4d8",
  },

  indigo: {
    primary: "#4f46e5",
    primaryHover: "#6366f1",
    soft: "#eef2ff",
    text: "#4338ca",
    border: "#c7d2fe",
  },

  blue: {
    primary: "#2563eb",
    primaryHover: "#3b82f6",
    soft: "#eff6ff",
    text: "#1d4ed8",
    border: "#bfdbfe",
  },

  emerald: {
    primary: "#059669",
    primaryHover: "#10b981",
    soft: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
  },

  violet: {
    primary: "#7c3aed",
    primaryHover: "#8b5cf6",
    soft: "#f5f3ff",
    text: "#6d28d9",
    border: "#ddd6fe",
  },

  rose: {
    primary: "#e11d48",
    primaryHover: "#f43f5e",
    soft: "#fff1f2",
    text: "#be123c",
    border: "#fecdd3",
  },
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

  return prefersDark
    ? "dark"
    : "light";
}

function resolveTheme(
  theme: AppTheme
): "modern" | "light" | "dark" {
  if (theme === "system") {
    return getSystemTheme();
  }

  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  return "modern";
}

function isDarkTheme(
  theme: "modern" | "light" | "dark"
) {
  return theme === "dark";
}

export default function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  const [activeTheme, setActiveTheme] =
    useState<"modern" | "light" | "dark">("modern");

  const [accentColor, setAccentColor] =
    useState<AppAccentColor>("indigo");

  useEffect(() => {
    applySettings();

    function handleSettingsUpdated() {
      applySettings();
    }

    function handleSystemThemeChange() {
      applySettings();
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    const mediaQuery =
      window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      );

    mediaQuery?.addEventListener?.(
      "change",
      handleSystemThemeChange
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );

      mediaQuery?.removeEventListener?.(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  function applySettings() {
    const settings =
      getAppSettings();

    const nextTheme =
      resolveTheme(
        settings.theme
      );

    const nextAccent =
      settings.accentColor;

    setActiveTheme(
      nextTheme
    );

    setAccentColor(
      nextAccent
    );

    if (typeof document === "undefined") {
      return;
    }

    const dark =
      isDarkTheme(
        nextTheme
      );

    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    document.documentElement.classList.toggle(
      "modern",
      nextTheme === "modern"
    );

    document.documentElement.dataset.theme =
      nextTheme;

    document.documentElement.dataset.accent =
      nextAccent;

    const colors =
      accentColors[nextAccent];

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
      "--app-accent-text",
      colors.text
    );

    document.documentElement.style.setProperty(
      "--app-accent-border",
      colors.border
    );
  }

  const colors =
    accentColors[accentColor];

  return (
    <>
      <style>
        {`
          :root {
            --app-accent: ${colors.primary};
            --app-accent-hover: ${colors.primaryHover};
            --app-accent-soft: ${colors.soft};
            --app-accent-text: ${colors.text};
            --app-accent-border: ${colors.border};
          }

          html,
          html.modern,
          html[data-theme="modern"] {
            background: #f4f4f5;
            color-scheme: light;
          }

          html body,
          html.modern body,
          html[data-theme="modern"] body {
            background: #f4f4f5;
            color: #18181b;
          }

          html[data-theme="modern"] .app-sidebar,
          html[data-theme="modern"] .app-topbar {
            background-color: #09090b !important;
            color: #ffffff !important;
            border-color: #27272a !important;
          }

          html[data-theme="modern"] .app-sidebar .bg-zinc-900,
          html[data-theme="modern"] .app-topbar .bg-zinc-900 {
            background-color: #18181b !important;
          }

          html[data-theme="modern"] .app-sidebar .border-zinc-800,
          html[data-theme="modern"] .app-topbar .border-zinc-800 {
            border-color: #27272a !important;
          }

          html[data-theme="modern"] .app-sidebar .text-zinc-300,
          html[data-theme="modern"] .app-topbar .text-zinc-300 {
            color: #d4d4d8 !important;
          }

          html[data-theme="modern"] .app-sidebar .text-zinc-400,
          html[data-theme="modern"] .app-topbar .text-zinc-400 {
            color: #a1a1aa !important;
          }

          html[data-theme="modern"] .app-sidebar .text-zinc-500,
          html[data-theme="modern"] .app-topbar .text-zinc-500 {
            color: #a1a1aa !important;
          }

          html[data-theme="modern"] .app-sidebar .text-zinc-900,
          html[data-theme="modern"] .app-topbar .text-zinc-900 {
            color: #ffffff !important;
          }

          html[data-theme="modern"] .app-sidebar .hover\\:bg-zinc-900:hover,
          html[data-theme="modern"] .app-topbar .hover\\:bg-zinc-900:hover {
            background-color: #18181b !important;
          }

          html[data-theme="modern"] .app-sidebar .hover\\:bg-zinc-800:hover,
          html[data-theme="modern"] .app-topbar .hover\\:bg-zinc-800:hover {
            background-color: #27272a !important;
          }

          html[data-theme="modern"] .app-content {
            background: #f4f4f5;
          }

          html.dark {
            background: #09090b;
            color-scheme: dark;
          }

          html.dark body {
            background: #09090b;
            color: #f4f4f5;
          }

          html.dark .bg-zinc-50 {
            background-color: #18181b !important;
          }

          html.dark .bg-zinc-100 {
            background-color: #27272a !important;
          }

          html.dark .bg-white {
            background-color: #18181b !important;
          }

          html.dark .border-zinc-100,
          html.dark .border-zinc-200 {
            border-color: #3f3f46 !important;
          }

          html.dark .text-zinc-400 {
            color: #a1a1aa !important;
          }

          html.dark .text-zinc-500 {
            color: #a1a1aa !important;
          }

          html.dark .text-zinc-600 {
            color: #d4d4d8 !important;
          }

          html.dark .text-zinc-700,
          html.dark .text-zinc-800,
          html.dark .text-zinc-900 {
            color: #f4f4f5 !important;
          }

          html.dark input,
          html.dark textarea,
          html.dark select {
            background-color: #18181b !important;
            color: #f4f4f5 !important;
            border-color: #3f3f46 !important;
          }

          html.dark input::placeholder,
          html.dark textarea::placeholder {
            color: #71717a !important;
          }

          html.dark .shadow-sm {
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.4) !important;
          }

          html.dark .hover\\:bg-zinc-50:hover,
          html.dark .hover\\:bg-zinc-100:hover {
            background-color: #27272a !important;
          }

          html.dark .bg-indigo-50 {
            background-color: rgba(79, 70, 229, 0.18) !important;
          }

          html.dark .text-indigo-600,
          html.dark .text-indigo-700,
          html.dark .text-indigo-900 {
            color: #a5b4fc !important;
          }

          html.dark .bg-blue-50,
          html.dark .bg-blue-100 {
            background-color: rgba(37, 99, 235, 0.18) !important;
          }

          html.dark .text-blue-700 {
            color: #93c5fd !important;
          }

          html.dark .bg-purple-50,
          html.dark .bg-purple-100 {
            background-color: rgba(124, 58, 237, 0.18) !important;
          }

          html.dark .text-purple-700 {
            color: #c4b5fd !important;
          }

          html.dark .bg-green-50,
          html.dark .bg-green-100 {
            background-color: rgba(5, 150, 105, 0.18) !important;
          }

          html.dark .text-green-700 {
            color: #86efac !important;
          }

          html.dark .bg-yellow-100 {
            background-color: rgba(202, 138, 4, 0.18) !important;
          }

          html.dark .text-yellow-700 {
            color: #fde68a !important;
          }

          html.dark .bg-orange-100 {
            background-color: rgba(234, 88, 12, 0.18) !important;
          }

          html.dark .text-orange-700 {
            color: #fdba74 !important;
          }

          html.dark .bg-red-50,
          html.dark .bg-red-100 {
            background-color: rgba(220, 38, 38, 0.18) !important;
          }

          html.dark .text-red-700,
          html.dark .text-red-800 {
            color: #fca5a5 !important;
          }

          html.dark .border-red-200 {
            border-color: rgba(248, 113, 113, 0.35) !important;
          }

          html.dark .bg-red-600 {
            background-color: #dc2626 !important;
          }

          html[data-accent="indigo"] .bg-indigo-600,
          html[data-accent="blue"] .bg-indigo-600,
          html[data-accent="emerald"] .bg-indigo-600,
          html[data-accent="violet"] .bg-indigo-600,
          html[data-accent="rose"] .bg-indigo-600,
          html[data-accent="zinc"] .bg-indigo-600 {
            background-color: var(--app-accent) !important;
          }

          html[data-accent="indigo"] .hover\\:bg-indigo-500:hover,
          html[data-accent="blue"] .hover\\:bg-indigo-500:hover,
          html[data-accent="emerald"] .hover\\:bg-indigo-500:hover,
          html[data-accent="violet"] .hover\\:bg-indigo-500:hover,
          html[data-accent="rose"] .hover\\:bg-indigo-500:hover,
          html[data-accent="zinc"] .hover\\:bg-indigo-500:hover {
            background-color: var(--app-accent-hover) !important;
          }

          html[data-accent="indigo"] .bg-indigo-50,
          html[data-accent="blue"] .bg-indigo-50,
          html[data-accent="emerald"] .bg-indigo-50,
          html[data-accent="violet"] .bg-indigo-50,
          html[data-accent="rose"] .bg-indigo-50,
          html[data-accent="zinc"] .bg-indigo-50 {
            background-color: var(--app-accent-soft) !important;
          }

          html[data-accent="indigo"] .text-indigo-600,
          html[data-accent="indigo"] .text-indigo-700,
          html[data-accent="indigo"] .text-indigo-900,
          html[data-accent="blue"] .text-indigo-600,
          html[data-accent="blue"] .text-indigo-700,
          html[data-accent="blue"] .text-indigo-900,
          html[data-accent="emerald"] .text-indigo-600,
          html[data-accent="emerald"] .text-indigo-700,
          html[data-accent="emerald"] .text-indigo-900,
          html[data-accent="violet"] .text-indigo-600,
          html[data-accent="violet"] .text-indigo-700,
          html[data-accent="violet"] .text-indigo-900,
          html[data-accent="rose"] .text-indigo-600,
          html[data-accent="rose"] .text-indigo-700,
          html[data-accent="rose"] .text-indigo-900,
          html[data-accent="zinc"] .text-indigo-600,
          html[data-accent="zinc"] .text-indigo-700,
          html[data-accent="zinc"] .text-indigo-900 {
            color: var(--app-accent-text) !important;
          }

          html.dark[data-accent="indigo"] .text-indigo-600,
          html.dark[data-accent="indigo"] .text-indigo-700,
          html.dark[data-accent="indigo"] .text-indigo-900,
          html.dark[data-accent="blue"] .text-indigo-600,
          html.dark[data-accent="blue"] .text-indigo-700,
          html.dark[data-accent="blue"] .text-indigo-900,
          html.dark[data-accent="emerald"] .text-indigo-600,
          html.dark[data-accent="emerald"] .text-indigo-700,
          html.dark[data-accent="emerald"] .text-indigo-900,
          html.dark[data-accent="violet"] .text-indigo-600,
          html.dark[data-accent="violet"] .text-indigo-700,
          html.dark[data-accent="violet"] .text-indigo-900,
          html.dark[data-accent="rose"] .text-indigo-600,
          html.dark[data-accent="rose"] .text-indigo-700,
          html.dark[data-accent="rose"] .text-indigo-900,
          html.dark[data-accent="zinc"] .text-indigo-600,
          html.dark[data-accent="zinc"] .text-indigo-700,
          html.dark[data-accent="zinc"] .text-indigo-900 {
            color: #c7d2fe !important;
          }
        `}
      </style>

      <div
        data-active-theme={activeTheme}
        data-active-accent={accentColor}
      >
        {children}
      </div>
    </>
  );
}