"use client";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

type ActionBarItemVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

export type ActionBarItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: ActionBarItemVariant;
  disabled?: boolean;
};

type ActionBarProps = {
  items: ActionBarItem[];
  align?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
};

function getVariantClass(
  variant: ActionBarItemVariant
) {
  if (variant === "primary") {
    return "bg-zinc-900 text-white hover:bg-zinc-700";
  }

  if (variant === "danger") {
    return "bg-red-600 text-white hover:bg-red-500";
  }

  if (variant === "ghost") {
    return "bg-transparent text-zinc-600 hover:bg-zinc-100";
  }

  return "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100";
}

function getSizeClass(
  size: "sm" | "md"
) {
  if (size === "sm") {
    return "px-3 py-2 rounded-xl text-sm";
  }

  return "px-4 py-2 rounded-xl text-sm";
}

export default function ActionBar({
  items,
  align = "right",
  size = "md",
  className = "",
}: ActionBarProps) {
  if (items.length === 0) {
    return null;
  }

  const wrapperClass =
    `flex flex-wrap gap-2 ${
      align === "right"
        ? "justify-end"
        : "justify-start"
    } ${className}`;

  return (
    <div className={wrapperClass}>
      {items.map(
        (item) => {
          const variant =
            item.variant ||
            "secondary";

          const classes =
            `inline-flex items-center justify-center gap-2 transition ${getSizeClass(
              size
            )} ${getVariantClass(
              variant
            )} ${
              item.disabled
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : ""
            }`;

          const content = (
            <>
              {item.icon && (
                <span>
                  {item.icon}
                </span>
              )}

              <span>
                {item.label}
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={classes}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              className={classes}
            >
              {content}
            </button>
          );
        }
      )}
    </div>
  );
}