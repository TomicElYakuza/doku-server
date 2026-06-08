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
  adminModuleRepository,
} from "../../lib/adminModuleRepository";
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
import type {
  AdminModuleConfig,
} from "../../types/adminModule";

type DashboardModule = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  badge: string;
  accent: string;
  enabled: boolean;
  statusLabel: string;
  sortOrder: number;
};

type AdminHealth = {
  ok: boolean;
  status: string;
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

function getListViewLabel(view: string) {
  if (view === "cards") {
    return "Karten";
  }

  return "Tabelle";
}

function getModuleFallbackIcon(key: string) {
  if (key === "users") {
    return "👥";
  }

  if (key === "permissions") {
    return "🔐";
  }

  if (key === "companies") {
    return "🏢";
  }

  if (key === "taxonomy") {
    return "🗂️";
  }

  if (key === "database") {
    return "🧬";
  }

  if (key === "news") {
    return "📰";
  }

  if (key === "ticket-templates") {
    return "🧩";
  }

  if (key === "activity") {
    return "📊";
  }

  if (key === "settings") {
    return "⚙️";
  }

  if (key === "modules") {
    return "🧭";
  }

  return "✨";
}

function getModuleAccent(
  module: AdminModuleConfig,
  enabled: boolean,
  health: AdminHealth | null,
) {
  if (!enabled) {
    return "bg-zinc-100 text-zinc-500 border-zinc-200";
  }

  if (module.key === "users") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (module.key === "permissions") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (module.key === "companies") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (module.key === "taxonomy") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (module.key === "database") {
    return health?.ok
      ? "bg-green-50 text-green-700 border-green-100"
      : "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (module.key === "news") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (module.key === "ticket-templates") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (module.key === "activity") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }

  if (module.key === "settings") {
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }

  if (module.key === "modules") {
    return "bg-violet-50 text-violet-700 border-violet-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

export default function AdminPage() {
  const {
    activityLogEnabled,
    ticketTemplatesEnabled,
    ticketCommentsEnabled,
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
  const [configuredModules, setConfiguredModules] = useState<AdminModuleConfig[]>([]);
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

    function handleAdminModulesUpdated() {
      void loadData();
    }

    window.addEventListener(
      "adminModulesUpdated",
      handleAdminModulesUpdated,
    );

    return () => {
      window.removeEventListener(
        "adminModulesUpdated",
        handleAdminModulesUpdated,
      );
    };
  }, []);

  async function loadHealth() {
    try {
      setHealthLoading(true);

      const response = await fetch("/api/admin/health", {
        cache: "no-store",
      });

      const data = (await response.json()) as AdminHealth;

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
        message:
          loadError instanceof Error
            ? loadError.message
            : "Health-Check fehlgeschlagen.",
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
        nextModules,
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
        adminModuleRepository.list(),
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
      setConfiguredModules(Array.isArray(nextModules) ? nextModules : []);
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

  function getModuleBadge(module: AdminModuleConfig) {
    if (module.key === "users") {
      return `${users.length} Benutzer`;
    }

    if (module.key === "companies") {
      return `${companies.length}/${departments.length}`;
    }

    if (module.key === "taxonomy") {
      return `${health?.counts.taxonomyItems ?? "—"} Einträge`;
    }

    if (module.key === "database") {
      return health?.ok ? "Online" : "Prüfen";
    }

    if (module.key === "news") {
      return `${news.length} Beiträge`;
    }

    if (module.key === "ticket-templates") {
      return `${templates.length} Vorlagen`;
    }

    if (module.key === "activity") {
      return `${activities.length} Einträge`;
    }

    return module.badgeLabel || "Modul";
  }

  function getModuleEnabled(module: AdminModuleConfig) {
    if (!module.isEnabled) {
      return false;
    }

    if (module.key === "ticket-templates") {
      return ticketTemplatesEnabled;
    }

    if (module.key === "activity") {
      return activityLogEnabled;
    }

    return true;
  }

  const modules = useMemo<DashboardModule[]>(
    () =>
      configuredModules
        .filter((module) => module.isVisible)
        .map((module) => {
          const enabled = getModuleEnabled(module);

          return {
            key: module.key,
            title: module.title,
            description: module.description,
            href: module.href,
            icon: module.icon || getModuleFallbackIcon(module.key),
            badge: getModuleBadge(module),
            accent: getModuleAccent(module, enabled, health),
            enabled,
            statusLabel: enabled ? "Aktiv" : "Deaktiviert",
            sortOrder: module.sortOrder,
          };
        })
        .sort((first, second) => first.sortOrder - second.sortOrder),
    [
      configuredModules,
      users.length,
      companies.length,
      departments.length,
      news.length,
      templates.length,
      activities.length,
      ticketTemplatesEnabled,
      activityLogEnabled,
      health,
    ],
  );

  const enabledModuleCount =
    modules.filter((module) => module.enabled).length;

  const disabledModuleCount =
    modules.length - enabledModuleCount;

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Admin Dashboard"
        description="Du hast keine Berechtigung für den Adminbereich."
        backHref="/dashboard"
        backLabel="Zum Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis Admin"
        title="Admin Dashboard"
        description="Zentrale Steuerung für Benutzer, Organisation, Taxonomie, Module, Systemwerte und Datenbankstatus."
        badges={[
          {
            label: `${enabledModuleCount} Module aktiv`,
          },
          {
            label: `${disabledModuleCount} deaktiviert`,
          },
          {
            label: `Datenbank: ${getHealthStatusLabel(health)}`,
          },
          {
            label: `${users.length} Benutzer`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadData()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
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
          label="Benutzer aktiv"
          value={activeUsers.length}
          description={`${users.length} insgesamt`}
          icon="👥"
          tone="blue"
        />

        <StatCard
          label="Offene Tickets"
          value={openTickets.length}
          description={`${urgentTickets.length} hoch/dringend`}
          icon="🎫"
          tone="orange"
        />

        <StatCard
          label="Wissen & News"
          value={wikiPages.length + news.length}
          description={`${wikiPages.length} Wiki · ${news.length} News`}
          icon="📚"
          tone="indigo"
        />

        <StatCard
          label="Systemstatus"
          value={getHealthStatusLabel(health)}
          description={healthLoading ? "Prüfung läuft" : `${health?.responseTimeMs ?? 0} ms`}
          icon="🧬"
          tone={health?.ok ? "green" : "red"}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Admin-Module
            </h2>
            <p className="text-zinc-500 mt-1">
              Zentrale Verwaltungsbereiche aus der Datenbank-Konfiguration.
            </p>
          </div>

          <Link
            href="/admin/modules"
            className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
          >
            Module verwalten
          </Link>
        </div>

        {modules.length === 0 && (
          <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
            <h3 className="font-bold">
              Keine sichtbaren Admin-Module vorhanden.
            </h3>
            <p className="text-zinc-500 mt-2">
              Aktiviere Module in der Modulverwaltung.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((module) => (
            <Link
              key={module.key}
              href={module.enabled ? module.href : "/admin/modules"}
              className={`group relative overflow-hidden border rounded-3xl p-5 transition ${
                module.enabled
                  ? "bg-white border-zinc-200 hover:border-indigo-200 hover:shadow-md"
                  : "bg-zinc-50 border-zinc-200 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full app-accent-bg opacity-10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div
                  className={`h-12 w-12 rounded-2xl border flex items-center justify-center text-xl ${module.accent}`}
                >
                  {module.icon}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                    {module.badge}
                  </span>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      module.enabled
                        ? "bg-green-50 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {module.statusLabel}
                  </span>
                </div>
              </div>

              <div className="relative mt-5">
                <h3 className="text-xl font-black group-hover:app-accent-text transition">
                  {module.title}
                </h3>
                <p className="text-zinc-500 mt-2 line-clamp-2">
                  {module.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Systemübersicht
              </h2>
              <p className="text-zinc-500 mt-1">
                Statusbereich ohne sensible Daten wie Datenbank-Passwörter.
              </p>
            </div>

            <span
              className={`text-sm px-4 py-2 rounded-full font-bold ${getHealthStatusClass(
                health,
              )}`}
            >
              {getHealthStatusLabel(health)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                App
              </p>
              <p className="font-black mt-2">
                {settings.appName || "Intranet"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Firma
              </p>
              <p className="font-black mt-2">
                {settings.companyName || "Velunis"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Datenquelle
              </p>
              <p className="font-black mt-2">
                PostgreSQL/API
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Datenbank
              </p>
              <p className="font-black mt-2">
                {health?.database.connected ? "Verbunden" : "Nicht verbunden"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Antwortzeit
              </p>
              <p className="font-black mt-2">
                {health?.responseTimeMs ?? 0} ms
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5 md:col-span-2">
              <p className="text-sm text-zinc-500">
                Letzte Prüfung
              </p>
              <p className="font-black mt-2">
                {health?.checkedAt
                  ? new Date(health.checkedAt).toLocaleString("de-AT")
                  : "-"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Version
              </p>
              <p className="font-black mt-2">
                {settings.appVersion || settings.version || "0.1.0"}
              </p>
            </div>
          </div>

          {health?.message && (
            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-3xl p-5 text-amber-800">
              {health.message}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Standardwerte
              </h2>
              <p className="text-zinc-500 mt-1">
                Aktuelle Defaults aus den Systemeinstellungen.
              </p>

              <div className="space-y-4 mt-6">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Standardrolle
                  </p>
                  <p className="font-black mt-1">
                    {appSettingsRepository.getDefaultUserRoleLabel(
                      settings.defaultUserRole || "employee",
                    )}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Ticket-Ansicht
                  </p>
                  <p className="font-black mt-1">
                    {getListViewLabel(settings.defaultTicketView || "table")}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Wiki-Ansicht
                  </p>
                  <p className="font-black mt-1">
                    {getListViewLabel(settings.defaultWikiView || "table")}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Geschlossene Tickets
                  </p>
                  <p className="font-black mt-1">
                    {settings.hideClosedTicketsByDefault
                      ? "Standardmäßig ausblenden"
                      : "Standardmäßig anzeigen"}
                  </p>
                </div>
              </div>

              <Link
                href="/admin/settings"
                className="block mt-6 text-center app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
              >
                Systemeinstellungen öffnen
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Datenbestand
          </h2>
          <p className="text-zinc-500 mt-1">
            Zentrale Objektzahlen aus der Datenbank.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Benutzer
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.users ?? users.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Firmen
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.companies ?? companies.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Abteilungen
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.departments ?? departments.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Tickets
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.tickets ?? tickets.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Wiki-Seiten
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.wikiPages ?? wikiPages.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-sm text-zinc-500">
                Taxonomie
              </p>
              <p className="text-2xl font-black mt-1">
                {health?.counts.taxonomyItems ?? "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Feature-Schalter
          </h2>
          <p className="text-zinc-500 mt-1">
            Aktuelle Modulzustände aus den Systemeinstellungen.
          </p>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-4">
              <span className="font-bold">
                Ticket-Kommentare
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  ticketCommentsEnabled
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {ticketCommentsEnabled ? "Aktiv" : "Aus"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-4">
              <span className="font-bold">
                Ticket-Vorlagen
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  ticketTemplatesEnabled
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {ticketTemplatesEnabled ? "Aktiv" : "Aus"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-4">
              <span className="font-bold">
                Aktivitätsprotokoll
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  activityLogEnabled
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {activityLogEnabled ? "Aktiv" : "Aus"}
              </span>
            </div>
          </div>

          <Link
            href="/admin/settings"
            className="block mt-6 text-center bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition font-bold"
          >
            Schalter bearbeiten
          </Link>
        </section>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold">
          Schnellzugriff
        </h2>
        <p className="text-zinc-500 mt-1">
          Häufig genutzte Admin-Bereiche.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <Link
            href="/admin/modules"
            className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
          >
            <p className="text-2xl">
              🧭
            </p>
            <h3 className="font-black mt-3">
              Module
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Admin-Module verwalten
            </p>
          </Link>

          <Link
            href="/admin/taxonomy"
            className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
          >
            <p className="text-2xl">
              🗂️
            </p>
            <h3 className="font-black mt-3">
              Kategorien & Tags
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Taxonomie verwalten
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
          >
            <p className="text-2xl">
              👥
            </p>
            <h3 className="font-black mt-3">
              Benutzer
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Konten verwalten
            </p>
          </Link>

          <Link
            href="/admin/database"
            className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
          >
            <p className="text-2xl">
              🧬
            </p>
            <h3 className="font-black mt-3">
              Datenbank
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Status prüfen
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
          >
            <p className="text-2xl">
              ⚙️
            </p>
            <h3 className="font-black mt-3">
              Systemeinstellungen
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Defaults ändern
            </p>
          </Link>
        </div>
      </section>

      {pinnedNews.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Fixierte News
          </h2>
          <p className="text-zinc-500 mt-1">
            Aktuell priorisierte interne Meldungen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {pinnedNews.slice(0, 4).map((post) => (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
              >
                <h3 className="font-black line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-3">
                  {post.createdAt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activityLogEnabled && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Letzte Aktivitäten
              </h2>
              <p className="text-zinc-500 mt-1">
                Kurzer Systemauszug der letzten Aktionen.
              </p>
            </div>

            <Link
              href="/activity"
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
            >
              Alle öffnen
            </Link>
          </div>

          {latestActivities.length === 0 && (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center mt-6">
              <p className="text-zinc-500">
                Noch keine Aktivitäten vorhanden.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            {latestActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    {getActivityLabel(activity.type)}
                  </span>

                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    {activity.entityType || "System"}
                  </span>
                </div>

                <h3 className="font-black mt-3 line-clamp-1">
                  {activity.title}
                </h3>

                <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                  {activity.description || "Keine Beschreibung vorhanden."}
                </p>

                <p className="text-xs text-zinc-400 mt-3">
                  {activity.createdAt}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}