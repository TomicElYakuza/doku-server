"use client";

type LoadingStateProps = {
  title?: string;
  description?: string;
};

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function LoadingState({
  title = "Daten werden geladen",
  description = "Bitte kurz warten...",
}: LoadingStateProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-zinc-400 border-t-zinc-900 animate-spin" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <p className="text-zinc-500 mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Fehler beim Laden",
  description = "Die Daten konnten nicht geladen werden.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-xl shrink-0">
          !
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <p className="text-zinc-500 mt-2">
            {description}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Erneut versuchen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "Keine Daten vorhanden",
  description = "Es wurden keine passenden Einträge gefunden.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl shrink-0">
          ∅
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <p className="text-zinc-500 mt-2">
            {description}
          </p>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="mt-5 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DataState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  onRetry?: () => void;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        description={error}
        onRetry={onRetry}
      />
    );
  }

  if (empty) {
    return <EmptyState />;
  }

  return null;
}