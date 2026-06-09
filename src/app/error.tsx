"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-3xl bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden relative">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500 opacity-10 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative p-8 md:p-12 text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-red-50 text-red-700 flex items-center justify-center text-4xl font-black">
            !
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-red-600">
            Fehler
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Etwas ist schiefgelaufen.
          </h1>

          <p className="mt-5 text-zinc-500 text-lg leading-8 max-w-2xl mx-auto">
            Die Seite konnte gerade nicht korrekt geladen werden. Du kannst es
            erneut versuchen oder zurück zum Dashboard wechseln.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="w-full sm:w-auto app-accent-bg text-white px-6 py-4 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut versuchen
            </button>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-4 rounded-2xl transition font-bold text-center"
            >
              Zum Dashboard
            </Link>
          </div>

          {(error.message || error.digest) && (
            <div className="mt-8 bg-zinc-50 border border-zinc-100 rounded-3xl p-5 text-left">
              <p className="font-black text-zinc-950">Technische Information</p>

              {error.message && (
                <p className="text-zinc-500 mt-2 break-words">
                  {error.message}
                </p>
              )}

              {error.digest && (
                <p className="text-xs text-zinc-400 mt-3 break-all">
                  Fehler-ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}