"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getActivities,
} from "../../lib/activityStorage";

export default function ActivityPage() {
  const [mounted, setMounted] =
    useState(false);

  const [activities, setActivities] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  useEffect(() => {
    setMounted(true);

    setActivities(
      getActivities()
    );
  }, []);

  if (!mounted) {
    return null;
  }

  function getActivityLabel(
    type: string
  ) {
    if (type === "created") {
      return "Dokument erstellt";
    }

    if (type === "edited") {
      return "Dokument bearbeitet";
    }

    if (type === "deleted") {
      return "Dokument in Papierkorb verschoben";
    }

    if (type === "deletedForever") {
      return "Dokument endgültig gelöscht";
    }

    if (type === "restored") {
      return "Dokument oder Version wiederhergestellt";
    }

    if (type === "uploaded") {
      return "Datei hochgeladen";
    }

    if (type === "commented") {
      return "Kommentar hinzugefügt";
    }

    if (type === "commentDeleted") {
      return "Kommentar gelöscht";
    }

    return "Aktivität";
  }

  function getActivityIcon(
    type: string
  ) {
    if (type === "created") {
      return "📝";
    }

    if (type === "edited") {
      return "✏️";
    }

    if (type === "deleted") {
      return "🗑️";
    }

    if (type === "deletedForever") {
      return "❌";
    }

    if (type === "restored") {
      return "♻️";
    }

    if (type === "uploaded") {
      return "📎";
    }

    if (type === "commented") {
      return "💬";
    }

    if (type === "commentDeleted") {
      return "🧹";
    }

    return "📌";
  }

  const activityTypes = [
    ...new Set(
      activities.map(
        (activity: any) =>
          activity.type
      )
    ),
  ];

  const filteredActivities =
    activities.filter(
      (activity: any) => {
        const query =
          search.toLowerCase();

        const matchesSearch =
          activity.title
            ?.toLowerCase()
            .includes(query) ||
          activity.user
            ?.toLowerCase()
            .includes(query) ||
          getActivityLabel(
            activity.type
          )
            .toLowerCase()
            .includes(query);

        const matchesType =
          !typeFilter ||
          activity.type ===
            typeFilter;

        return (
          matchesSearch &&
          matchesType
        );
      }
    );

  function resetFilters() {
    setSearch("");

    setTypeFilter("");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* TOP NAV */}
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

        <span className="text-zinc-900">
          aktivitäten
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Aktivitäten
        </h1>

        <p className="text-zinc-500 mt-2">
          Verlauf aller Änderungen, Kommentare, Uploads und Löschaktionen
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Aktivitäten gesamt
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {activities.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Aktivitätstypen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {activityTypes.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Gefiltert
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {filteredActivities.length}
          </h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Suche & Filter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            type="text"
            placeholder="Nach Benutzer, Titel oder Aktion suchen..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="md:col-span-2 w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Typen
            </option>

            {activityTypes.map(
              (type: string) => (
                <option
                  key={type}
                  value={type}
                >
                  {getActivityLabel(
                    type
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredActivities.length} von{" "}
            {activities.length} Aktivitäten gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Verlauf
        </h2>

        <div className="mt-6 space-y-4">
          {filteredActivities.length ===
            0 && (
            <p className="text-zinc-500">
              Keine Aktivitäten gefunden.
            </p>
          )}

          {filteredActivities.map(
            (
              activity: any,
              index: number
            ) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
                    {getActivityIcon(
                      activity.type
                    )}
                  </div>

                  <div>
                    <p className="font-medium">
                      {activity.user}
                    </p>

                    <p className="text-zinc-500 text-sm mt-1">
                      {getActivityLabel(
                        activity.type
                      )}
                    </p>

                    <p className="mt-2 font-medium">
                      {activity.title}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 whitespace-nowrap">
                  {activity.createdAt}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}