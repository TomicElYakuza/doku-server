"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canViewAdmin,
  canManageUsers,
  canManageSystem,
  getCurrentUser,
  getRoleLabel,
} from "../../lib/permissions";

type AdminStat = {
  label: string;
  value: number;
  href: string;
};

const STORAGE_KEYS = {
  tickets: "dms_tickets",
  ticketTemplates: "dms_ticket_templates",
  ticketComments: "dms_ticket_comments",
  activities: "dms_activities",
  wikiPages: "dms_wiki_pages",
  trashPages: "dms_trash_pages",
  files: "dms_files",
  user: "dms_user",
};

export default function AdminPage() {
  const [mounted, setMounted] =
    useState(false);

  const [stats, setStats] =
    useState<AdminStat[]>([]);

  useEffect(() => {
    setMounted(true);

    loadStats();

    function handleUpdate() {
      loadStats();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleUpdate
    );

    window.addEventListener(
      "ticketCommentsUpdated",
      handleUpdate
    );

    window.addEventListener(
      "activityUpdated",
      handleUpdate
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleUpdate
    );

    window.addEventListener(
      "trashUpdated",
      handleUpdate
    );

    window.addEventListener(
      "userUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "ticketCommentsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "activityUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "trashUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "userUpdated",
        handleUpdate
      );
    };
  }, []);

  function getCountFromStorage(
    key: string
  ) {
    if (typeof window === "undefined") {
      return 0;
    }

    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return 0;
    }

    try {
      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.length;
      }

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return Object.values(parsed).reduce(
          (
            sum: number,
            value: any
          ) => {
            if (Array.isArray(value)) {
              return sum + value.length;
            }

            return sum + 1;
          },
          0
        );
      }

      return 1;
    } catch {
      return 0;
    }
  }

  function loadStats() {
    if (typeof window === "undefined") {
      return;
    }

    setStats([
      {
        label: "Wiki-Dokumente",
        value: getCountFromStorage(
          STORAGE_KEYS.wikiPages
        ),
        href: "/wiki",
      },
      {
        label: "Tickets",
        value: getCountFromStorage(
          STORAGE_KEYS.tickets
        ),
        href: "/tickets",
      },
      {
        label: "Ticket-Vorlagen",
        value: getCountFromStorage(
          STORAGE_KEYS.ticketTemplates
        ),
        href: "/tickets/templates",
      },
      {
        label: "Kommentare",
        value: getCountFromStorage(
          STORAGE_KEYS.ticketComments
        ),
        href: "/tickets",
      },
      {
        label: "Aktivitäten",
        value: getCountFromStorage(
          STORAGE_KEYS.activities
        ),
        href: "/activity",
      },
      {
        label: "Papierkorb",
        value: getCountFromStorage(
          STORAGE_KEYS.trashPages
        ),
        href: "/wiki/trash",
      },
      {
        label: "Dateien",
        value: getCountFromStorage(
          STORAGE_KEYS.files
        ),
        href: "/wiki",
      },
    ]);
  }

  function getStorageSize() {
    if (typeof window === "undefined") {
      return "0 KB";
    }

    let total =
      0;

    Object.values(
      STORAGE_KEYS
    ).forEach(
      (key) => {
        const value =
          localStorage.getItem(
            key
          );

        if (value) {
          total += value.length;
        }
      }
    );

    const kb =
      total / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  if (!mounted) {
    return null;
  }

  const user =
    getCurrentUser();

  if (!canViewAdmin()) {
    return (
      <div className="space-y-6 max-w-4xl">
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

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-6">
            🔒
          </div>

          <h1 className="text-4xl font-bold">
            Kein Zugriff
          </h1>

          <p className="text-zinc-500 mt-3">
            Du hast mit deiner aktuellen Rolle keine Berechtigung für das Admin-Dashboard.
          </p>

          <Link
            href="/setup"
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Rolle im Setup ändern
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* TOP NAV */}
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

      {/* BACK */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Admin-Dashboard
          </h1>

          <p className="text-zinc-500 mt-2">
            Zentrale Verwaltung für Benutzer, System, Daten und spätere Datenbank-Anbindung
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Link
            href="/settings"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Einstellungen
          </Link>

          <Link
            href="/setup"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer Setup
          </Link>
        </div>
      </div>

      {/* CURRENT USER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Admin-Kontext
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Benutzer
            </p>

            <p className="font-semibold mt-1">
              {user?.name || "Unbekannt"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              E-Mail
            </p>

            <p className="font-semibold mt-1">
              {user?.email || "Keine E-Mail"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Rolle
            </p>

            <p className="font-semibold mt-1">
              {getRoleLabel(
                user?.role || "viewer"
              )}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Lokaler Speicher
            </p>

            <p className="font-semibold mt-1">
              {getStorageSize()}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(
          (item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
            >
              <p className="text-sm text-zinc-500">
                {item.label}
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {item.value}
              </h2>
            </Link>
          )
        )}
      </div>

      {/* ADMIN MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl">
            👥
          </div>

          <h2 className="text-2xl font-semibold mt-5">
            Benutzerverwaltung
          </h2>

          <p className="text-zinc-500 mt-2">
            Später: echte Benutzer, Rollen, Rechte, Login und Einladungen verwalten.
          </p>

          {canManageUsers() && (
            <Link
              href="/setup"
              className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Demo-Benutzer verwalten
            </Link>
          )}

          {!canManageUsers() && (
            <p className="text-sm text-zinc-400 mt-6">
              Keine Berechtigung zur Benutzerverwaltung.
            </p>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl">
            🗄️
          </div>

          <h2 className="text-2xl font-semibold mt-5">
            Datenbank
          </h2>

          <p className="text-zinc-500 mt-2">
            Später: LocalStorage durch echte Datenbank ersetzen, Migrationen und Backups verwalten.
          </p>

          <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
            <p className="text-sm text-zinc-500">
              Aktueller Modus
            </p>

            <p className="font-semibold mt-1">
              Browser LocalStorage
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-2xl">
            ⚙️
          </div>

          <h2 className="text-2xl font-semibold mt-5">
            Systemeinstellungen
          </h2>

          <p className="text-zinc-500 mt-2">
            Später: Dark Mode, Firmenbranding, Standardrollen, Limits und globale Einstellungen.
          </p>

          {canManageSystem() && (
            <Link
              href="/settings"
              className="inline-flex mt-6 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Einstellungen öffnen
            </Link>
          )}

          {!canManageSystem() && (
            <p className="text-sm text-zinc-400 mt-6">
              Keine Berechtigung zur Systemverwaltung.
            </p>
          )}
        </div>
      </div>

      {/* ROADMAP */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Nächste technische Ausbaustufen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              1. Datenmodell vorbereiten
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Wiki, Tickets, Kommentare, Benutzer, Rollen, Firmen und Einstellungen als saubere Tabellen/Collections planen.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              2. Echtes Login
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Demo-User durch Login, Sessions und serverseitige Rechteprüfung ersetzen.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              3. Admin-Bereich
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Benutzer anlegen, Rollen setzen, Firmen und Abteilungen verwalten.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              4. Echte Einstellungen
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Dark Mode, Design, Standardwerte und Systemoptionen persistent speichern.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}