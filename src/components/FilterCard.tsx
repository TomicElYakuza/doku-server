"use client";

import type {
  ReactNode,
} from "react";

type ViewMode =
  | "cards"
  | "table";

type FilterCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  resultText?: string;
  onReset?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (viewMode: ViewMode) => void;
};

export default function FilterCard({
  title = "Suche & Filter",
  description,
  children,
  resultText,
  onReset,
  viewMode,
  onViewModeChange,
}: FilterCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          {description && (
            <p className="text-zinc-500 mt-1">
              {description}
            </p>
          )}
        </div>

        {viewMode && onViewModeChange && (
          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() =>
                onViewModeChange(
                  "cards"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={() =>
                onViewModeChange(
                  "table"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        )}
      </div>

      <div className="mt-5">
        {children}
      </div>

      {(resultText || onReset) && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          {resultText ? (
            <p className="text-sm text-zinc-500">
              {resultText}
            </p>
          ) : (
            <div />
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
}