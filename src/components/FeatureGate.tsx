"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  areDemoHintsEnabled,
  areTicketCommentsEnabled,
  areTicketTemplatesEnabled,
  isActivityLogEnabled,
} from "../lib/featureFlags";

type FeatureKey =
  | "demoHints"
  | "ticketTemplates"
  | "ticketComments"
  | "activityLog";

type FeatureGateProps = {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
};

function isFeatureEnabled(
  feature: FeatureKey
) {
  if (feature === "demoHints") {
    return areDemoHintsEnabled();
  }

  if (feature === "ticketTemplates") {
    return areTicketTemplatesEnabled();
  }

  if (feature === "ticketComments") {
    return areTicketCommentsEnabled();
  }

  if (feature === "activityLog") {
    return isActivityLogEnabled();
  }

  return true;
}

export default function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const [mounted, setMounted] =
    useState(false);

  const [enabled, setEnabled] =
    useState(true);

  useEffect(() => {
    setMounted(true);

    setEnabled(
      isFeatureEnabled(
        feature
      )
    );

    function handleSettingsUpdated() {
      setEnabled(
        isFeatureEnabled(
          feature
        )
      );
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
  }, [feature]);

  if (!mounted) {
    return null;
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}