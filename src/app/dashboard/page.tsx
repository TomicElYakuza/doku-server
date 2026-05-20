"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import type {
  Ticket,
} from "../../lib/ticketStorage";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  newsRepository,
} from "../../lib/newsRepository";

import type {
  NewsPost,
} from "../../lib/newsStorage";

import {
  getCurrentUser,
  getRoleLabel,
} from "../../lib/permissions";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import type {
  AppSettings,
} from "../../lib/appSettingsStorage";

import {
  getOrganizationLabels,
} from "../../lib/organizationHelpers";

type DashboardCard = {
  label: string;
  value: number;
  href: string;
  description: string;
};

function getNewsCategoryClass(
  category: string
) {
  if (category === "Tickets") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (category === "System") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function DashboardPage() {
  const [mounted, setMounted] =
    useState(false);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [latestNews, setLatestNews] =
    useState<NewsPost[]>([]);

  const [newsCount, setNewsCount] =
    useState(0);

  const [unreadNewsCount, setUnreadNewsCount] =
    useState(0);

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

    window.addEventListener(
      "newsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "newsOpenedUpdated",
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

      window.removeEventListener(
        "newsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "newsOpenedUpdated",
        handleUpdate
      );
    };
  }, []);

  function loadDashboard() {
    const news =
      newsRepository.list();

    const openedNewsIds =
      newsRepository.getOpenedIds();

    setTickets(
      ticketRepository.list()
    );

    setLatestNews(
      newsRepository.listLatest(
        5
      )
    );

    setNewsCount(
      news.length
    );

    setUnreadNewsCount(
      news.filter(
        (post) =>
          !openedNewsIds.includes(
            post.id
          )
      ).length
    );

    setWikiCount(
      wikiRepository.countAll()
    );

    setActivityCount(
      activityRepository.countAll()
    );

    setCompanyCount(
      companyRepository.countCompanies()
    );

    setDepartmentCount(
      companyRepository.countDepartments()
    );

    setSettings(
      appSettingsRepository.get()
    );
  }

  if (!mounted) {
    return null;
  }

  const user =
    getCurrentUser();

  const openTickets =
    ticketRepository.listByStatus(
      "open"
    );

  const inProgressTickets =
    ticketRepository.listByStatus(
      "in_progress"
    );

  const waitingTickets =
    ticketRepository.listByStatus(
      "waiting"
    );

  const doneTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "done" ||
        ticket.status === "closed"
    );

  const urgentTickets =
    ticketRepository.listHighOrUrgent();

  const latestTickets =
    [
      ...tickets,
    ]
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
        "News gesamt",

      value:
        newsCount,

      href:
        "/",

      description:
        "Interne Meldungen",
    },
    {
      label:
        "Ungelesene News",

      value:
        unreadNewsCount,

      href:
        "/",

      description:
        "Noch nicht geöffnet",
    },
    {
      label:
        "Tickets gesamt",

      value:
        tickets.length,

      href:
        "/tickets",

      description:
        "Alle Tickets",
    },
    {
      label:
        "Offene Tickets",

      value:
        openTickets.length,

      href:
        "/tickets",

      description:
        "Nicht bearbeitet",
    },
    {
      label:
        "In Bearbeitung",

      value:
        inProgressTickets.length,

      href:
        "/tickets",

      description:
        "Aktive Vorgänge",
    },
    {
      label:
        "Wartend",

      value:
        waitingTickets.length,

      href:
        "/tickets",

      description:
        "Rückfrage/Wartezustand",
    },
    {
      label:
        "Erledigt",

      value:
        doneTickets.length,

      href:
        "/tickets",

      description:
        "Abgeschlossen",
    },
    {
      label:
        "Hohe Priorität",

      value:
        urgentTickets.length,

      href:
        "/tickets",

      description:
        "Dringend/wichtig",
    },
    {
      label:
        "Wiki-Dokumente",

      value:
        wikiCount,

      href:
        "/wiki",

      description:
        "Dokumentationen",
    },
    {
      label:
        "Aktivitäten",

      value:
        activityCount,

      href:
        "/activity",

      description:
        "Systemaktionen",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <div>
          <p className="text-sm text-zinc-500">
            Willkommen zurück
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {settings?.appName ||
              "DMS Intranet"}
          </h1>

          <p className="text-zinc-500 mt-2">
            Dashboard für News, Dokumente, Tickets, Aktivitäten, Firmen und spätere Datenbank-Anbindung
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            News öffnen
          </Link>

          <Link
            href="/wiki/new"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Dokument erstellen
          </Link>

          <Link
            href="/tickets"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Tickets öffnen
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Aktueller Kontext
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Benutzer
            </p>

            <p className="font-semibold mt-1">
              {user?.name ||
                "Unbekannt"}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
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

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {user?.company ||
                "Intern"}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Abteilung
            </p>

            <p className="font-semibold mt-1">
              {user?.department ||
                "Allgemein"}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Organisationen
            </p>

            <p className="font-semibold mt-1">
              {companyCount} / {departmentCount}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Übersicht
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(
            (card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:bg-zinc-50 transition min-h-[120px]"
              >
                <p className="text-sm text-zinc-500">
                  {card.label}
                </p>

                <h2
                  className={`text-3xl font-bold mt-3 ${
                    card.label === "Ungelesene News" &&
                    card.value > 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {card.value}
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  {card.description}
                </p>
              </Link>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
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
              className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
            >
              Alle Tickets
            </Link>
          </div>

          <div className="grid gap-4 mt-6">
            {latestTickets.length === 0 && (
              <p className="text-zinc-500">
                Noch keine Tickets vorhanden.
              </p>
            )}

            {latestTickets.map(
              (ticket) => {
                const organization =
                  getOrganizationLabels(
                    ticket
                  );

                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${ticketRepository.getStatusClass(ticket.status)}`}>
                        {ticketRepository.getStatusLabel(
                          ticket.status
                        )}
                      </span>

                      <span className={`text-xs px-3 py-1 rounded-full ${ticketRepository.getPriorityClass(ticket.priority)}`}>
                        {ticketRepository.getPriorityLabel(
                          ticket.priority
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {organization.companyName}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {organization.departmentName}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold mt-4">
                      #{ticket.id} · {ticket.title}
                    </h3>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {ticket.description}
                    </p>

                    <p className="text-xs text-zinc-400 mt-4">
                      Aktualisiert: {ticket.updatedAt}
                    </p>
                  </Link>
                );
              }
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Neuigkeiten
              </h2>

              <p className="text-zinc-500 mt-2">
                Aktuelle interne Meldungen
              </p>
            </div>

            <Link
              href="/"
              className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
            >
              Alle
            </Link>
          </div>

          <div className="grid gap-3 mt-5">
            {latestNews.length === 0 && (
              <p className="text-zinc-500">
                Noch keine News vorhanden.
              </p>
            )}

            {latestNews.map(
              (post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="border border-zinc-200 rounded-2xl p-4 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getNewsCategoryClass(post.category)}`}>
                      {post.category}
                    </span>

                    {post.pinned && (
                      <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                        Fixiert
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold mt-3 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                    {post.description}
                  </p>

                  <p className="text-xs text-zinc-400 mt-3">
                    Beitrag #{post.id} · {post.createdAt}
                  </p>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}