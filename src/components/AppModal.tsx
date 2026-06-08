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
  size?: "md" | "lg" | "xl" | "2xl" | "3xl" | "5xl" | "6xl";
  onClose: () => void;
};

function getMaxWidthClass(maxWidth: AppModalProps["maxWidth"]) {
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
  maxWidth,
  size,
  onClose,
}: AppModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const resolvedMaxWidth = maxWidth || size || "3xl";

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-zinc-950/55 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onMouseDown={onClose}
    >
      <section
        className={`bg-white w-full ${getMaxWidthClass(
          resolvedMaxWidth,
        )} max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-zinc-200`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="relative overflow-hidden app-accent-bg text-white p-6">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/65">
                Formular
              </p>

              <h2
                id={titleId}
                className="text-2xl xl:text-3xl font-black tracking-[-0.05em] mt-2"
              >
                {title}
              </h2>

              {description && (
                <p
                  id={descriptionId}
                  className="text-white/70 leading-7 mt-2 max-w-3xl"
                >
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition flex items-center justify-center font-black shrink-0"
              aria-label="Modal schließen"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="max-h-[calc(92vh-190px)] sm:max-h-[calc(88vh-210px)] overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <footer className="bg-zinc-50 border-t border-zinc-200 p-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}