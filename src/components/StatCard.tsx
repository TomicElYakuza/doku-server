"use client";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export default function StatCard({
  label,
  value,
  description,
  icon,
  href,
  onClick,
  className = "",
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-zinc-500">
            {label}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>

          {description && (
            <p className="text-sm text-zinc-500 mt-2">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl shrink-0">
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const baseClassName =
    `bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left transition ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClassName} hover:bg-zinc-50`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClassName} hover:bg-zinc-50`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseClassName}>
      {content}
    </div>
  );
}