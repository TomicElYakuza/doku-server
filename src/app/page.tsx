"use client";

import { useEffect, useState } from "react";

import {
  getActivities,
} from "../lib/activitiyStorage";

export default function HomePage() {
  const [activities, setActivities] =
    useState<any[]>([]);

  useEffect(() => {
    setActivities(getActivities());
  }, []);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Willkommen zurück
        </h1>

        <p className="text-zinc-500 mt-2">
          Firmen Intranet Übersicht
        </p>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Offene Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            12
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-4xl font-bold mt-3">
            248
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Benutzer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            36
          </h2>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Schnellzugriff
        </h2>

        <div className="flex flex-wrap gap-4 mt-6">
          <a
            href="/wiki"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Wiki öffnen
          </a>

          <a
            href="/wiki/create"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Dokument erstellen
          </a>

          <a
            href="/setup"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzer Setup
          </a>
        </div>
      </div>

      {/* ACTIVITIES */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Letzte Aktivitäten
        </h2>

        <div className="mt-6 space-y-4">
          {activities.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Aktivitäten
            </p>
          )}

          {activities.map(
            (
              activity: any,
              index: number
            ) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-zinc-100 pb-4"
              >
                <div>
                  <p className="font-medium">
                    {activity.user}
                  </p>

                  <p className="text-zinc-500 text-sm mt-1">
                    {activity.type ===
                    "created"
                      ? "Dokument erstellt"
                      : "Aktivität"}
                  </p>

                  <p className="mt-2">
                    {activity.title}
                  </p>
                </div>

                <p className="text-sm text-zinc-500">
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