"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  appSettingsRepository,
} from "../lib/appSettingsRepository";

import type {
  AppSettings,
} from "../types/settings";

export function useFeatureFlags() {
  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [loading, setLoading] =
    useState(true);

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
      setLoading(
        true
      );

      const nextSettings =
        await appSettingsRepository.get();

      setSettings(
        nextSettings
      );
    } catch (error) {
      console.error(
        "Feature Flags konnten nicht geladen werden:",
        error
      );

      setSettings(
        appSettingsRepository.getDefault()
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return {
    loading,

    settings,

    demoHintsEnabled:
      settings.showDemoHints,

    ticketCommentsEnabled:
      settings.enableTicketComments,

    ticketTemplatesEnabled:
      settings.enableTicketTemplates,

    activityLogEnabled:
      settings.enableActivityLog,
  };
}