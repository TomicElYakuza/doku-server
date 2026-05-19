"use client";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type AppIdentityProps = {
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showCompanyName?: boolean;
};

export default function AppIdentity({
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  showCompanyName = true,
}: AppIdentityProps) {
  const {
    mounted,
    appName,
    companyName,
  } = useAppSettings();

  if (!mounted) {
    return null;
  }

  return (
    <div className={className}>
      <p className={titleClassName}>
        {appName}
      </p>

      {showCompanyName && (
        <p className={subtitleClassName}>
          {companyName}
        </p>
      )}
    </div>
  );
}