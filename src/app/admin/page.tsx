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

type AdminCard = {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: string;
};

type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
};

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

  const cards: AdminCard[] = [
    {
      title:
        "News",

      value:
        newsCount,

      description:
        "Interne Meldungen und Ankündigungen",

      href:
        "/admin/news",

      icon:
        "◌",
    },
    {
      title:
        "Ungelesene News",

      value:
        unreadNewsCount,

      description:
        "Für aktuellen Benutzer noch nicht geöffnet",

      href:
        "/",

      icon:
        "●",
    },
    {
      title:
        "Tickets",

      value:
        ticketCount,

      description:
        "Alle Vorgänge im System",

      href:
        "/tickets",

      icon:
        "◆",
    },
    {
      title:
        "Offene Tickets",

      value:
        openTicketCount,

      description:
        "Noch nicht bearbeitete Tickets",

      href:
        "/tickets",

      icon:
        "◇",
    },
    {
      title:
        "Wiki-Dokumente",

      value:
        wikiCount,

      description:
        "Interne Dokumentationen",

      href:
        "/wiki",

      icon:
        "◫",
    },
    {
      title:
        "Benutzer",

      value:
        userCount,

      description:
        "Lokale Benutzerverwaltung",

      href:
        "/admin/users",

      icon:
        "◉",
    },
    {
      title:
        "Firmen",

      value:
        companyCount,

      description:
        "Organisationen / Mandanten",

      href:
        "/admin/companies",

      icon:
        "▦",
    },
    {
      title:
        "Abteilungen",

      value:
        departmentCount,

      description:
        "Interne Bereiche und Teams",

      href:
        "/admin/companies",

      icon:
        "▥",
    },
    {
      title:
        "Dateien",

      value:
        fileCount,

      description:
        "Anhänge und Uploads",

      href:
        "/admin/storage",

      icon:
        "▣",
    },
    {
      title:
        "Aktivitäten",

      value:
        activityCount,

      description:
        "Protokollierte Systemaktionen",

      href:
        "/activity",

      icon:
        "≡",
    },
  ];

  const modules: AdminModule[] = [
    {
      title:
        "News verwalten",

      description:
        "Interne Meldungen erstellen, bearbeiten, löschen, fixieren und mit Anhängen versehen.",

      href:
        "/admin/news",

      icon:
        "◌",

      badge:
        "Neu",
    },
    {
      title:
        "Benutzerverwaltung",

      description:
        "Benutzer, Rollen, Firmen- und Abteilungszuordnung verwalten.",

      href:
        "/admin/users",

      icon:
        "◉",
    },
    {
      title:
        "Firmen & Abteilungen",

      description:
        "Organisationen, Firmen, Standorte und interne Abteilungen vorbereiten.",

      href:
        "/admin/companies",

      icon:
        "▦",
    },
    {
      title:
        "Speicher",

      description:
        "Dateien, Anhänge und gespeicherte Uploads prüfen.",

      href:
        "/admin/storage",

      icon:
        "▣",
    },
    {
      title:
        "Adapter",

      description:
        "Vorbereitung für spätere Integrationen, Schnittstellen und Datenquellen.",

      href:
        "/admin/adapters",

      icon:
        "⇄",
    },
    {
      title:
        "Datenbank",

      description:
        "Status, Readiness und spätere Datenbank-Anbindung vorbereiten.",

      href:
        "/admin/database",

      icon:
        "◍",
    },
    {
      title:
        "Benachrichtigungen",

      description:
        "Systemmeldungen und spätere Notification-Regeln verwalten.",

      href:
        "/admin/notifications",

      icon:
        "●",
    },
    {
      title:
        "Einstellungen",

      description:
        "Design, Darstellung, Features und Systemverhalten konfigurieren.",

      href:
        "/settings",

      icon:
        "◎",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <div>
          <p className="text-sm text-zinc-500">
            Verwaltung
          </p>

          <h1 className="text-4xl font-bold mt-2">
            Admin-Dashboard
          </h1>

          <p className="text-zinc-500 mt-2">
            Zentrale Verwaltung für News, Benutzer, Firmen, Dateien, Tickets, Aktivitäten und spätere Datenbank-Anbindung
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
            href="/admin/users"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzer öffnen
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
          Systemübersicht
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {cards.map(
            (card) => (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:bg-zinc-50 transition min-h-[120px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">
                      {card.title}
                    </p>

                    <h2
                      className={`text-3xl font-bold mt-3 ${
                        card.title === "Ungelesene News" &&
                        card.value > 0
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {card.value}
                    </h2>
                  </div>

                  <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                    {card.icon}
                  </div>
                </div>

                <p className="text-sm text-zinc-500 mt-3">
                  {card.description}
                </p>
              </Link>
            )
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Verwaltungsbereiche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {modules.map(
            (module) => (
              <Link
                key={module.href}
                href={module.href}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg">
                    {module.icon}
                  </div>

                  {module.badge && (
                    <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
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
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Datenbank- und Produktivbetrieb
        </h2>

        <p className="text-zinc-500 mt-2">
          Die wichtigsten Bereiche sind bereits über eigene Storage-/Repository-Schichten vorbereitet. Für den Produktivbetrieb können diese später schrittweise durch API-Routen, Datenbanktabellen und echte Sessions ersetzt werden.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              News Repository
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              News nutzt bereits einen Repository-Layer für spätere API-/DB-Anbindung.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Benutzer & Rollen
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Lokaler Login ist vorbereitet und kann später durch echte Authentifizierung ersetzt werden.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Dateien & Anhänge
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Uploads laufen aktuell lokal und können später auf Server- oder Cloud-Speicher umgestellt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}