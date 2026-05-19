"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canViewAdmin,
} from "../../lib/permissions";

import {
  getAdminUsers,
} from "../../lib/adminUserStorage";

import {
  getCompanies,
  getDepartments,
} from "../../lib/companyStorage";

import {
  getTickets,
} from "../../lib/ticketStorage";

import {
  getActivities,
} from "../../lib/activityStorage";

import {
  getNotifications,
} from "../../lib/notificationHelpers";

import {
  formatStorageSize,
  getStorageInfo,
  getTotalStorageSize,
} from "../../lib/storageManager";

import {
  getAllDataAdapterMeta,
  getLocalStorageAdapterCount,
} from "../../lib/dataAdapterRegistry";

import {
  useAppSettings,
} from "../../hooks/useAppSettings";

import AccessDeniedCard from "../../components/AccessDeniedCard";

type AdminCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  value: string | number;
  meta: string;
};

export default function AdminPage() {
  const {
    mounted: settingsMounted,
    enableActivityLog,
    enableTicketTemplates,
    enableTicketComments,
  } = useAppSettings();

  const [mounted, setMounted] =
    useState(false);

  const [userCount, setUserCount] =
    useState(0);

  const [companyCount, setCompanyCount] =
    useState(0);

  const [departmentCount, setDepartmentCount] =
    useState(0);

  const [ticketCount, setTicketCount] =
    useState(0);

  const [activityCount, setActivityCount] =
    useState(0);

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [storageAreaCount, setStorageAreaCount] =
    useState(0);

  const [storageSize, setStorageSize] =
    useState(0);

  const [adapterCount, setAdapterCount] =
    useState(0);

  const [localStorageAdapterCount, setLocalStorageAdapterCount] =
    useState(0);

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleUpdate() {
      loadData();
    }

    window.addEventListener(
      "adminUsersUpdated",
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
      "ticketsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "activityUpdated",
      handleUpdate
    );

    window.addEventListener(
      "notificationsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "storageManagerUpdated",
      handleUpdate
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "adminUsersUpdated",
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
        "ticketsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "activityUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "notificationsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "storageManagerUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleUpdate
      );
    };
  }, []);

  function loadData() {
    setUserCount(
      getAdminUsers().length
    );

    setCompanyCount(
      getCompanies().length
    );

    setDepartmentCount(
      getDepartments().length
    );

    setTicketCount(
      getTickets().length
    );

    setActivityCount(
      getActivities().length
    );

    setNotificationCount(
      getNotifications().length
    );

    setStorageAreaCount(
      getStorageInfo().filter(
        (item) =>
          item.exists
      ).length
    );

    setStorageSize(
      getTotalStorageSize()
    );

    setAdapterCount(
      getAllDataAdapterMeta().length
    );

    setLocalStorageAdapterCount(
      getLocalStorageAdapterCount()
    );
  }

  if (!mounted || !settingsMounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        description="Du hast mit deiner aktuellen Rolle keine Berechtigung für das Admin-Dashboard."
      />
    );
  }

  const cards: AdminCard[] = [
    {
      title:
        "Benutzer",

      description:
        "Benutzer, Rollen, Status, Firmen und Abteilungen verwalten.",

      href:
        "/admin/users",

      icon:
        "◉",

      value:
        userCount,

      meta:
        "Benutzer im System",
    },

    {
      title:
        "Firmen & Abteilungen",

      description:
        "Organisationsstruktur für spätere Datenbank und Rechteverwaltung.",

      href:
        "/admin/companies",

      icon:
        "▦",

      value:
        companyCount,

      meta:
        `${departmentCount} Abteilungen`,
    },

    {
      title:
        "Speicher",

      description:
        "Lokale Browser-Daten exportieren, importieren und bereinigen.",

      href:
        "/admin/storage",

      icon:
        "▣",

      value:
        storageAreaCount,

      meta:
        formatStorageSize(
          storageSize
        ),
    },

    {
      title:
        "Daten-Adapter",

      description:
        "Vorbereitete Datenschicht für LocalStorage, spätere API und Datenbank.",

      href:
        "/admin/adapters",

      icon:
        "⇄",

      value:
        adapterCount,

      meta:
        `${localStorageAdapterCount} LocalStorage`,
    },

    {
      title:
        "Datenbank",

      description:
        "Readiness-Check für spätere API- und Datenbank-Anbindung.",

      href:
        "/admin/database",

      icon:
        "◍",

      value:
        "Ready",

      meta:
        "Vorbereitung",
    },

    {
      title:
        "Benachrichtigungen",

      description:
        "Gespeicherte Systemmeldungen und Toasts anzeigen und verwalten.",

      href:
        "/admin/notifications",

      icon:
        "●",

      value:
        notificationCount,

      meta:
        "Meldungen",
    },

    {
      title:
        "Einstellungen",

      description:
        "App-Name, Theme, Dark Mode, Feature-Schalter und Standardwerte.",

      href:
        "/settings",

      icon:
        "◎",

      value:
        "System",

      meta:
        "Konfiguration",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          admin
        </span>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Admin-Dashboard
          </h1>

          <p className="text-zinc-500 mt-2">
            Verwaltung, Systemstatus, lokale Daten und Vorbereitung für echte Datenbank-Anbindung
          </p>
        </div>

        <Link
          href="/settings"
          className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Einstellungen
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {ticketCount}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Support & Aufgaben
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Aktivitäten
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {enableActivityLog
              ? activityCount
              : "Aus"}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Audit-Log
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Ticket-Vorlagen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {enableTicketTemplates
              ? "Aktiv"
              : "Aus"}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Feature-Schalter
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Kommentare
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {enableTicketComments
              ? "Aktiv"
              : "Aus"}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Ticket-Kommentare
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-7 gap-6">
        {cards.map(
          (card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition group"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl group-hover:bg-zinc-900 group-hover:text-white transition">
                  {card.icon}
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {card.value}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {card.meta}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mt-6">
                {card.title}
              </h2>

              <p className="text-zinc-500 mt-2 leading-relaxed">
                {card.description}
              </p>
            </Link>
          )
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Nächste technische Schritte
        </h2>

        <p className="text-zinc-500 mt-2">
          Die App ist jetzt stärker modularisiert. Lokaler Speicher, Settings, Feature-Flags, Aktivitäten, Benachrichtigungen und Daten-Adapter sind vorbereitet, damit später eine echte Datenbank und ein echtes Benutzersystem angebunden werden können.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Datenbank
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Storage-Funktionen später durch API/DB ersetzen.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Authentifizierung
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Demo-Rollen später durch echte Sessions ersetzen.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              Adapter-Schicht
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Seiten später systematisch von Storage auf Adapter umstellen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}