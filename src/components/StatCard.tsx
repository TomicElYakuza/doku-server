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

  return "hover:bg-indigo-50/40";
}

function getIconClass(tone: StatCardProps["tone"]) {
  if (tone === "green") {
    return "bg-green-50 text-green-700";
  }

  if (tone === "blue") {
    return "bg-blue-50 text-blue-700";
  }

  if (tone === "red") {
    return "bg-red-50 text-red-700";
  }

  if (tone === "orange") {
    return "bg-orange-50 text-orange-700";
  }

  if (tone === "purple") {
    return "bg-purple-50 text-purple-700";
  }

  if (tone === "indigo") {
    return "bg-indigo-50 text-indigo-700";
  }

  return "app-accent-soft app-accent-text";
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
  const className = `group relative overflow-hidden w-full bg-white border rounded-3xl p-6 shadow-sm text-left transition ${
    active
      ? "app-accent-border ring-4 ring-indigo-500/10"
      : "border-zinc-200 hover:border-indigo-200"
  } ${getHoverClass(tone)}`;

  const content = (
    <>
      {active && (
        <div className="absolute inset-x-0 top-0 h-1 app-accent-bg" />
      )}

      <div className="relative flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {label}
          </p>

          <h2 className="text-3xl font-black tracking-tight mt-2 text-zinc-950">
            {value}
          </h2>

          {description && (
            <p className="text-sm text-zinc-500 mt-3">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconClass(
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
    <div className={className}>
      {content}
    </div>
  );
}