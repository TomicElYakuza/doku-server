"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFeatureFlags,
} from "../lib/featureFlags";

export type FeatureFlags = ReturnType<
  typeof getFeatureFlags
>;

export function useFeatureFlags() {
  const [mounted, setMounted] =
    useState(false);

  const [flags, setFlags] =
    useState<FeatureFlags>(() => ({
      showDemoHints:
        true,

      enableTicketTemplates:
        true,

      enableTicketComments:
        true,

      enableActivityLog:
        true,

      defaultUserRole:
        "viewer",
    }));

  useEffect(() => {
    setMounted(true);

    setFlags(
      getFeatureFlags()
    );

    function handleSettingsUpdated() {
      setFlags(
        getFeatureFlags()
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
    flags,

    showDemoHints:
      flags.showDemoHints,

    enableTicketTemplates:
      flags.enableTicketTemplates,

    enableTicketComments:
      flags.enableTicketComments,

    enableActivityLog:
      flags.enableActivityLog,

    defaultUserRole:
      flags.defaultUserRole,
  };
}