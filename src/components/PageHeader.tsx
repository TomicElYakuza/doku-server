"use client";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  backHref,
  backLabel = "Zurück",
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {breadcrumbs.map(
            (item, index) => {
              const isLast =
                index === breadcrumbs.length - 1;

              return (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-3"
                >
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="text-zinc-500 hover:text-zinc-900 transition"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-zinc-900">
                      {item.label}
                    </span>
                  )}

                  {!isLast && (
                    <span className="text-zinc-400">
                      /
                    </span>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← {backLabel}
          </Link>
        </div>
      )}

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            {title}
          </h1>

          {description && (
            <p className="text-zinc-500 mt-2">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}