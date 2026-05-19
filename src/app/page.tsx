"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getTickets,
  getTicketPriorityClass,
  getTicketPriorityLabel,
  getTicketStatusClass,
  getTicketStatusLabel,
} from "../lib/ticketStorage";

import type {
  Ticket,
} from "../lib/ticketStorage";

import {
  getStoredPages,
} from "../lib/wikiStorage";

import {
  getActivities,
} from "../lib/activityStorage";

import {
  getCurrentUser,
  getRoleLabel,
} from "../lib/permissions";

import {
  getAppSettings,
} from "../lib/appSettingsStorage";

import type {
  AppSettings,
} from "../lib/appSettingsStorage";

import {
  getCompanies,
  getDepartments,
} from "../lib/companyStorage";

import {
  getOrganizationLabels,
} from "../lib/organizationHelpers";

type DashboardCard = {
  label: string;
  value: number;
  href: string;
  description: string;
};

export default function HomePage() {
  const [mounted, setMounted] =
    useState(false);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [wikiCount, setWikiCount] =
    useState(0);

  const [activityCount, setActivityCount] =
    useState(0);

  const [companyCount, setCompanyCount] =
    useState(0);

  const [departmentCount, setDepartmentCount] =
    useState(0);

  const [settings, setSettings] =
    useState<AppSettings | null>(null);

  useEffect(() => {
    setMounted(true);

    loadDashboard();

    function handleUpdate() {
      loadDashboard();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleUpdate
    );

    window.addEventListener(
      "activityUpdated",
      handleUpdate
    );

    window.addEventListener(
      "companiesUpdated",
      handleUpdate
    );

    window.addEventListener(
      "departmentsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "activityUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "companiesUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleUpdate
      );
    };
  }, []);

  function loadDashboard() {
    setTickets(
      getTickets()
    );

    setWikiCount(
      getStoredPages().length
    );

    setActivityCount(
      getActivities().length
    );

    setCompanyCount(
      getCompanies().length
    );

    setDepartmentCount(
      getDepartments().length
    );

    setSettings(
      getAppSettings()
    );
  }

  if (!mounted) {
    return null;
  }

  const user =
    getCurrentUser();

  const openTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "open"
    );

  const inProgressTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "in_progress"
    );

  const waitingTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "waiting"
    );

  const doneTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "done" ||
        ticket.status === "closed"
    );

  const urgentTickets =
    tickets.filter(
      (ticket) =>
        ticket.priority === "urgent" ||
        ticket.priority === "high"
    );

  const latestTickets =
    [...tickets]
      .sort(
        (a, b) =>
          new Date(
            b.updatedAt
          ).getTime() -
          new Date(
            a.updatedAt
          ).getTime()
      )
      .slice(
        0,
        5
      );

  const cards: DashboardCard[] = [
    {
      label:
        "Tickets gesamt",

      value:
        tickets.length,

      href:
        "/tickets",

      description:
        "Alle aktuellen Tickets im System",
    },

    {
      label:
        "Offene Tickets",

      value:
        openTickets.length,

      href:
        "/tickets",

      description:
        "Tickets, die noch nicht bearbeitet werden",
    },

    {
      label:
        "In Bearbeitung",

      value:
        inProgressTickets.length,

      href:
        "/tickets",

      description:
        "Aktive Vorgänge und Aufgaben",
    },

    {
      label:
        "Wartend",

      value:
        waitingTickets.length,

      href:
        "/tickets",

      description:
        "Tickets mit Rückfrage oder Wartezustand",
    },

    {
      label:
        "Erledigt",

      value:
        doneTickets.length,

      href:
        "/tickets",

      description:
        "Abgeschlossene Vorgänge",
    },

    {
      label:
        "Hohe Priorität",

      value:
        urgentTickets.length,

      href:
        "/tickets",

      description:
        "Dringende oder wichtige Tickets",
    },

    {
      label:
        "Wiki-Dokumente",

      value:
        wikiCount,

      href:
        "/wiki",

      description:
        "Interne Dokumentationen und Anleitungen",
    },

    {
      label:
        "Aktivitäten",

      value:
        activityCount,

      href:
        "/activity",

      description:
        "Letzte Änderungen und Systemaktionen",
    },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-zinc-500">
            Willkommen zurück
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {settings?.appName ||
              "DMS Intranet"}
          </h1>

          <p className="text-zinc-500 mt-2">
            Dashboard für Dokumente, Tickets, Aktivitäten, Firmen und spätere Datenbank-Anbindung
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Link
            href="/wiki/create"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Dokument erstellen
          </Link>

          <Link
            href="/tickets"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Tickets öffnen
          </Link>
        </div>
      </div>

      {/* USER CONTEXT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Kontext
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Benutzer
            </p>

            <p className="font-semibold mt-1">
              {user?.name ||
                "Unbekannt"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Rolle
            </p>

            <p className="font-semibold mt-1">
              {getRoleLabel(
                user?.role ||
                  "viewer"
              )}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {user?.company ||
                "Intern"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Abteilung
            </p>

            <p className="font-semibold mt-1">
              {user?.department ||
                "Allgemein"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Organisationen
            </p>

            <p className="font-semibold mt-1">
              {companyCount} / {departmentCount}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map(
          (card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
            >
              <p className="text-sm text-zinc-500">
                {card.label}
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {card.value}
              </h2>

              <p className="text-sm text-zinc-500 mt-3">
                {card.description}
              </p>
            </Link>
          )
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
        {/* LATEST TICKETS */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Letzte Tickets
              </h2>

              <p className="text-zinc-500 mt-2">
                Schnellüberblick über die zuletzt aktualisierten Vorgänge
              </p>
            </div>

            <Link
              href="/tickets"
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
            >
              Alle Tickets
            </Link>
          </div>

          <div className="grid gap-4 mt-6">
            {latestTickets.length === 0 && (
              <div className="border border-zinc-200 rounded-2xl p-5">
                <p className="text-zinc-500">
                  Noch keine Tickets vorhanden.
                </p>
              </div>
            )}

            {latestTickets.map(
              (ticket) => {
                const organization =
                  getOrganizationLabels(
                    ticket
                  );

                return (
                  <div
                    key={ticket.id}
                    className="border border-zinc-200 rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(
                              ticket.status
                            )}`}
                          >
                            {getTicketStatusLabel(
                              ticket.status
                            )}
                          </span>

                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(
                              ticket.priority
                            )}`}
                          >
                            {getTicketPriorityLabel(
                              ticket.priority
                            )}
                          </span>

                          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                            {organization.companyName}
                          </span>

                          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                            {organization.departmentName}
                          </span>
                        </div>

                        <h3 className="font-semibold text-lg mt-4">
                          {ticket.title}
                        </h3>

                        <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                          {ticket.description}
                        </p>

                        <p className="text-xs text-zinc-400 mt-4">
                          Aktualisiert: {ticket.updatedAt}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">
              Schnellzugriff
            </h2>

            <div className="grid gap-3 mt-6">
              <Link
                href="/wiki"
                className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 hover:bg-zinc-100 transition"
              >
                Wiki öffnen
              </Link>

              <Link
                href="/tickets"
                className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 hover:bg-zinc-100 transition"
              >
                Tickets öffnen
              </Link>

              <Link
                href="/activity"
                className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 hover:bg-zinc-100 transition"
              >
                Aktivitäten ansehen
              </Link>

              <Link
                href="/admin"
                className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 hover:bg-zinc-100 transition"
              >
                Admin-Dashboard
              </Link>

              <Link
                href="/admin/companies"
                className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 hover:bg-zinc-100 transition"
              >
                Firmen & Abteilungen
              </Link>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">
              Nächste Schritte
            </h2>

            <div className="grid gap-4 mt-6">
              <div className="border border-zinc-200 rounded-2xl p-5">
                <p className="font-semibold">
                  Firmenstruktur verbinden
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  Tickets, Benutzer und später Wiki-Dokumente nutzen vorbereitete Firmen- und Abteilungs-IDs.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-2xl p-5">
                <p className="font-semibold">
                  Datenbank vorbereiten
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  LocalStorage wird Schritt für Schritt über Repository/API-Layer ersetzt.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-2xl p-5">
                <p className="font-semibold">
                  Echtes Benutzersystem
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  Login, Sessions und serverseitige Rechteprüfung kommen später dazu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}