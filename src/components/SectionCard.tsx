"use client";

import type {
  ReactNode,
} from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  description,
  children,
  actions,
  className = "",
}: SectionCardProps) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm ${className}`}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold">
                {title}
              </h2>
            )}

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
      )}

      {children}
    </div>
  );
}