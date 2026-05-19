"use client";

import Link from "next/link";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type AppButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type AppButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: AppButtonVariant;
    href?: string;
    className?: string;
  };

function getVariantClass(
  variant: AppButtonVariant
) {
  if (variant === "primary") {
    return "bg-zinc-900 text-white hover:bg-zinc-700";
  }

  if (variant === "secondary") {
    return "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100";
  }

  if (variant === "danger") {
    return "bg-red-600 text-white hover:bg-red-500";
  }

  if (variant === "ghost") {
    return "bg-transparent text-zinc-600 hover:bg-zinc-100";
  }

  return "bg-zinc-900 text-white hover:bg-zinc-700";
}

export default function AppButton({
  children,
  variant = "primary",
  href,
  className = "",
  type = "button",
  disabled,
  ...props
}: AppButtonProps) {
  const classes =
    `inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${getVariantClass(
      variant
    )} ${
      disabled
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : ""
    } ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}