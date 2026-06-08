"use client";

import {
  ReactNode,
} from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  active?: boolean;
  tone?:
    | "default"
    | "green"
    | "blue"
    | "red"
    | "orange"
    | "purple"
    | "indigo";
  onClick?: () => void;
};

function getHoverClass(tone: StatCardProps["tone"]) {
  if (tone === "green") {
    return "hover:bg-green-50";
  }

  if (tone === "blue") {
    return "hover:bg-blue-50";
  }

  if (tone === "red") {
    return "hover:bg-red-50";
  }

  if (tone === "orange") {
    return "hover:bg-orange-50";
  }

  if (tone === "purple") {
    return "hover:bg-purple-50";
  }

  if (tone === "indigo") {
    return "hover:bg-indigo-50";
  }

  return "hover:bg-zinc-50";
}

function getIconClass(tone: StatCardProps["tone"]) {
  if (tone === "green") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (tone === "blue") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (tone === "red") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (tone === "orange") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (tone === "purple") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (tone === "indigo") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "app-accent-soft app-accent-text app-accent-border";
}

export default function StatCard({
  label,
  value,
  description,
  icon,
  active = false,
  tone = "default",
  onClick,
}: StatCardProps) {
  const className = [
    "group relative overflow-hidden w-full bg-white border rounded-3xl p-6 shadow-sm text-left transition app-card-hover",
    active
      ? "app-accent-border ring-4 ring-[var(--app-accent-ring)]"
      : "border-zinc-200",
    getHoverClass(tone),
    onClick ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="absolute inset-x-0 top-0 h-1 app-accent-bg" />
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-500">
            {label}
          </p>

          <h2 className="text-3xl font-black tracking-[-0.05em] mt-2 truncate">
            {value}
          </h2>

          {description && (
            <p className="text-sm text-zinc-500 mt-2 leading-6">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`h-12 w-12 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${getIconClass(
              tone,
            )}`}
          >
            {icon}
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={className}>
      {content}
    </article>
  );
}