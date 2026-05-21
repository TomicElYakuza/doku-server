"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canViewAdmin,
} from "../../lib/permissions";

import {
  adminUserRepository,
} from "../../lib/adminUserRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import {
  ticketTemplateRepository,
} from "../../lib/ticketTemplateRepository";

import {
  newsRepository,
} from "../../lib/newsRepository";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import AccessDeniedCard from "../../components/AccessDeniedCard";

import type {
  AdminUser,
} from "../../types/user";

import type {
  Company,
  Department,
} from "../../types/company";

import type {
  Ticket,
} from "../../types/ticket";

import type {
  TicketTemplate,
} from "../../types/ticketTemplate";

import type {
  NewsPost,
} from "../../types/news";

import type {
  WikiPage,
} from "../../types/wiki";

import type {
  Activity,
} from "../../types/activity";

import type {
  AppSettings,
} from "../../types/settings";

type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
};

function getStatusClass(
  value: number
) {
  if (value === 0) {
    return "bg-zinc-100 text-zinc-600";
  }

  if (value < 5) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-green-50 text-green-700";
}

export default function AdminPage() {
  const [mounted, setMounted] =
    useState(false);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [news, setNews] =
    useState<NewsPost[]>([]);

  const [wikiPages, setWikiPages] =
    useState<WikiPage[]>([]);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    void loadData();

    const events = [
      "adminUsersUpdated",
      "companiesUpdated",
      "departmentsUpdated",
      "ticketsUpdated",
      "ticketTemplatesUpdated",
      "newsUpdated",
      "wikiPagesUpdated",
      "activitiesUpdated",
      "appSettingsUpdated",
    ];

    function handleDataUpdated() {
      void loadData();
    }

    events.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleDataUpdated
        );
      }
    );

    return () => {
      events.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleDataUpdated
          );
        }
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextUsers,
        nextCompanies,
        nextDepartments,
        nextTickets,
        nextTemplates,
        nextNews,
        nextWikiPages,
        nextActivities,
        nextSettings,
      ] =
        await Promise.all([
          adminUserRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
          ticketRepository.list(),
          ticketTemplateRepository.list(),
          newsRepository.list(),
          wikiRepository.list(),
          activityRepository.list(),
          appSettingsRepository.get(),
        ]);

      setUsers(
        nextUsers
      );

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );

      setTickets(
        nextTickets
      );

      setTemplates(
        nextTemplates
      );

      setNews(
        nextNews
      );

      setWikiPages(
        nextWikiPages
      );

      setActivities(
        nextActivities
      );

      setSettings(
        nextSettings
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Admin-Dashboard konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

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

  const pinnedNews =
    useMemo(
      () =>
        news.filter(
          (post) =>
            post.pinned
        ),
      [
        news,
      ]
    );

  const latestActivities =
    useMemo(
      () =>
        activities.slice(
          0,
          6
        ),
      [
        activities,
      ]
    );

  const modules: AdminModule[] = [
    {
      title:
        "Benutzerverwaltung",

      description:
        "Benutzer, Rollen, Status und Organisationszuordnung verwalten.",

      href:
        "/admin/users",

      icon:
        "👥",

      badge:
        `${users.length}`,
    },
    {
      title:
        "Firmen & Abteilungen",

      description:
        "Firmenstruktur und Abteilungen zentral konfigurieren.",

      href:
        "/admin/companies",

      icon:
        "🏢",

      badge:
        `${companies.length}/${departments.length}`,
    },
    {
      title:
        "News-Verwaltung",

      description:
        "Neuigkeiten erstellen, bearbeiten, fixieren und löschen.",

      href:
        "/admin/news",

      icon:
        "📰",

      badge:
        `${news.length}`,
    },
    {
      title:
        "Ticket-Vorlagen",

      description:
        "Wiederverwendbare Ticket-Vorlagen für Supportprozesse verwalten.",

      href:
        "/tickets/templates",

      icon:
        "📋",

      badge:
        `${templates.length}`,
    },
    {
      title:
        "Einstellungen",

      description:
        "App-Name, Oberfläche, Features und Standardrollen konfigurieren.",

      href:
        "/settings",

      icon:
        "⚙️",

      badge:
        "System",
    },
    {
      title:
        "Aktivitätsprotokoll",

      description:
        "Systemaktivitäten und Benutzeraktionen nachvollziehen.",

      href:
        "/activity",

      icon:
        "🕘",

      badge:
        `${activities.length}`,
    },
  ];

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Admin Backend
          </h1>

          <p className="text-zinc-500 mt-2">
            Zentrale Verwaltung für {settings.appName || "Intranet"} auf PostgreSQL-Basis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktualisieren
          </button>

          <Link
            href="/dashboard"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Admin-Daten werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Benutzer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {users.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {activeUsers.length} aktiv
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Organisation
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {departments.length} Abteilungen
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Offene Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {openTickets.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {urgentTickets.length} hoch/dringend
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Inhalte
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {news.length + wikiPages.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-3">
            {news.length} News · {wikiPages.length} Wiki
          </p>
        </div>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold">
              Verwaltung
            </h2>

            <p className="text-zinc-500 mt-1">
              Module für Konfiguration und Bearbeitung ohne Quellcodezugriff.
            </p>
          </div>

          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
            PostgreSQL aktiv
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {modules.map(
            (module) => (
              <Link
                key={module.href}
                href={module.href}
                className="border border-zinc-200 rounded-3xl p-6 hover:bg-zinc-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
                    {module.icon}
                  </div>

                  {module.badge && (
                    <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
                      {module.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mt-5">
                  {module.title}
                </h3>

                <p className="text-zinc-500 mt-2 leading-relaxed">
                  {module.description}
                </p>
              </Link>
            )
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Systemübersicht
          </h2>

          <p className="text-zinc-500 mt-1">
            Aktuelle Basisdaten aus der Datenbank.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                App
              </p>

              <p className="font-semibold mt-2">
                {settings.appName || "Intranet"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Firma
              </p>

              <p className="font-semibold mt-2">
                {settings.companyName || "Intern"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Version
              </p>

              <p className="font-semibold mt-2">
                {settings.appVersion || settings.version || "0.1.0"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Datenquelle
              </p>

              <p className="font-semibold mt-2">
                PostgreSQL
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Letzte Aktivitäten
              </h2>

              <p className="text-zinc-500 mt-1">
                Aktuelle Änderungen im System.
              </p>
            </div>

            <Link
              href="/activity"
              className="text-sm bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Alle anzeigen
            </Link>
          </div>

          <div className="space-y-3 mt-6">
            {latestActivities.length === 0 && (
              <p className="text-zinc-500">
                Noch keine Aktivitäten vorhanden.
              </p>
            )}

            {latestActivities.map(
              (activity) => (
                <div
                  key={activity.id}
                  className="border border-zinc-200 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${activityRepository.getTypeClass(activity.type)}`}>
                      {activityRepository.getTypeLabel(
                        activity.type
                      )}
                    </span>

                    <span className="text-xs text-zinc-400">
                      {activity.createdAt}
                    </span>
                  </div>

                  <p className="font-medium mt-3">
                    {activity.title}
                  </p>

                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}