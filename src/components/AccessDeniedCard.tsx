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
    <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500 opacity-10 blur-3xl" />
      <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative max-w-3xl">
        <div className="h-16 w-16 rounded-3xl bg-orange-50 text-orange-700 flex items-center justify-center text-3xl font-black">
          403
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-orange-600">
          Zugriff verweigert
        </p>

        <h1 className="mt-3 text-3xl md:text-4xl font-black text-zinc-950 tracking-tight">
          {title}
        </h1>

        <p className="mt-4 text-zinc-500 text-lg leading-8 max-w-2xl">
          {description}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/forbidden"
            className="w-full sm:w-auto app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow text-center"
          >
            403-Seite öffnen
          </Link>

          {backHref ? (
            <Link
              href={backHref}
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-5 py-3 rounded-2xl transition font-bold text-center"
            >
              {backLabel}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-5 py-3 rounded-2xl transition font-bold text-center"
            >
              Zum Dashboard
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}