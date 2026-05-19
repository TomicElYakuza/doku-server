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
    mounted,
    appVersion,
    showVersion,
  } = useAppSettings();

  if (!mounted) {
    return null;
  }

  if (!showVersion) {
    return null;
  }

  return (
    <p className={className}>
      {prefix} {appVersion}
    </p>
  );
}