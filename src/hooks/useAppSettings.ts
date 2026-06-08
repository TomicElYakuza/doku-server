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

export function useAppSettings() {
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
        "Einstellungen konnten nicht geladen werden:",
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

  async function updateSettings(
    updates: Partial<AppSettings>
  ) {
    const nextSettings =
      await appSettingsRepository.update(
        updates
      );

    setSettings(
      nextSettings
    );

    return nextSettings;
  }

  async function resetSettings() {
    const nextSettings =
      await appSettingsRepository.reset();

    setSettings(
      nextSettings
    );

    return nextSettings;
  }

  return {
    settings,
    loading,
    reload:
      loadSettings,
    updateSettings,
    resetSettings,
  };
}
