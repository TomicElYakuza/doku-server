"use client";

import Link from "next/link";

import {
  canViewAdmin,
} from "../../../lib/permissions";

import {
  getDatabaseReadinessItems,
  getDatabaseReadinessProgress,
} from "../../../lib/databaseReadiness";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

function getStatusClass(
  done: boolean
) {
  if (done) {
    return "bg-green-50 text-green-700";
  }

  return "bg-amber-50 text-amber-700";
}

function getStatusLabel(
  done: boolean
) {
  if (done) {
    return "Erledigt";
  }

  return "Offen";
}

export default function AdminDatabasePage() {
  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        backHref="/admin"
        backLabel="Zurück zum Admin-Dashboard"
        description="Du hast mit deiner aktuellen Rolle keine Berechtigung für die Datenbank-Übersicht."
      />
    );
  }

  const items =
    getDatabaseReadinessItems();

  const progress =
    getDatabaseReadinessProgress();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <Link
          href="/admin"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          admin
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          datenbank
        </span>
      </div>

      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Datenbank-Readiness
          </h1>

          <p className="text-zinc-500 mt-2">
            Übersicht, wie weit die App für spätere API- und Datenbank-Anbindung vorbereitet ist
          </p>
        </div>

        <Link
          href="/admin/adapters"
          className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Adapter öffnen
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Fortschritt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {progress.percentage}%
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            DB-ready Vorbereitung
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Erledigt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {progress.done}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            vorbereitete Punkte
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Offen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {progress.open}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            echte DB-Schritte
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {progress.total}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Prüfpunkte
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Checkliste
            </h2>

            <p className="text-zinc-500 mt-2">
              Diese Punkte zeigen, was bereits vorbereitet ist und was später bei echter DB-Anbindung noch gebaut werden muss.
            </p>
          </div>

          <div className="w-40 h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full"
              style={{
                width:
                  `${progress.percentage}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {items.map(
            (item) => (
              <div
                key={item.title}
                className="border border-zinc-200 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-semibold">
                      {item.title}
                    </h3>

                    <p className="text-sm text-zinc-500 mt-2">
                      {item.description}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full shrink-0 ${getStatusClass(
                      item.done
                    )}`}
                  >
                    {getStatusLabel(
                      item.done
                    )}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Abschluss für den aktuellen Stand
        </h2>

        <p className="text-zinc-500 mt-2 leading-relaxed">
          Die App bleibt aktuell vollständig im LocalStorage-Modus lauffähig.
          Die Datenstruktur ist aber so vorbereitet, dass später API-Routen und eine echte Datenbank schrittweise ergänzt werden können.
          Der nächste echte DB-Schritt wäre dann: Datenbank-Technologie wählen, Schema definieren, API-Routen bauen und danach die Adapter von LocalStorage auf API/DB umstellen.
        </p>
      </div>
    </div>
  );
}