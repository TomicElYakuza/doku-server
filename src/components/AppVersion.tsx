"use client";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type AppVersionProps = {
  className?: string;
  prefix?: string;
};

export default function AppVersion({
  className = "",
  prefix = "Version",
}: AppVersionProps) {
  const {
    settings,
    loading,
  } =
    useAppSettings();

  const version =
    settings.appVersion ||
    settings.version ||
    "0.1.0";

  if (loading) {
    return null;
  }

  if (!settings.showVersion) {
    return null;
  }

  return (
    <span className={className}>
      {prefix} {version}
    </span>
  );
}