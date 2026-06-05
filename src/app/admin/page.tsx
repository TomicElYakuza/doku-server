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
    adminModules?: number;
    rolePermissionTemplates?: number;
  };
  responseTimeMs: number;
  checkedAt: string;
  message?: string;
};

function getSafeHref(value?: string) {
  const href = String(value || "").trim();

  if (!href) {
    return "/admin";
  }

  if (!href.startsWith("/")) {
    return `/${href}`;
  }

  return href;
}

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

function getListViewLabel(view?: string) {
  if (view === "cards") {
    return "Karten";
  }

  return "Tabelle";
}

function getSettingsValue(settings: AppSettings) {
  return {
    appName: settings.appName || "Intranet",
    companyName: settings.companyName || "Velunis",
    defaultUserRole:
      settings.defaultUserRole || "employee",
    defaultTicketView:
      settings.defaultTicketView || "table",
    defaultWikiView:
      settings.defaultWikiView || "table",
    hideClosedTicketsByDefault:
      settings.hideClosedTicketsByDefault ?? true,
  };
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
          adminModules: 0,
          rolePermissionTemplates: 0,
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

  const settingsValue = getSettingsValue(settings);

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

    if (module.key === "modules") {
      return `${health?.counts.adminModules ?? configuredModules.length} Module`;
    }

    if (module.key === "role-templates") {
      return `${health?.counts.rolePermissionTemplates ?? "—"} Vorlagen`;
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

  function getModuleAccent(
    module: AdminModuleConfig,
    enabled: boolean,
  ) {
    if (!enabled) {
      return "bg-zinc-100 text-zinc-500";
    }

    if (module.key === "users") {
      return "bg-blue-50 text-blue-700";
    }

    if (module.key === "permissions") {
      return "bg-red-50 text-red-700";
    }

    if (module.key === "companies") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (module.key === "taxonomy") {
      return "bg-indigo-50 text-indigo-700";
    }

    if (module.key === "database") {
      return health?.ok
        ? "bg-green-50 text-green-700"
        : "bg-orange-50 text-orange-700";
    }

    if (module.key === "news") {
      return "bg-orange-50 text-orange-700";
    }

    if (module.key === "ticket-templates") {
      return "bg-purple-50 text-purple-700";
    }

    if (module.key === "activity") {
      return "bg-sky-50 text-sky-700";
    }

    if (module.key === "settings") {
      return "bg-zinc-100 text-zinc-700";
    }

    if (module.key === "modules") {
      return "bg-violet-50 text-violet-700";
    }

    if (module.key === "role-templates") {
      return "bg-indigo-50 text-indigo-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  const modules: DashboardModule[] = useMemo(
    () =>
      configuredModules
        .filter((module) => module.isVisible)
        .map((module) => {
          const enabled = getModuleEnabled(module);

          return {
            key: module.key,
            title: module.title,
            description: module.description,
            href: getSafeHref(module.href),
            icon: module.icon || "",
            badge: getModuleBadge(module),
            accent: getModuleAccent(module, enabled),
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

  const enabledModuleCount = modules.filter((module) => module.enabled).length;
  const disabledModuleCount = modules.length - enabledModuleCount;

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Adminbereich"
        description="Du hast keine Berechtigung für das Admin Dashboard."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Admin Dashboard"
        description="Zentrale Verwaltung für Benutzer, Rechte, Module, Taxonomie, Einstellungen und Systemstatus."
        badges={[
          {
            label: `${enabledModuleCount} Module aktiv`,
          },
          {
            label: `${disabledModuleCount} deaktiviert`,
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
          label="Benutzer"
          value={users.length}
          description={`${activeUsers.length} aktiv`}
          icon="👥"
          tone="blue"
        />
        <StatCard
          label="Administratoren"
          value={adminUsers.length}
          description={`${departmentLeadUsers.length} Abteilungsleiter`}
          icon="🛡️"
          tone="indigo"
        />
        <StatCard
          label="Offene Tickets"
          value={openTickets.length}
          description={`${urgentTickets.length} hoch / dringend`}
          icon="🎫"
          tone="orange"
        />
        <StatCard
          label="Admin-Module"
          value={modules.length}
          description={`${enabledModuleCount} aktiv`}
          icon="🧩"
          tone="purple"
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
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Module verwalten
          </Link>
        </div>

        {modules.length === 0 && (
          <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
            <h3 className="font-semibold">
              Keine sichtbaren Admin-Module vorhanden.
            </h3>
            <p className="text-zinc-500 mt-2">
              Lege Module über die Admin-Modulverwaltung an.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((module) => (
            <Link
              key={module.key}
              href={module.href}
              className={`group border rounded-3xl p-6 transition shadow-sm ${
                module.enabled
                  ? "bg-white border-zinc-200 hover:border-indigo-200 hover:shadow-md"
                  : "bg-zinc-50 border-zinc-200 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg ${module.accent}`}
                >
                  {module.icon || "⚙️"}
                </span>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">
                    {module.badge}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      module.enabled
                        ? "bg-green-50 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {module.statusLabel}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-5 group-hover:text-indigo-700 transition">
                {module.title}
              </h3>
              <p className="text-zinc-500 mt-2 line-clamp-2">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
          <div className="flex items-start justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Standardwerte
              </h2>
              <p className="text-zinc-500 mt-1">
                Aktuelle Defaults aus den Systemeinstellungen.
              </p>
            </div>

            <Link
              href="/admin/settings"
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Bearbeiten
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Standardrolle
              </p>
              <p className="font-bold mt-2">
                {appSettingsRepository.getDefaultUserRoleLabel(
                  settingsValue.defaultUserRole,
                )}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Ticket-Ansicht
              </p>
              <p className="font-bold mt-2">
                {getListViewLabel(settingsValue.defaultTicketView)}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Wiki-Ansicht
              </p>
              <p className="font-bold mt-2">
                {getListViewLabel(settingsValue.defaultWikiView)}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5">
              <p className="text-sm text-zinc-500">
                Geschlossene Tickets
              </p>
              <p className="font-bold mt-2">
                {settingsValue.hideClosedTicketsByDefault
                  ? "Standardmäßig ausblenden"
                  : "Standardmäßig anzeigen"}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Systemübersicht
              </h2>
              <p className="text-zinc-500 mt-1">
                Statusbereich ohne sensible Daten.
              </p>
            </div>

            <span
              className={`text-xs px-3 py-1 rounded-full ${getHealthStatusClass(
                health,
              )}`}
            >
              {healthLoading
                ? "Prüft..."
                : getHealthStatusLabel(health)}
            </span>
          </div>

          <div className="space-y-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                App
              </p>
              <p className="font-bold mt-1">
                {settingsValue.appName}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Firma
              </p>
              <p className="font-bold mt-1">
                {settingsValue.companyName}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Datenquelle
              </p>
              <p className="font-bold mt-1">
                PostgreSQL/API
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Datenbank
              </p>
              <p className="font-bold mt-1">
                {health?.database.connected
                  ? "Verbunden"
                  : "Nicht verbunden"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Antwortzeit
              </p>
              <p className="font-bold mt-1">
                {health?.responseTimeMs ?? 0} ms
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Letzte Prüfung
              </p>
              <p className="font-bold mt-1">
                {health?.checkedAt
                  ? new Date(health.checkedAt).toLocaleString("de-AT")
                  : "-"}
              </p>
            </div>

            {health?.message && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-sm text-red-700">
                  {health.message}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Datenbestand
          </h2>

          <div className="space-y-3 mt-6">
            {[
              [
                "Benutzer",
                health?.counts.users ?? users.length,
              ],
              [
                "Firmen",
                health?.counts.companies ?? companies.length,
              ],
              [
                "Abteilungen",
                health?.counts.departments ?? departments.length,
              ],
              [
                "Tickets",
                health?.counts.tickets ?? tickets.length,
              ],
              [
                "Wiki-Seiten",
                health?.counts.wikiPages ?? wikiPages.length,
              ],
              [
                "News",
                health?.counts.newsPosts ?? news.length,
              ],
              [
                "Taxonomie",
                health?.counts.taxonomyItems ?? "—",
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-zinc-500">
                  {label}
                </span>
                <span className="font-bold">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Feature-Schalter
          </h2>

          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Ticket-Kommentare
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  ticketCommentsEnabled
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {ticketCommentsEnabled ? "Aktiv" : "Aus"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Ticket-Vorlagen
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  ticketTemplatesEnabled
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {ticketTemplatesEnabled ? "Aktiv" : "Aus"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">
                Aktivitätsprotokoll
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
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
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Schalter bearbeiten
          </Link>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Schnellzugriff
          </h2>

          <div className="space-y-3 mt-6">
            <Link
              href="/admin/modules"
              className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-medium"
            >
              Admin-Module verwalten
            </Link>

            <Link
              href="/admin/taxonomy"
              className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-medium"
            >
              Kategorien & Tags verwalten
            </Link>

            <Link
              href="/admin/users"
              className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-medium"
            >
              Benutzer verwalten
            </Link>

            <Link
              href="/admin/database"
              className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-medium"
            >
              Datenbankstatus öffnen
            </Link>

            <Link
              href="/admin/settings"
              className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-medium"
            >
              Systemeinstellungen öffnen
            </Link>
          </div>
        </section>
      </div>

      {pinnedNews.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Fixierte News
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {pinnedNews.slice(0, 4).map((post) => (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
              >
                <h3 className="font-bold line-clamp-2">
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
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
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
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Alle öffnen
            </Link>
          </div>

          {latestActivities.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Aktivitäten vorhanden.
            </p>
          )}

          <div className="space-y-3">
            {latestActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-zinc-100 rounded-2xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getActivityClass(
                        activity.type,
                      )}`}
                    >
                      {getActivityLabel(activity.type)}
                    </span>
                    <h3 className="font-bold mt-3">
                      {activity.title}
                    </h3>
                    <p className="text-zinc-500 mt-1">
                      {activity.description}
                    </p>
                  </div>

                  <span className="text-sm text-zinc-400 shrink-0">
                    {activity.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}