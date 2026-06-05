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

type AdminHealth = {
  ok: boolean;
  status: "healthy" | "error" | string;
  database: {
    connected: boolean;
    time: string | null;
  };
  counts: {
    users: number;
    companies: number;
    departments: number;
    tickets: number;
    wikiPages: number;
    newsPosts: number;
    taxonomyItems: number;
  };
  responseTimeMs: number;
  checkedAt: string;
  message?: string;
};

function getActivityLabel(type: string) {
  return activityRepository.getTypeLabel(type);
}

function getActivityClass(type: string) {
  return activityRepository.getTypeClass(type);
}

function getHealthStatusLabel(health: AdminHealth | null) {
  if (!health) {
    return "Nicht geprüft";
  }

  if (health.ok && health.database.connected) {
    return "Online";
  }

  return "Fehler";
}

function getHealthStatusClass(health: AdminHealth | null) {
  if (!health) {
    return "bg-zinc-100 text-zinc-600 border border-zinc-200";
  }

  if (health.ok && health.database.connected) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-red-50 text-red-700 border border-red-100";
}

export default function AdminPage() {
  const {
    activityLogEnabled,
    ticketTemplatesEnabled,
  } = useFeatureFlags();

  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<AppSettings>(
    appSettingsRepository.getDefault(),
  );
  const [health, setHealth] = useState<AdminHealth | null>(null);

  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadData();
  }, []);

  async function loadHealth() {
    try {
      setHealthLoading(true);

      const response = await fetch("/api/admin/health", {
        cache: "no-store",
      });

      const data = await response.json();

      setHealth(data);
    } catch (loadError) {
      console.error(loadError);

      setHealth({
        ok: false,
        status: "error",
        database: {
          connected: false,
          time: null,
        },
        counts: {
          users: 0,
          companies: 0,
          departments: 0,
          tickets: 0,
          wikiPages: 0,
          newsPosts: 0,
          taxonomyItems: 0,
        },
        responseTimeMs: 0,
        checkedAt: new Date().toISOString(),
        message: loadError instanceof Error ? loadError.message : "Health-Check fehlgeschlagen.",
      });
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

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
      ] = await Promise.all([
        adminUserRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        ticketRepository.list(),
        ticketTemplateRepository.list(),
        newsRepository.list(),
        wikiRepository.list(),
        activityRepository.list(),
        appSettingsRepository.get(),
        loadHealth(),
      ]);

      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      setTickets(Array.isArray(nextTickets) ? nextTickets : []);
      setTemplates(Array.isArray(nextTemplates) ? nextTemplates : []);
      setNews(Array.isArray(nextNews) ? nextNews : []);
      setWikiPages(Array.isArray(nextWikiPages) ? nextWikiPages : []);
      setActivities(Array.isArray(nextActivities) ? nextActivities : []);
      setSettings(nextSettings);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Admin-Dashboard konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "active"),
    [
      users,
    ],
  );

  const adminUsers = useMemo(
    () => users.filter((user) => user.role === "admin"),
    [
      users,
    ],
  );

  const departmentLeadUsers = useMemo(
    () => users.filter((user) => user.role === "department_lead"),
    [
      users,
    ],
  );

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "closed"),
    [
      tickets,
    ],
  );

  const urgentTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.priority === "urgent" ||
          ticket.priority === "high",
      ),
    [
      tickets,
    ],
  );

  const pinnedNews = useMemo(
    () => news.filter((post) => post.pinned),
    [
      news,
    ],
  );

  const latestActivities = useMemo(
    () => activities.slice(0, 6),
    [
      activities,
    ],
  );

  const modules = useMemo(() => {
    const nextModules: AdminModule[] = [
      {
        title: "Benutzerverwaltung",
        description: "Benutzer, Rollen, Login-Daten, Status und Organisationszuordnung verwalten.",
        href: "/admin/users",
        icon: "👥",
        badge: `${users.length} Benutzer`,
        accent: "bg-blue-50 text-blue-700",
      },
      {
        title: "Berechtigungen",
        description: "Rollen, Firmenrechte, Abteilungsrechte und einzelne Benutzerrechte zentral verwalten.",
        href: "/admin/permissions",
        icon: "🔐",
        badge: "Rechte",
        accent: "bg-red-50 text-red-700",
      },
      {
        title: "Firmen & Abteilungen",
        description: "Firmenstruktur und Abteilungen zentral konfigurieren.",
        href: "/admin/companies",
        icon: "🏢",
        badge: `${companies.length}/${departments.length}`,
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        title: "Kategorien & Tags",
        description: "Ticket- und Wiki-Kategorien als Baum sowie globale Tags im Admin Backend verwalten.",
        href: "/admin/taxonomy",
        icon: "🏷️",
        badge: `${health?.counts.taxonomyItems ?? "—"} Einträge`,
        accent: "bg-indigo-50 text-indigo-700",
      },
      {
  title: "Datenbankstatus",
  description: "PostgreSQL-Verbindung, Tabellen, Taxonomie-Spalten und Migration-Status prüfen.",
  href: "/admin/database",
  icon: "🗄️",
  badge: health?.ok ? "Online" : "Prüfen",
  accent: health?.ok ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700",
},
      {
        title: "News-Verwaltung",
        description: "Neuigkeiten erstellen, bearbeiten, fixieren und löschen.",
        href: "/admin/news",
        icon: "📰",
        badge: `${news.length} Beiträge`,
        accent: "bg-orange-50 text-orange-700",
      },
    ];

    if (ticketTemplatesEnabled) {
      nextModules.push({
        title: "Ticket-Vorlagen",
        description: "Wiederverwendbare Vorlagen für Supportprozesse verwalten.",
        href: "/tickets/templates",
        icon: "📋",
        badge: `${templates.length} Vorlagen`,
        accent: "bg-purple-50 text-purple-700",
      });
    }

    nextModules.push({
      title: "Systemeinstellungen",
      description: "App-Name, globale Oberfläche, Features und Standardrollen konfigurieren.",
      href: "/admin/settings",
      icon: "⚙️",
      badge: "System",
      accent: "bg-zinc-100 text-zinc-700",
    });

    if (activityLogEnabled) {
      nextModules.push({
        title: "Aktivitätsprotokoll",
        description: "Systemaktivitäten und Benutzeraktionen nachvollziehen.",
        href: "/activity",
        icon: "🕓",
        badge: `${activities.length} Einträge`,
        accent: "bg-sky-50 text-sky-700",
      });
    }

    return nextModules;
  }, [
    users.length,
    companies.length,
    departments.length,
    news.length,
    templates.length,
    activities.length,
    ticketTemplatesEnabled,
    activityLogEnabled,
    health,
  ]);

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Kein Zugriff"
        description="Du hast keine Berechtigung für das Admin Dashboard."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Admin Dashboard"
        description="Zentrale Verwaltung für Benutzer, Rechte, Organisation, Taxonomie, Inhalte und Systemstatus."
        badges={[
          {
            label: `${users.length} Benutzer`,
          },
          {
            label: `${companies.length} Firmen`,
          },
          {
            label: getHealthStatusLabel(health),
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadData()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktualisieren
          </button>
        }
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Aktive Benutzer"
          value={activeUsers.length}
          description={`${adminUsers.length} Admins · ${departmentLeadUsers.length} Abteilungsleiter`}
          icon="👥"
          tone="blue"
        />
        <StatCard
          label="Offene Tickets"
          value={openTickets.length}
          description={`${urgentTickets.length} hohe/dringende Tickets`}
          icon="🎫"
          tone="orange"
        />
        <StatCard
          label="Wiki-Seiten"
          value={wikiPages.length}
          description="Dokumentation aus PostgreSQL"
          icon="📚"
          tone="indigo"
        />
        <StatCard
          label="Systemstatus"
          value={getHealthStatusLabel(health)}
          description={
            healthLoading
              ? "Prüfung läuft..."
              : `${health?.responseTimeMs ?? 0} ms Antwortzeit`
          }
          icon="🟢"
          tone={health?.ok ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-8">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Admin-Module
                </h2>
                <p className="text-zinc-500 mt-1">
                  Die wichtigsten Verwaltungsbereiche bleiben im Admin Backend und nicht einzeln in der Sidebar.
                </p>
              </div>

              <span className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm">
                {modules.length} Module
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group border border-zinc-200 rounded-3xl p-5 hover:border-zinc-400 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-3xl">
                      {module.icon}
                    </div>

                    <span className={`text-xs px-3 py-1 rounded-full ${module.accent}`}>
                      {module.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mt-5 group-hover:underline">
                    {module.title}
                  </h3>
                  <p className="text-zinc-500 mt-2 leading-6">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Systemübersicht
                </h2>
                <p className="text-zinc-500 mt-1">
                  Statusbereich ohne sensible Daten wie Datenbank-Passwörter.
                </p>
              </div>

              <span className={`text-sm px-3 py-2 rounded-xl ${getHealthStatusClass(health)}`}>
                {getHealthStatusLabel(health)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  App
                </p>
                <p className="font-semibold mt-1">
                  {settings.appName || "Intranet"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Firma
                </p>
                <p className="font-semibold mt-1">
                  {settings.companyName || "Intern"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Datenquelle
                </p>
                <p className="font-semibold mt-1">
                  PostgreSQL/API
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Datenbank
                </p>
                <p className="font-semibold mt-1">
                  {health?.database.connected ? "Verbunden" : "Nicht verbunden"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Antwortzeit
                </p>
                <p className="font-semibold mt-1">
                  {health?.responseTimeMs ?? 0} ms
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Letzte Prüfung
                </p>
                <p className="font-semibold mt-1">
                  {health?.checkedAt
                    ? new Date(health.checkedAt).toLocaleString("de-AT")
                    : "-"}
                </p>
              </div>
            </div>

            {health?.message && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mt-5">
                <p className="text-sm text-red-700">
                  {health.message}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Datenbestand
            </h2>

            <div className="space-y-4 mt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Benutzer
                </span>
                <span className="font-semibold">
                  {health?.counts.users ?? users.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Firmen
                </span>
                <span className="font-semibold">
                  {health?.counts.companies ?? companies.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Abteilungen
                </span>
                <span className="font-semibold">
                  {health?.counts.departments ?? departments.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Tickets
                </span>
                <span className="font-semibold">
                  {health?.counts.tickets ?? tickets.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Wiki-Seiten
                </span>
                <span className="font-semibold">
                  {health?.counts.wikiPages ?? wikiPages.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  News
                </span>
                <span className="font-semibold">
                  {health?.counts.newsPosts ?? news.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">
                  Taxonomie
                </span>
                <span className="font-semibold">
                  {health?.counts.taxonomyItems ?? "—"}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Schnellzugriff
            </h2>

            <div className="space-y-3 mt-5">
              <Link
                href="/admin/taxonomy"
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Kategorien & Tags verwalten
              </Link>

              <Link
                href="/admin/users"
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Benutzer verwalten
              </Link>

              <Link
                href="/admin/permissions"
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Rechte verwalten
              </Link>

              <Link
                href="/admin/settings"
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Systemeinstellungen öffnen
              </Link>
            </div>
          </section>

          {pinnedNews.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Fixierte News
              </h2>

              <div className="space-y-3 mt-5">
                {pinnedNews.slice(0, 4).map((post) => (
                  <Link
                    key={post.id}
                    href={`/news/${post.id}`}
                    className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition"
                  >
                    <p className="font-medium">
                      {post.title}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {post.createdAt}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {activityLogEnabled && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Letzte Aktivitäten
              </h2>
              <p className="text-zinc-500 mt-1">
                Kurzer Systemauszug der letzten Aktionen.
              </p>
            </div>

            <Link
              href="/activity"
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Alle öffnen
            </Link>
          </div>

          <div className="space-y-3 mt-6">
            {latestActivities.length === 0 && (
              <p className="text-zinc-500">
                Noch keine Aktivitäten vorhanden.
              </p>
            )}

            {latestActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-zinc-200 rounded-2xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <span className={`text-xs px-3 py-1 rounded-full ${getActivityClass(activity.type)}`}>
                      {getActivityLabel(activity.type)}
                    </span>

                    <h3 className="font-semibold mt-3">
                      {activity.title}
                    </h3>

                    <p className="text-zinc-500 mt-1">
                      {activity.description}
                    </p>
                  </div>

                  <p className="text-sm text-zinc-400 whitespace-nowrap">
                    {activity.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}