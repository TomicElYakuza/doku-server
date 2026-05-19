"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canViewAdmin,
} from "../../../lib/permissions";

import {
  getAllDataAdapterMeta,
  getApiAdapterCount,
  getDatabaseAdapterCount,
  getLocalStorageAdapterCount,
} from "../../../lib/dataAdapterRegistry";

import type {
  DataAdapterMeta,
} from "../../../lib/dataAdapter";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

function getEntityLabel(
  entity: string
) {
  if (entity === "wikiPage") {
    return "Wiki-Seiten";
  }

  if (entity === "ticket") {
    return "Tickets";
  }

  if (entity === "ticketComment") {
    return "Ticket-Kommentare";
  }

  if (entity === "ticketTemplate") {
    return "Ticket-Vorlagen";
  }

  if (entity === "activity") {
    return "Aktivitäten";
  }

  if (entity === "adminUser") {
    return "Admin-Benutzer";
  }

  if (entity === "company") {
    return "Firmen";
  }

  if (entity === "department") {
    return "Abteilungen";
  }

  if (entity === "settings") {
    return "Einstellungen";
  }

  if (entity === "currentUser") {
    return "Aktueller Benutzer";
  }

  return entity;
}

function getModeLabel(
  mode: string
) {
  if (mode === "localStorage") {
    return "LocalStorage";
  }

  if (mode === "api") {
    return "API";
  }

  if (mode === "database") {
    return "Datenbank";
  }

  return mode;
}

function getModeClass(
  mode: string
) {
  if (mode === "localStorage") {
    return "bg-blue-50 text-blue-700";
  }

  if (mode === "api") {
    return "bg-amber-50 text-amber-700";
  }

  if (mode === "database") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getSupportLabel(
  supported: boolean
) {
  return supported
    ? "Ja"
    : "Nein";
}

function getSupportClass(
  supported: boolean
) {
  return supported
    ? "bg-green-50 text-green-700"
    : "bg-zinc-100 text-zinc-500";
}

export default function AdminAdaptersPage() {
  const [mounted, setMounted] =
    useState(false);

  const [adapters, setAdapters] =
    useState<DataAdapterMeta[]>([]);

  const [search, setSearch] =
    useState("");

  const [modeFilter, setModeFilter] =
    useState("");

  useEffect(() => {
    setMounted(true);

    loadData();
  }, []);

  function loadData() {
    setAdapters(
      getAllDataAdapterMeta()
    );
  }

  function resetFilters() {
    setSearch("");

    setModeFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        backHref="/admin"
        backLabel="Zurück zum Admin-Dashboard"
        description="Du hast mit deiner aktuellen Rolle keine Berechtigung für die Adapter-Übersicht."
      />
    );
  }

  const localStorageCount =
    getLocalStorageAdapterCount();

  const apiCount =
    getApiAdapterCount();

  const databaseCount =
    getDatabaseAdapterCount();

  const implementedCount =
    adapters.filter(
      (adapter) =>
        adapter.supportsCreate ||
        adapter.supportsUpdate ||
        adapter.supportsDelete ||
        adapter.supportsSearch
    ).length;

  const filteredAdapters =
    adapters.filter(
      (adapter) => {
        const query =
          search.toLowerCase();

        const matchesSearch =
          getEntityLabel(
            adapter.entity
          )
            .toLowerCase()
            .includes(query) ||
          adapter.entity
            .toLowerCase()
            .includes(query) ||
          adapter.source
            .toLowerCase()
            .includes(query) ||
          getModeLabel(
            adapter.mode
          )
            .toLowerCase()
            .includes(query);

        const matchesMode =
          !modeFilter ||
          adapter.mode === modeFilter;

        return (
          matchesSearch &&
          matchesMode
        );
      }
    );

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
          adapter
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
            Daten-Adapter
          </h1>

          <p className="text-zinc-500 mt-2">
            Übersicht der vorbereiteten Datenschicht für LocalStorage, spätere API und Datenbank
          </p>
        </div>

        <Link
          href="/admin/storage"
          className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Speicher öffnen
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() =>
            setModeFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Adapter gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {adapters.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            {implementedCount} vorbereitet
          </p>
        </button>

        <button
          onClick={() =>
            setModeFilter(
              "localStorage"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            LocalStorage
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {localStorageCount}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Aktuelle Datenquelle
          </p>
        </button>

        <button
          onClick={() =>
            setModeFilter(
              "api"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-amber-50 transition"
        >
          <p className="text-sm text-zinc-500">
            API
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {apiCount}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Platzhalter / später
          </p>
        </button>

        <button
          onClick={() =>
            setModeFilter(
              "database"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-emerald-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Datenbank
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {databaseCount}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Zielarchitektur
          </p>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere Adapter nach Entität, Datenquelle oder Modus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Entität, Quelle oder Modus suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={modeFilter}
            onChange={(event) =>
              setModeFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Modi
            </option>

            <option value="localStorage">
              LocalStorage
            </option>

            <option value="api">
              API
            </option>

            <option value="database">
              Datenbank
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredAdapters.length} von{" "}
            {adapters.length} Adaptern gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Entität
                </th>

                <th className="px-5 py-4 font-semibold">
                  Modus
                </th>

                <th className="px-5 py-4 font-semibold">
                  Quelle
                </th>

                <th className="px-5 py-4 font-semibold">
                  Erstellen
                </th>

                <th className="px-5 py-4 font-semibold">
                  Bearbeiten
                </th>

                <th className="px-5 py-4 font-semibold">
                  Löschen
                </th>

                <th className="px-5 py-4 font-semibold">
                  Suche
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAdapters.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-zinc-500"
                  >
                    Keine Adapter gefunden.
                  </td>
                </tr>
              )}

              {filteredAdapters.map(
                (adapter) => (
                  <tr
                    key={`${adapter.entity}-${adapter.source}`}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {getEntityLabel(
                          adapter.entity
                        )}
                      </p>

                      <p className="text-xs text-zinc-500 mt-1">
                        {adapter.entity}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getModeClass(
                          adapter.mode
                        )}`}
                      >
                        {getModeLabel(
                          adapter.mode
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                      {adapter.source}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getSupportClass(
                          adapter.supportsCreate
                        )}`}
                      >
                        {getSupportLabel(
                          adapter.supportsCreate
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getSupportClass(
                          adapter.supportsUpdate
                        )}`}
                      >
                        {getSupportLabel(
                          adapter.supportsUpdate
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getSupportClass(
                          adapter.supportsDelete
                        )}`}
                      >
                        {getSupportLabel(
                          adapter.supportsDelete
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getSupportClass(
                          adapter.supportsSearch
                        )}`}
                      >
                        {getSupportLabel(
                          adapter.supportsSearch
                        )}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Warum diese Adapter-Schicht?
        </h2>

        <p className="text-zinc-500 mt-2 leading-relaxed">
          Die App arbeitet aktuell noch mit localStorage. Durch die Adapter-Schicht können wir später gezielt einzelne Bereiche auf API oder Datenbank umstellen, ohne jede Seite komplett neu zu schreiben.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Schritt 1
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Bestehende Storage-Logik bleibt stabil.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Schritt 2
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Seiten können später über Adapter statt direkt über Storage laden.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Schritt 3
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Adapter werden dann auf echte API- oder Datenbankfunktionen umgestellt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}