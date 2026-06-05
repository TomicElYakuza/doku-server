"use client";

import {
  ReactNode,
} from "react";
import {
  useFeatureFlags,
} from "../hooks/useFeatureFlags";
import FeatureDisabledCard from "./FeatureDisabledCard";

type FeatureGateName =
  | "ticketComments"
  | "ticketTemplates"
  | "activityLog";

type FeatureGateProps = {
  feature: FeatureGateName;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const {
    loading,
    ticketCommentsEnabled,
    ticketTemplatesEnabled,
    activityLogEnabled,
  } = useFeatureFlags();

  if (loading) {
    return null;
  }

  const enabled =
    feature === "ticketComments"
      ? ticketCommentsEnabled
      : feature === "ticketTemplates"
        ? ticketTemplatesEnabled
        : feature === "activityLog"
          ? activityLogEnabled
          : true;

  if (!enabled) {
    return (
      <>
        {fallback || (
          <FeatureDisabledCard />
        )}
      </>
    );
  }

  return (
    <>
      {children}
    </>
  );
}