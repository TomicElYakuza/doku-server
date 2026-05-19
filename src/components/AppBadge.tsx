"use client";

import type {
  ReactNode,
} from "react";

type AppBadgeVariant =
  | "default"
  | "green"
  | "blue"
  | "indigo"
  | "red"
  | "orange"
  | "amber"
  | "emerald"
  | "zinc";

type AppBadgeProps = {
  children: ReactNode;
  variant?: AppBadgeVariant;
  className?: string;
};

function getVariantClass(
  variant: AppBadgeVariant
) {
  if (variant === "green") {
    return "bg-green-50 text-green-700";
  }

  if (variant === "blue") {
    return "bg-blue-50 text-blue-700";
  }

  if (variant === "indigo") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (variant === "red") {
    return "bg-red-50 text-red-700";
  }

  if (variant === "orange") {
    return "bg-orange-50 text-orange-700";
  }

  if (variant === "amber") {
    return "bg-amber-50 text-amber-700";
  }

  if (variant === "emerald") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (variant === "zinc") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function AppBadge({
  children,
  variant = "default",
  className = "",
}: AppBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getVariantClass(
        variant
      )} ${className}`}
    >
      {children}
    </span>
  );
}