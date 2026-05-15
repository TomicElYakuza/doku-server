"use client";

import { useEffect, useState } from "react";

import {
  getActivities,
} from "../lib/activityStorage";

import {
  getStoredPages,
  savePages,
} from "../lib/wikiStorage";

import {
  getUser,
} from "../lib/userStorage";

import {
  canCreate,
} from "../lib/permissions";

import { wikiPages } from "../data/wiki";

export default function HomePage() {
  const [activities, setActivities] =
    useState<any[]>([]);

  const [pages, setPages] =
    useState<any[]>([]);

  const [user, setUser] =
    useState<any>(null);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const storedPages =
      getStoredPages();

    if (storedPages.length > 0) {
      setPages(storedPages);
    } else {
      savePages(wikiPages);

      setPages(wikiPages);
    }

    setActivities(
      getActivities()
    );

    setUser(getUser());
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
      return "Dokument gelöscht";
    }

    if (type === "restored") {
      return "Version wiederhergestellt";
    }

    if (type === "uploaded") {
      return "Datei hochgeladen";
    }

    if (type === "commented") {
      return "Kommentar hinzugefügt";
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

    if (type === "restored") {
      return "♻️";
    }

    if (type === "uploaded") {
      return "📎";
    }

    if (type === "commented") {
      return "💬";
    }

    return "📌";
  }

  const departments = [
    ...new Set(
      pages.map(
        (page: any) =>
          page.category
      )
    ),
  ];

  const tags = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Willkommen zurück
          </h1>

          <p className="text-zinc-500 mt-2">
            Firmen Intranet Übersicht
          </p>
        </div>

        {user ? (
          <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
              {user.name?.charAt(0)}
            </div>

            <div>
              <p className="font-medium">
                {user.name}
              </p>

              <p className="text-sm text-zinc-500 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        ) : (
          <a
            href="/setup"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzer einrichten
          </a>
        )}
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pages.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departments.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tags.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Aktivitäten
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activities.length}
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

          {canCreate() && (
            <a
              href="/wiki/create"
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Dokument erstellen
            </a>
          )}

          <a
            href="/setup"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzer Setup
          </a>
        </div>
      </div>

      {/* RECENT DOCUMENTS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Dokumente
        </h2>

        <div className="mt-6 grid gap-4">
          {pages.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Dokumente vorhanden.
            </p>
          )}

          {pages
            .slice(0, 5)
            .map((page: any) => (
              <a
                key={page.slug}
                href={`/wiki/${page.slug}`}
                className="border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {page.title}
                    </p>

                    <p className="text-sm text-zinc-500 mt-1">
                      {page.category}
                    </p>
                  </div>

                  <p className="text-sm text-zinc-500">
                    {page.updatedAt}
                  </p>
                </div>
              </a>
            ))}
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
                className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
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

                    <p className="mt-2">
                      {activity.title}
                    </p>
                  </div>
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