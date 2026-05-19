"use client";

import Link from "next/link";

type AccessDeniedCardProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function AccessDeniedCard({
  title = "Kein Zugriff",
  description = "Du hast mit deiner aktuellen Rolle keine Berechtigung für diesen Bereich.",
  backHref,
  backLabel = "Zurück",
}: AccessDeniedCardProps) {
  return (
    <div className="space-y-8">
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

      <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-6">
          🔒
        </div>

        <h1 className="text-4xl font-bold">
          {title}
        </h1>

        <p className="text-zinc-500 mt-3 max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}