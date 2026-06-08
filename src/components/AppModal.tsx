"use client";

import {
  ReactNode,
  useEffect,
} from "react";

type AppModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: AppModalSize;
  maxWidth?: string;
};

function getSizeClass(size: AppModalSize) {
  if (size === "sm") {
    return "max-w-xl";
  }

  if (size === "md") {
    return "max-w-2xl";
  }

  if (size === "lg") {
    return "max-w-4xl";
  }

  if (size === "2xl") {
    return "max-w-6xl";
  }

  return "max-w-5xl";
}

function getModalWidthClass(
  size: AppModalSize,
  maxWidth?: string,
) {
  if (maxWidth) {
    return maxWidth;
  }

  return getSizeClass(size);
}

export default function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "xl",
  maxWidth,
}: AppModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Modal schließen"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
      />

      <section
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${getModalWidthClass(
          size,
          maxWidth,
        )} max-h-[90vh] overflow-hidden rounded-[2rem] bg-white border border-white/60 shadow-2xl`}
      >
        <div className="relative overflow-hidden app-accent-bg text-white px-6 py-6 md:px-8">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/55 font-black">
                Dialog
              </p>

              <h2 className="text-2xl md:text-3xl font-black tracking-[-0.03em] mt-2">
                {title}
              </h2>

              {description && (
                <p className="text-white/70 mt-2 leading-7">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition flex items-center justify-center text-xl shrink-0"
              aria-label="Schließen"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-190px)] overflow-y-auto px-6 py-6 md:px-8 bg-white">
          {children}
        </div>

        {footer && (
          <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-5 md:px-8">
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-end gap-3">
              {footer}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

