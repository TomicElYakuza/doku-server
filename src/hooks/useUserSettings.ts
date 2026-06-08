"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  userSettingsRepository,
} from "../lib/userSettingsRepository";

import type {
  UserSettings,
  UserSettingsUpdateInput,
} from "../types/userSettings";

const USER_SETTINGS_UPDATED_EVENT =
  "userSettingsUpdated";

let cachedUserSettings:
  UserSettings =
    userSettingsRepository.getDefault();

let hasLoadedUserSettings =
  false;

export function getCachedUserSettings() {
  return cachedUserSettings;
}

export function dispatchUserSettingsUpdated() {
  window.dispatchEvent(
    new CustomEvent(
      USER_SETTINGS_UPDATED_EVENT,
      {
        detail:
          cachedUserSettings,
      }
    )
  );
}

export function useUserSettings() {
  const [settings, setSettings] =
    useState<UserSettings>(
      cachedUserSettings
    );

  const [loading, setLoading] =
    useState(
      !hasLoadedUserSettings
    );

  const [error, setError] =
    useState("");

  const loadSettings =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const nextSettings =
            await userSettingsRepository.get();

          cachedUserSettings =
            nextSettings;

          hasLoadedUserSettings =
            true;

          setSettings(
            nextSettings
          );

          dispatchUserSettingsUpdated();

          return nextSettings;
        } catch (loadError) {
          console.error(
            loadError
          );

          const message =
            loadError instanceof Error
              ? loadError.message
              : "Benutzereinstellungen konnten nicht geladen werden.";

          setError(
            message
          );

          return cachedUserSettings;
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  const updateSettings =
    useCallback(
      async (
        input: UserSettingsUpdateInput
      ) => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const nextSettings =
            await userSettingsRepository.update(
              input
            );

          cachedUserSettings =
            nextSettings;

          hasLoadedUserSettings =
            true;

          setSettings(
            nextSettings
          );

          dispatchUserSettingsUpdated();

          return nextSettings;
        } catch (updateError) {
          console.error(
            updateError
          );

          const message =
            updateError instanceof Error
              ? updateError.message
              : "Benutzereinstellungen konnten nicht gespeichert werden.";

          setError(
            message
          );

          throw updateError;
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    if (!hasLoadedUserSettings) {
      void loadSettings();
    }

    function handleUserSettingsUpdated(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<UserSettings>;

      if (customEvent.detail) {
        setSettings(
          customEvent.detail
        );
      } else {
        setSettings(
          cachedUserSettings
        );
      }
    }

    window.addEventListener(
      USER_SETTINGS_UPDATED_EVENT,
      handleUserSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        USER_SETTINGS_UPDATED_EVENT,
        handleUserSettingsUpdated
      );
    };
  }, [
    loadSettings,
  ]);

  return {
    settings,
    loading,
    error,
    reload:
      loadSettings,
    updateSettings,
  };
}
