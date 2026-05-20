"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canViewAdmin,
  getCurrentUser,
  getRoleLabel,
} from "../../lib/permissions";

import {
  getTickets,
} from "../../lib/ticketStorage";

import {
  getStoredPages,
} from "../../lib/wikiStorage";

import {
  getActivities,
} from "../../lib/activityStorage";

import {
  getCompanies,
  getDepartments,
} from "../../lib/companyStorage";

import {
  getAdminUsers,
} from "../../lib/adminUserStorage";

import {
  getNewsPosts,
  getOpenedNewsPostIds,
} from "../../lib/newsStorage";

import {
  getFiles,
} from "../../lib/fileStorage";

import AccessDeniedCard from "../../components/AccessDeniedCard";

type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  status: "ready" | "progress" | "planned";
  primary?: boolean;
};

type AdminMetric = {
  label: string;
  value: number;
  description: string;
  href: string;
};

function getStatusLabel(
  status: AdminModule["status"]
) {
  if (status === "ready") {
    return "Verfügbar";
  }

  if (status === "progress") {
    return "In Arbeit";
  }

  return "Geplant";
}

function getStatusClass(
  status: AdminModule["status"]
) {
  if (status === "ready") {
    return "bg-green-50 text-green-700";
  }

  if (status === "progress") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

export default function AdminPage() {
  const [mounted, setMounted] =
    useState(false);

  const [ticketCount, setTicketCount] =
    useState(0);

  const [openTicketCount, setOpenTicketCount] =
    useState(0);

  const [wikiCount, setWikiCount] =
    useState(0);

  const [activityCount, setActivityCount] =
    useState(0);

  const [companyCount, setCompanyCount] =
    useState(0);

  const [departmentCount, setDepartmentCount] =
    useState(0);

  const [userCount, setUserCount] =
    useState(0);

  const [newsCount, setNewsCount] =
    useState(0);

  const [unreadNewsCount, setUnreadNewsCount] =
    useState(0);

  const [fileCount, setFileCount] =
    useState(0);

  useEffect(() => {
    setMounted(true);

    loadAdminData();

    function handleUpdate() {
      loadAdminData();
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
      "adminUsersUpdated",
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

    window.addEventListener(
      "filesUpdated",
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
        "adminUsersUpdated",
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

      window.removeEventListener(
        "filesUpdated",
        handleUpdate
      );
    };
  }, []);

  function loadAdminData() {
    const tickets =
      getTickets();

    const news =
      getNewsPosts();

    const openedNewsIds =
      getOpenedNewsPostIds();

    setTicketCount(
      tickets.length
    );

    setOpenTicketCount(
      tickets.filter(
        (ticket) =>
          ticket.status === "open"
      ).length
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

    setUserCount(
      getAdminUsers().length
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

    setFileCount(
      getFiles().length
    );
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  const user =
    getCurrentUser();

  const modules: AdminModule[] = [
    {
      title:
        "News verwalten",

      description:
        "Meldungen erstellen, bearbeiten, löschen, fixieren, durchsuchen und mit Anhängen versehen.",

      href:
        "/admin/news",

      icon:
        "◌",

      status:
        "ready",

      primary:
        true,
    },
    {
      title:
        "Benutzer & Rollen",

      description:
        "Benutzer, Rollen, Firmen, Abteilungen und lokale Login-Daten verwalten.",

      href:
        "/admin/users",

      icon:
        "◉",

      status:
        "ready",

      primary:
        true,
    },
    {
      title:
        "Firmen & Abteilungen",

      description:
        "Organisationen, Firmen, Standorte und Abteilungen zentral konfigurieren.",

      href:
        "/admin/companies",

      icon:
        "▦",

      status:
        "ready",

      primary:
        true,
    },
    {
      title:
        "Speicher & Dateien",

      description:
        "Uploads, Anhänge und gespeicherte Dateien prüfen und verwalten.",

      href:
        "/admin/storage",

      icon:
        "▣",

      status:
        "ready",
    },
    {
      title:
        "Ticket-Vorlagen",

      description:
        "Standardvorlagen für wiederkehrende Tickets und Supportfälle pflegen.",

      href:
        "/tickets/templates",

      icon:
        "◇",

      status:
        "ready",
    },
    {
      title:
        "System-Einstellungen",

      description:
        "Design, Darstellung, Features, Versionen und Intranet-Verhalten konfigurieren.",

      href:
        "/settings",

      icon:
        "◎",

      status:
        "ready",
    },
    {
      title:
        "Benachrichtigungen",

      description:
        "Systemmeldungen und spätere Notification-Regeln zentral vorbereiten.",

      href:
        "/admin/notifications",

      icon:
        "●",

      status:
        "progress",
    },
    {
      title:
        "Adapter & Schnittstellen",

      description:
        "Vorbereitung für externe Systeme, APIs, Importer und Datenquellen.",

      href:
        "/admin/adapters",

      icon:
        "⇄",

      status:
        "progress",
    },
    {
      title:
        "Datenbank",

      description:
        "Readiness, Migrationsstatus und spätere Datenbank-Anbindung prüfen.",

      href:
        "/admin/database",

      icon:
        "◍",

      status:
        "progress",
    },
    {
      title:
        "Aktivitäten & Audit",

      description:
        "Änderungen, Uploads, Benutzeraktionen und Systemereignisse nachvollziehen.",

      href:
        "/activity",

      icon:
        "≡",

      status:
        "ready",
    },
  ];

  const metrics: AdminMetric[] = [
    {
      label:
        "News",

      value:
        newsCount,

      description:
        "veröffentlichte Meldungen",

      href:
        "/admin/news",
    },
    {
      label:
        "Ungelesene News",

      value:
        unreadNewsCount,

      description:
        "für aktuellen Benutzer",

      href:
        "/",
    },
    {
      label:
        "Benutzer",

      value:
        userCount,

      description:
        "lokale Benutzerkonten",

      href:
        "/admin/users",
    },
    {
      label:
        "Firmen",

      value:
        companyCount,

      description:
        "Organisationen",

      href:
        "/admin/companies",
    },
    {
      label:
        "Abteilungen",

      value:
        departmentCount,

      description:
        "Teams und Bereiche",

      href:
        "/admin/companies",
    },
    {
      label:
        "Tickets",

      value:
        ticketCount,

      description:
        "Vorgänge gesamt",

      href:
        "/tickets",
    },
    {
      label:
        "Offene Tickets",

      value:
        openTicketCount,

      description:
        "noch offen",

      href:
        "/tickets",
    },
    {
      label:
        "Wiki-Seiten",

      value:
        wikiCount,

      description:
        "Dokumentationen",

      href:
        "/wiki",
    },
    {
      label:
        "Dateien",

      value:
        fileCount,

      description:
        "Uploads und Anhänge",

      href:
        "/admin/storage",
    },
    {
      label:
        "Aktivitäten",

      value:
        activityCount,

      description:
        "protokollierte Aktionen",

      href:
        "/activity",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <div>
          <p className="text-sm text-zinc-500">
            Backend-Verwaltung
          </p>

          <h1 className="text-4xl font-bold mt-2">
            Admin-Backend
          </h1>

          <p className="text-zinc-500 mt-2 max-w-3xl">
            Zentrale Oberfläche, über die Administratoren Inhalte, Benutzer, Firmen, Dateien, Tickets, Einstellungen und spätere Datenbank-/API-Anbindungen verwalten können.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/news"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            News verwalten
          </Link>

          <Link
            href="/settings"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Einstellungen
          </Link>

          <Link
            href="/dashboard"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Aktueller Admin-Kontext
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
              Berechtigung
            </p>

            <p className="font-semibold mt-1">
              Admin-Zugriff
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Verwaltungsbereiche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {modules.map(
            (module) => (
              <Link
                key={module.href}
                href={module.href}
                className={`bg-white border rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition ${
                  module.primary
                    ? "border-zinc-300"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg">
                    {module.icon}
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(module.status)}`}>
                    {getStatusLabel(
                      module.status
                    )}
                  </span>
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
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Systemübersicht
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map(
            (metric) => (
              <Link
                key={metric.label}
                href={metric.href}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:bg-zinc-50 transition"
              >
                <p className="text-sm text-zinc-500">
                  {metric.label}
                </p>

                <h2
                  className={`text-3xl font-bold mt-3 ${
                    metric.label === "Ungelesene News" &&
                    metric.value > 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {metric.value}
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  {metric.description}
                </p>
              </Link>
            )
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Ziel des Admin-Backends
        </h2>

        <p className="text-zinc-500 mt-3 leading-relaxed">
          Dieses Backend soll später alle wichtigen Konfigurations- und Verwaltungsaufgaben abdecken. Administratoren sollen Inhalte, Benutzer, Firmen, Rollen, Dateien, Einstellungen, Benachrichtigungen, Schnittstellen und Datenbankstatus direkt über diese Oberfläche steuern können, ohne Quellcode oder Datenbankeinträge manuell zu bearbeiten.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Inhaltspflege
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              News, Wiki, Tickets, Vorlagen und Anhänge sollen zentral verwaltbar sein.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Systemkonfiguration
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Design, Features, Benachrichtigungen und globale Einstellungen werden administrierbar.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Produktivbetrieb
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Repository-/Storage-Struktur ist vorbereitet, damit später Datenbank und API angebunden werden können.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}