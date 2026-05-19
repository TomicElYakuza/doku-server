"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getAppSettings,
  getDefaultAppSettings,
} from "../lib/appSettingsStorage";

import type {
  AppSettings,
} from "../lib/appSettingsStorage";

export function useAppSettings() {
  const [mounted, setMounted] =
    useState(false);

  const [settings, setSettings] =
    useState<AppSettings>(() =>
      getDefaultAppSettings()
    );

  useEffect(() => {
    setMounted(true);

    setSettings(
      getAppSettings()
    );

    function handleSettingsUpdated() {
      setSettings(
        getAppSettings()
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

  return {
    mounted,

    settings,

    appName:
      settings.appName,

    companyName:
      settings.companyName,

    appVersion:
      settings.appVersion ||
      settings.version,

    version:
      settings.version ||
      settings.appVersion,

    theme:
      settings.theme,

    darkMode:
      settings.darkMode,

    appAccentColor:
      settings.appAccentColor ||
      settings.accentColor,

    accentColor:
      settings.accentColor ||
      settings.appAccentColor,

    sidebarPosition:
      settings.sidebarPosition,

    showVersion:
      settings.showVersion,

    compactMode:
      settings.compactMode,

    showDemoHints:
      settings.showDemoHints,

    enableTicketTemplates:
      settings.enableTicketTemplates,

    enableTicketComments:
      settings.enableTicketComments,

    enableActivityLog:
      settings.enableActivityLog,

    defaultUserRole:
      settings.defaultUserRole,
  };
}