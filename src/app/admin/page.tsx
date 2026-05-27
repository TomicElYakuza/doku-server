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

import {
  useFeatureFlags,
} from "../../hooks/useFeatureFlags";

import AccessDeniedCard from "../../components/AccessDeniedCard";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

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
  badge: string;
  accent: string;
};

function getActivityLabel(
  type: string
) {
  return activityRepository.getTypeLabel(
    type
  );
}

function getActivityClass(
  type: string
) {
  return activityRepository.getTypeClass(
    type
  );
}

export default function AdminPage() {
  const {
    activityLogEnabled,
    ticketTemplatesEnabled,
  } =
    useFeatureFlags();

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
        Array.isArray(
          nextUsers
        )
          ? nextUsers
          : []
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

      setTickets(
        Array.isArray(
          nextTickets
        )
          ? nextTickets
          : []
      );

      setTemplates(
        Array.isArray(
          nextTemplates
        )
          ? nextTemplates
          : []
      );

      setNews(
        Array.isArray(
          nextNews
        )
          ? nextNews
          : []
      );

      setWikiPages(
        Array.isArray(
          nextWikiPages
        )
          ? nextWikiPages
          : []
      );

      setActivities(
        Array.isArray(
          nextActivities
        )
          ? nextActivities
          : []
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

  const adminUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role === "admin"
        ),
      [
        users,
      ]
    );

  const departmentLeadUsers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role === "department_lead"
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

  const modules =
    useMemo(
      () => {
        const nextModules: AdminModule[] = [
          {
            title:
              "Benutzerverwaltung",

            description:
              "Benutzer, Rollen, Login-Daten, Status und Organisationszuordnung verwalten.",

            href:
              "/admin/users",

            icon:
              "👥",

            badge:
              `${users.length} Benutzer`,

            accent:
              "bg-blue-50 text-blue-700",
          },
          {
            title:
              "Berechtigungen",

            description:
              "Rollen, Firmenrechte, Abteilungsrechte und einzelne Benutzerrechte zentral verwalten.",

            href:
              "/admin/permissions",

            icon:
              "🔐",

            badge:
              "Rechte",

            accent:
              "bg-red-50 text-red-700",
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

            accent:
              "bg-emerald-50 text-emerald-700",
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
              `${news.length} Beiträge`,

            accent:
              "bg-orange-50 text-orange-700",
          },
        ];

        if (ticketTemplatesEnabled) {
          nextModules.push({
            title:
              "Ticket-Vorlagen",

            description:
              "Wiederverwendbare Vorlagen für Supportprozesse verwalten.",

            href:
              "/tickets/templates",

            icon:
              "📋",

            badge:
              `${templates.length} Vorlagen`,

            accent:
              "bg-purple-50 text-purple-700",
          });
        }

        nextModules.push({
          title:
            "Systemeinstellungen",

          description:
            "App-Name, globale Oberfläche, Features und Standardrollen konfigurieren.",

          href:
            "/admin/settings",

          icon:
            "⚙️",

          badge:
            "System",

          accent:
            "bg-zinc-100 text-zinc-700",
        });

        if (activityLogEnabled) {
          nextModules.push({
            title:
              "Aktivitätsprotokoll",

            description:
              "Systemaktivitäten und Benutzeraktionen nachvollziehen.",

            href:
              "/activity",

            icon:
              "🧾",

            badge:
              `${activities.length} Einträge`,

            accent:
              "bg-indigo-50 text-indigo-700",
          });
        }

        return nextModules;
      },
      [
        users.length,
        companies.length,
        departments.length,
        news.length,
        templates.length,
        activities.length,
        ticketTemplatesEnabled,
        activityLogEnabled,
      ]
    );

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
      <PageHero
        eyebrow="Verwaltung"
        title="Admin Backend"
        description={`Zentrale Verwaltung für ${settings.appName || "Intranet"}. Benutzer, Rechte, Organisation, News und Systemeinstellungen sind hier gebündelt.`}
        badges={[
          {
            label:
              "PostgreSQL/API",
          },
          {
            label:
              settings.companyName ||
              "Intern",
          },
          {
            label:
              `Version ${settings.appVersion || settings.version || "0.1.0"}`,
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Aktualisieren
            </button>

            <Link
              href="/dashboard"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
            >
              Zum Dashboard
            </Link>
          </>
        )}
      />

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
        <Link href="/admin/users">
          <StatCard
            label="Aktive Benutzer"
            value={activeUsers.length}
            description={`${adminUsers.length} Administratoren · ${departmentLeadUsers.length} Abteilungsleiter`}
            icon="👥"
            tone="blue"
          />
        </Link>

        <Link href="/tickets">
          <StatCard
            label="Offene Tickets"
            value={openTickets.length}
            description={`${urgentTickets.length} hoch/dringend`}
            icon="🎫"
            tone="orange"
          />
        </Link>

        <Link href="/wiki">
          <StatCard
            label="Wiki-Seiten"
            value={wikiPages.length}
            description="Dokumentation"
            icon="📚"
            tone="indigo"
          />
        </Link>

        <Link href="/admin/news">
          <StatCard
            label="News"
            value={news.length}
            description={`${pinnedNews.length} fixiert`}
            icon="📰"
            tone="green"
          />
        </Link>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold">
              Admin-Module
            </h2>

            <p className="text-zinc-500 mt-1">
              Die wichtigsten Verwaltungsbereiche für Benutzer, Rechte, Organisation und System.
            </p>
          </div>

          <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">
            Bereinigt
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
                  <div className="text-3xl">
                    {module.icon}
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full ${module.accent}`}>
                    {module.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mt-5">
                  {module.title}
                </h3>

                <p className="text-zinc-500 mt-2">
                  {module.description}
                </p>
              </Link>
            )
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Systemübersicht
          </h2>

          <p className="text-zinc-500 mt-1">
            Aktuelle Basisdaten der Anwendung.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                App
              </p>

              <p className="font-semibold mt-1">
                {settings.appName ||
                  "Intranet"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Firma
              </p>

              <p className="font-semibold mt-1">
                {settings.companyName ||
                  "Intern"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Organisation
              </p>

              <p className="font-semibold mt-1">
                {companies.length} Firmen · {departments.length} Abteilungen
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Datenquelle
              </p>

              <p className="font-semibold mt-1">
                PostgreSQL/API
              </p>
            </div>
          </div>
        </section>

        {activityLogEnabled && (
          <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-2xl font-semibold">
                  Letzte Aktivitäten
                </h2>

                <p className="text-zinc-500 mt-1">
                  Kurzer Systemauszug.
                </p>
              </div>

              <Link
                href="/activity"
                className="bg-zinc-100 px-4 py-2 rounded-xl hover:bg-zinc-200 transition text-sm"
              >
                Alle
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
                    <span className={`text-xs px-3 py-1 rounded-full ${getActivityClass(activity.type)}`}>
                      {getActivityLabel(
                        activity.type
                      )}
                    </span>

                    <h3 className="font-semibold mt-3">
                      {activity.title}
                    </h3>

                    <p className="text-sm text-zinc-500 mt-1">
                      {activity.createdAt}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}