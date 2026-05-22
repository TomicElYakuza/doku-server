"use client";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type AppIdentityProps = {
  compact?: boolean;
  className?: string;
};

export default function AppIdentity({
  compact = false,
  className = "",
}: AppIdentityProps) {
  const {
    settings,
    loading,
  } =
    useAppSettings();

  const appName =
    settings.appName ||
    "Intranet";

  const companyName =
    settings.companyName ||
    "Intern";

  const version =
    settings.appVersion ||
    settings.version ||
    "0.1.0";

  if (loading) {
    return (
      <div className={className}>
        <p className="text-sm text-zinc-400">
          Anwendung wird geladen...
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={className}>
        <p className="font-bold">
          {appName}
        </p>

        <p className="text-xs text-zinc-500">
          {companyName}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm text-zinc-500">
        {companyName}
      </p>

      <h1 className="text-2xl font-bold">
        {appName}
      </h1>

      {settings.showVersion && (
        <p className="text-xs text-zinc-400 mt-1">
          Version {version}
        </p>
      )}
    </div>
  );
}