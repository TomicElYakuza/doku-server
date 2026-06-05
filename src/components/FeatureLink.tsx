"use client";

import Link from "next/link";
import type {
  ReactNode,
} from "react";
import FeatureGate from "./FeatureGate";

type FeatureKey =
  | "ticketTemplates"
  | "ticketComments"
  | "activityLog";

type FeatureLinkProps = {
  feature: FeatureKey;
  href: string;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
};

export default function FeatureLink({
  feature,
  href,
  children,
  className = "",
  fallback = null,
}: FeatureLinkProps) {
  return (
    <FeatureGate
      feature={feature}
      fallback={fallback}
    >
      <Link
        href={href}
        className={className}
      >
        {children}
      </Link>
    </FeatureGate>
  );
}