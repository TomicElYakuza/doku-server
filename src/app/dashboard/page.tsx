"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import {
  newsRepository,
} from "../../lib/newsRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  adminUserRepository,
} from "../../lib/adminUserRepository";

import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../../lib/currentUserRepository";

import type {
  Ticket,
} from "../../types/ticket";

import type {
  NewsPost,
} from "../../types/news";

import type {
  AppSettings,
} from "../../types/settings";

import type {
  Company,
  Department,
} from "../../types/company";

import type {
  AdminUser,
  User,
} from "../../types/user";

type HealthState = {
  ok: boolean;
  database: string;
  error?: string;
};

function getTicketStatusLabel(
  status: string
) {
  return ticketRepository.getStatusLabel(
    status
  );
}

function getTicketStatusClass(
  status: string
) {
  return ticketRepository.getStatusClass(
    status
  );
}

function getTicketPriorityLabel(
  priority: string
) {
  return ticketRepository.getPriorityLabel(
    priority
  );
}

function getTicketPriorityClass(
  priority: string
) {
  return ticketRepository.getPriorityClass(
    priority
  );
}

function getCategoryClass(
  category: string
) {
  if (category === "System") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "Tickets") {
    return "bg-orange-100 text-orange-700";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getRoleLabel(
  role?: string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Leser";
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [newsPosts, setNewsPosts] =
    useState<NewsPost[]>([]);

  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [health, setHealth] =
    useState<HealthState | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
  void loadDashboard();
}, []);

  async function loadHealth() {
    try {
      const response =
        await fetch(
          "/api/database/health"
        );

      const data =
        await response.json() as HealthState;

      setHealth(
        data
      );
    } catch (healthError) {
      console.error(
        "Datenbankstatus konnte nicht geladen werden:",
        healthError
      );

      setHealth({
        ok:
          false,

        database:
          "error",

        error:
          "Healthcheck nicht erreichbar.",
      });
    }
  }

  async function loadDashboard() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextUser,
        nextTickets,
        nextNewsPosts,
        nextSettings,
        nextCompanies,
        nextDepartments,
        nextUsers,
      ] =
        await Promise.all([
          loadCurrentUser(),
          ticketRepository.list(),
          newsRepository.list(),
          appSettingsRepository.get(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
          adminUserRepository.list(),
        ]);

      setCurrentUser(
        nextUser
      );

      setTickets(
        Array.isArray(
          nextTickets
        )
          ? nextTickets
          : []
      );

      setNewsPosts(
        Array.isArray(
          nextNewsPosts
        )
          ? nextNewsPosts
          : []
      );

      setSettings(
        nextSettings
      );

      setCompanies(
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
      );

      setUsers(
        Array.isArray(
          nextUsers
        )
          ? nextUsers
          : []
      );

      await loadHealth();
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dashboard konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const openTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status !== "closed"
        ),
      [
        tickets,
      ]
    );

  const closedTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status === "closed"
        ),
      [
        tickets,
      ]
    );

  const urgentTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.priority === "urgent" ||
            ticket.priority === "high"
        ),
      [
        tickets,
      ]
    );

  const myTickets =
    useMemo(
      () => {
        if (!currentUser) {
          return [];
        }

        const userName =
          currentUser.name.toLowerCase();

        const userEmail =
          currentUser.email.toLowerCase();

        return tickets.filter(
          (ticket) => {
            const assignedTo =
              String(
                ticket.assignedTo ||
                  ""
              ).toLowerCase();

            const createdBy =
              String(
                ticket.createdBy ||
                  ""
              ).toLowerCase();

            return (
              assignedTo.includes(
                userName
              ) ||
              assignedTo.includes(
                userEmail
              ) ||
              createdBy.includes(
                userName
              ) ||
              createdBy.includes(
                userEmail
              )
            );
          }
        );
      },
      [
        tickets,
        currentUser,
      ]
    );

  const latestTickets =
    useMemo(
      () =>
        [
          ...tickets,
        ].slice(
          0,
          5
        ),
      [
        tickets,
      ]
    );

  const latestNews =
    useMemo(
      () =>
        [
          ...newsPosts,
        ].slice(
          0,
          4
        ),
      [
        newsPosts,
      ]
    );

  const pinnedNews =
    useMemo(
      () =>
        newsPosts.filter(
          (post) =>
            post.pinned
        ),
      [
        newsPosts,
      ]
    );

  const activeUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.status === "active"
        ),
      [
        users,
      ]
    );

  const ticketCompletionPercent =
    tickets.length === 0
      ? 0
      : Math.round(
          closedTickets.length / tickets.length * 100
        );

  const quickLinks = [
    {
      title:
        "Neues Ticket",

      description:
        "Supportfall oder Aufgabe erfassen",

      href:
        "/tickets",

      icon:
        "🎫",
    },
    {
      title:
        "Wiki öffnen",

      description:
        "Dokumentation durchsuchen",

      href:
        "/wiki",

      icon:
        "📚",
    },
    {
      title:
        "News lesen",

      description:
        "Aktuelle interne Meldungen",

      href:
        "/news",

      icon:
        "📰",
    },
    {
      title:
        "Dateien",

      description:
        "Anhänge und Uploads verwalten",

      href:
        "/files",

      icon:
        "📎",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-zinc-900 text-white rounded-3xl p-8 shadow-sm">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
          <div>
            <p className="text-zinc-300">
              Willkommen zurück
            </p>

            <h1 className="text-4xl font-bold mt-2">
              {currentUser?.name ||
                "Dashboard"}
            </h1>

            <p className="text-zinc-300 mt-3 max-w-3xl">
              Deine Übersicht für {settings.appName || "Intranet"} · {settings.companyName || "Intern"}.
              Hier siehst du offene Arbeit, wichtige News und den Systemstatus.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                {getRoleLabel(
                  currentUser?.role
                )}
              </span>

              <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                {currentUser?.company ||
                  "Intern"}
              </span>

              <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                {currentUser?.department ||
                  "Allgemein"}
              </span>
            </div>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-3xl p-6 min-w-[260px]">
            <p className="text-zinc-300 text-sm">
              Datenbank
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {health?.ok
                ? "Online"
                : "Unbekannt"}
            </h2>

            <p className="text-sm text-zinc-300 mt-2">
              {health?.database ||
                "PostgreSQL"}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="mt-5 bg-white text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute right-24 -top-28 h-56 w-56 rounded-full bg-white/5" />
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Dashboard wird geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
        <Link
          href="/tickets"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Offene Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {openTickets.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            Nicht geschlossene Tickets
          </p>
        </Link>

        <Link
          href="/tickets?priority=urgent"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Hoch / Dringend
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {urgentTickets.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            Tickets mit erhöhter Priorität
          </p>
        </Link>

        <Link
          href="/news"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            News
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {newsPosts.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {pinnedNews.length} fixiert
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Benutzer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activeUsers.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {users.length} insgesamt
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)] gap-8">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Schnellzugriff
              </h2>

              <p className="text-zinc-500 mt-1">
                Häufige Bereiche direkt öffnen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {quickLinks.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-zinc-200 rounded-3xl p-6 hover:bg-zinc-50 transition"
                >
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-semibold mt-5">
                    {item.title}
                  </h3>

                  <p className="text-zinc-500 mt-2">
                    {item.description}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Ticket-Fortschritt
          </h2>

          <p className="text-zinc-500 mt-1">
            Verhältnis aus geschlossenen zu allen Tickets.
          </p>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold">
                  {ticketCompletionPercent}%
                </p>

                <p className="text-sm text-zinc-500 mt-2">
                  abgeschlossen
                </p>
              </div>

              <div className="text-right text-sm text-zinc-500">
                <p>
                  {closedTickets.length} geschlossen
                </p>

                <p>
                  {tickets.length} gesamt
                </p>
              </div>
            </div>

            <div className="h-4 bg-zinc-100 rounded-full overflow-hidden mt-6">
              <div
                className="h-full bg-zinc-900 rounded-full"
                style={{
                  width:
                    `${ticketCompletionPercent}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Firmen
              </p>

              <p className="text-2xl font-bold mt-1">
                {companies.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Abteilungen
              </p>

              <p className="text-2xl font-bold mt-1">
                {departments.length}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Deine Tickets
              </h2>

              <p className="text-zinc-500 mt-1">
                Tickets, die dir zugeordnet sind oder von dir erstellt wurden.
              </p>
            </div>

            <Link
              href="/tickets"
              className="text-sm bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Alle Tickets
            </Link>
          </div>

          <div className="space-y-4 mt-6">
            {myTickets.length === 0 && (
              <p className="text-zinc-500">
                Aktuell keine direkt zugeordneten Tickets.
              </p>
            )}

            {myTickets.slice(
              0,
              5
            ).map(
              (ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}>
                      {getTicketStatusLabel(
                        ticket.status
                      )}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}>
                      {getTicketPriorityLabel(
                        ticket.priority
                      )}
                    </span>
                  </div>

                  <h3 className="font-semibold mt-3 line-clamp-2">
                    #{ticket.id} · {ticket.title}
                  </h3>

                  <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                    {ticket.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Aktuelle News
              </h2>

              <p className="text-zinc-500 mt-1">
                Wichtige Meldungen und neue Beiträge.
              </p>
            </div>

            <Link
              href="/news"
              className="text-sm bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Alle News
            </Link>
          </div>

          <div className="space-y-4 mt-6">
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
                  className="block border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(String(post.category || "Allgemein"))}`}>
                      {post.category ||
                        "Allgemein"}
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
                    {post.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>
                </Link>
              )
            )}
          </div>
        </section>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold">
              Letzte Tickets
            </h2>

            <p className="text-zinc-500 mt-1">
              Neueste Tickets im System.
            </p>
          </div>

          <Link
            href="/tickets"
            className="text-sm bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
          >
            Tickets öffnen
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-5 gap-4 mt-6">
          {latestTickets.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Tickets vorhanden.
            </p>
          )}

          {latestTickets.map(
            (ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[11px] px-2 py-1 rounded-full ${getTicketStatusClass(ticket.status)}`}>
                    {getTicketStatusLabel(
                      ticket.status
                    )}
                  </span>

                  <span className={`text-[11px] px-2 py-1 rounded-full ${getTicketPriorityClass(ticket.priority)}`}>
                    {getTicketPriorityLabel(
                      ticket.priority
                    )}
                  </span>
                </div>

                <p className="font-semibold mt-3 line-clamp-2">
                  #{ticket.id} · {ticket.title}
                </p>

                <p className="text-xs text-zinc-500 mt-2">
                  {ticket.company ||
                    "Intern"}
                  {" · "}
                  {ticket.department ||
                    "Allgemein"}
                </p>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}