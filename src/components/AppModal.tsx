"use client";

import {
  ReactNode,
  useEffect,
  useId,
} from "react";

type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "5xl" | "6xl";
  onClose: () => void;
};

function getMaxWidthClass(
  maxWidth: AppModalProps["maxWidth"]
) {
  if (maxWidth === "md") {
    return "max-w-md";
  }

  if (maxWidth === "lg") {
    return "max-w-lg";
  }

  if (maxWidth === "xl") {
    return "max-w-xl";
  }

  if (maxWidth === "2xl") {
    return "max-w-2xl";
  }

  if (maxWidth === "3xl") {
    return "max-w-3xl";
  }

  if (maxWidth === "5xl") {
    return "max-w-5xl";
  }

  if (maxWidth === "6xl") {
    return "max-w-6xl";
  }

  return "max-w-3xl";
}

export default function AppModal({
  open,
  title,
  description,
  children,
  footer,
  maxWidth = "3xl",
  onClose,
}: AppModalProps) {
  const titleId =
    useId();

  const descriptionId =
    useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5"
    >
      <button
        type="button"
        aria-label="Modal schließen"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm"
      />

      <div className={`relative flex w-full ${getMaxWidthClass(maxWidth)} max-h-[92vh] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-zinc-200`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zinc-50 to-transparent" />

        <div className="relative flex items-start justify-between gap-5 border-b border-zinc-200 px-5 py-5 sm:px-7 sm:py-6 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
                ✦
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Formular
                </p>

                <h2
                  id={titleId}
                  className="text-2xl font-bold text-zinc-950 truncate"
                >
                  {title}
                </h2>
              </div>
            </div>

            {description && (
              <p
                id={descriptionId}
                className="text-zinc-500 mt-3 max-w-3xl"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-700 hover:bg-zinc-200 transition"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/90 px-5 py-4 sm:px-7 sm:py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}