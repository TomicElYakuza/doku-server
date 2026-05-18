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

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  useEffect(() => {
    setMounted(true);

    applyUrlFilters();

    loadActivities();

    function handleActivityUpdated() {
      loadActivities();
    }

    window.addEventListener(
      "activityUpdated",
      handleActivityUpdated
    );

    return () => {
      window.removeEventListener(
        "activityUpdated",
        handleActivityUpdated
      );
    };
  }, []);

  function applyUrlFilters() {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    setSearch(
      params.get("q") || ""
    );

    setCompanyFilter(
      params.get("company") || ""
    );

    setTypeFilter(
      params.get("type") || ""
    );
  }

  function updateUrlFilters(
    nextSearch: string,
    nextCompany: string,
    nextType: string
  ) {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams();

    if (nextSearch) {
      params.set(
        "q",
        nextSearch
      );
    }

    if (nextCompany) {
      params.set(
        "company",
        nextCompany
      );
    }

    if (nextType) {
      params.set(
        "type",
        nextType
      );
    }

    const query =
      params.toString();

    const nextUrl =
      query
        ? `/activity?${query}`
        : "/activity";

    window.history.replaceState(
      null,
      "",
      nextUrl
    );
  }

  function loadActivities() {
    setActivities(
      getActivities()
    );
  }

  function resetFilters() {
    setSearch("");

    setCompanyFilter("");

    setTypeFilter("");

    updateUrlFilters(
      "",
      "",
      ""
    );
  }

  if (!mounted) {
    return null;
  }

  function getActivityLabel(type: string) {
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

    if (type === "fileDeleted") {
      return "Datei gelöscht";
    }

    if (type === "commented") {
      return "Kommentar hinzugefügt";
    }

    if (type === "commentDeleted") {
      return "Kommentar gelöscht";
    }

    if (type === "ticketCreated") {
      return "Ticket erstellt";
    }

    if (type === "ticketUpdated") {
      return "Ticket aktualisiert";
    }

    if (type === "ticketDeleted") {
      return "Ticket gelöscht";
    }

    if (type === "ticketCommented") {
      return "Ticket-Kommentar hinzugefügt";
    }

    if (type === "ticketCommentDeleted") {
      return "Ticket-Kommentar gelöscht";
    }

    if (type === "ticketTemplateCreated") {
      return "Ticket-Vorlage erstellt";
    }

    if (type === "ticketTemplateUpdated") {
      return "Ticket-Vorlage aktualisiert";
    }

    if (type === "ticketTemplateDeleted") {
      return "Ticket-Vorlage gelöscht";
    }

    if (type === "ticketTemplateReset") {
      return "Ticket-Vorlagen zurückgesetzt";
    }

    return "Aktivität";
  }

  function getActivityIcon(type: string) {
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

    if (type === "fileDeleted") {
      return "🧹";
    }

    if (type === "commented") {
      return "💬";
    }

    if (type === "commentDeleted") {
      return "🧹";
    }

    if (type === "ticketCreated") {
      return "🎫";
    }

    if (type === "ticketUpdated") {
      return "🔄";
    }

    if (type === "ticketDeleted") {
      return "🗑️";
    }

    if (type === "ticketCommented") {
      return "💬";
    }

    if (type === "ticketCommentDeleted") {
      return "🧹";
    }

    if (type === "ticketTemplateCreated") {
      return "🧩";
    }

    if (type === "ticketTemplateUpdated") {
      return "🔧";
    }

    if (type === "ticketTemplateDeleted") {
      return "🗑️";
    }

    if (type === "ticketTemplateReset") {
      return "♻️";
    }

    return "📌";
  }

  const companies: string[] =
    Array.from(
      new Set(
        activities
          .map(
            (activity: any) =>
              activity.company ||
              "Intern"
          )
          .filter(Boolean)
      )
    );

  const activityTypes: string[] =
    Array.from(
      new Set(
        activities
          .map(
            (activity: any) =>
              activity.type
          )
          .filter(Boolean)
      )
    );

  const filteredActivities =
    activities.filter(
      (activity: any) => {
        const query =
          search.toLowerCase();

        const label =
          getActivityLabel(
            activity.type
          );

        const activityCompany =
          activity.company ||
          "Intern";

        const matchesSearch =
          activity.title
            ?.toLowerCase()
            .includes(query) ||
          activity.user
            ?.toLowerCase()
            .includes(query) ||
          activityCompany
            ?.toLowerCase()
            .includes(query) ||
          activity.createdAt
            ?.toLowerCase()
            .includes(query) ||
          label
            .toLowerCase()
            .includes(query);

        const matchesCompany =
          !companyFilter ||
          activityCompany ===
            companyFilter;

        const matchesType =
          !typeFilter ||
          activity.type ===
            typeFilter;

        return (
          matchesSearch &&
          matchesCompany &&
          matchesType
        );
      }
    );

  const ticketActivityCount =
    activities.filter(
      (activity: any) =>
        activity.type?.startsWith(
          "ticket"
        )
    ).length;

  const wikiActivityCount =
    activities.filter(
      (activity: any) =>
        !activity.type?.startsWith(
          "ticket"
        )
    ).length;

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
          Verlauf aller Änderungen, Kommentare, Uploads, Tickets, Vorlagen und Löschaktionen
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Aktivitäten gesamt
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {activities.length}
          </h2>
        </div>

        <button
          onClick={() => {
            if (companies.length > 0) {
              const firstCompany =
                companies[0];

              setCompanyFilter(
                firstCompany
              );

              updateUrlFilters(
                search,
                firstCompany,
                typeFilter
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {companies.length}
          </h2>
        </button>

        <button
          onClick={() => {
            setTypeFilter(
              "ticketCreated"
            );

            updateUrlFilters(
              search,
              companyFilter,
              "ticketCreated"
            );
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Ticket-Aktivitäten
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {ticketActivityCount}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Wiki-Aktivitäten
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {wikiActivityCount}
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <input
            type="text"
            placeholder="Nach Firma, Benutzer, Titel, Datum oder Aktion suchen..."
            value={search}
            onChange={(event) => {
              const value =
                event.target.value;

              setSearch(value);

              updateUrlFilters(
                value,
                companyFilter,
                typeFilter
              );
            }}
            className="md:col-span-2 w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={companyFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              setCompanyFilter(value);

              updateUrlFilters(
                search,
                value,
                typeFilter
              );
            }}
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map(
              (company: string) => (
                <option
                  key={company}
                  value={company}
                >
                  {company}
                </option>
              )
            )}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              setTypeFilter(value);

              updateUrlFilters(
                search,
                companyFilter,
                value
              );
            }}
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
            ) => {
              const activityCompany =
                activity.company ||
                "Intern";

              return (
                <div
                  key={`${activity.createdAt}-${activity.type}-${index}`}
                  className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0 gap-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                      {getActivityIcon(
                        activity.type
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setCompanyFilter(
                              activityCompany
                            );

                            updateUrlFilters(
                              search,
                              activityCompany,
                              typeFilter
                            );
                          }}
                          className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-100 transition"
                        >
                          {activityCompany}
                        </button>

                        <button
                          onClick={() => {
                            setTypeFilter(
                              activity.type
                            );

                            updateUrlFilters(
                              search,
                              companyFilter,
                              activity.type
                            );
                          }}
                          className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                        >
                          {getActivityLabel(
                            activity.type
                          )}
                        </button>
                      </div>

                      <p className="font-medium mt-2">
                        {activity.user ||
                          "Unbekannt"}
                      </p>

                      <p className="mt-2 font-medium break-words">
                        {activity.title ||
                          "Ohne Titel"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 whitespace-nowrap">
                    {activity.createdAt ||
                      "Unbekannt"}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}