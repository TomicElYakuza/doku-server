"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canManageSystem,
  canViewAdmin,
} from "../../../lib/permissions";

type DatabaseModel = {
  name: string;
  label: string;
  description: string;
  fields: string[];
  status: "planned" | "local" | "ready";
};

const STORAGE_KEYS = {
  tickets: "dms_tickets",
  ticketTemplates: "dms_ticket_templates",
  ticketComments: "dms_ticket_comments",
  activities: "dms_activities",
  user: "dms_user",
  adminUsers: "dms_admin_users",
  companies: "dms_companies",
  departments: "dms_departments",
  wikiPages: "dms_wiki_pages",
  trashPages: "dms_trash_pages",
  files: "dms_files",
  appSettings: "dms_app_settings",
};

const databaseModels: DatabaseModel[] = [
  {
    name: "users",
    label: "Benutzer",
    description:
      "Echte Benutzerkonten mit Login, Rolle, Status, Firma und Abteilung.",
    status: "local",
    fields: [
      "id",
      "name",
      "email",
      "passwordHash / providerId",
      "role",
      "status",
      "companyId",
      "departmentId",
      "lastLoginAt",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "roles",
    label: "Rollen & Rechte",
    description:
      "Admin, Editor, Viewer und später eigene Rollen mit granularen Berechtigungen.",
    status: "planned",
    fields: [
      "id",
      "name",
      "label",
      "permissions",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "companies",
    label: "Firmen",
    description:
      "Kunden, Mandanten oder interne Firmenbereiche für Wiki, Tickets und Benutzer.",
    status: "local",
    fields: [
      "id",
      "name",
      "slug",
      "description",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "departments",
    label: "Abteilungen",
    description:
      "Abteilungen wie IT, HR, Support, Office oder Kundenbereiche.",
    status: "local",
    fields: [
      "id",
      "companyId",
      "name",
      "slug",
      "description",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "wiki_pages",
    label: "Wiki-Dokumente",
    description:
      "Dokumente, Anleitungen, interne Informationen und Wissensartikel.",
    status: "local",
    fields: [
      "id",
      "slug",
      "title",
      "content",
      "companyId",
      "departmentId",
      "tags",
      "createdById",
      "updatedById",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "wiki_versions",
    label: "Wiki-Versionen",
    description:
      "Versionierung für Dokumente, Wiederherstellung und Verlauf.",
    status: "local",
    fields: [
      "id",
      "pageId",
      "title",
      "content",
      "changedById",
      "createdAt",
    ],
  },
  {
    name: "wiki_comments",
    label: "Wiki-Kommentare",
    description:
      "Kommentare und Rückfragen direkt bei Wiki-Dokumenten.",
    status: "local",
    fields: [
      "id",
      "pageId",
      "text",
      "authorId",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "files",
    label: "Dateien",
    description:
      "Anhänge, Uploads und später echte Dateiablage mit Storage-Provider.",
    status: "local",
    fields: [
      "id",
      "pageId",
      "ticketId",
      "filename",
      "mimeType",
      "size",
      "storagePath",
      "uploadedById",
      "createdAt",
    ],
  },
  {
    name: "tickets",
    label: "Tickets",
    description:
      "Supportfälle, Aufgaben, interne Anfragen und Kunden-Tickets.",
    status: "local",
    fields: [
      "id",
      "title",
      "description",
      "companyId",
      "departmentId",
      "category",
      "assignedToId",
      "createdById",
      "status",
      "priority",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "ticket_comments",
    label: "Ticket-Kommentare",
    description:
      "Kommentare, Updates und interne Notizen zu Tickets.",
    status: "local",
    fields: [
      "id",
      "ticketId",
      "text",
      "authorId",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "ticket_templates",
    label: "Ticket-Vorlagen",
    description:
      "Vorlagen für wiederkehrende Supportfälle und Standardaufgaben.",
    status: "local",
    fields: [
      "id",
      "title",
      "description",
      "companyId",
      "departmentId",
      "category",
      "assignedToId",
      "status",
      "priority",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "activities",
    label: "Aktivitäten",
    description:
      "Audit-Log für Änderungen, Kommentare, Uploads, Löschungen und Admin-Aktionen.",
    status: "local",
    fields: [
      "id",
      "type",
      "title",
      "companyId",
      "userId",
      "metadata",
      "createdAt",
    ],
  },
  {
    name: "settings",
    label: "App-Einstellungen",
    description:
      "Theme, Branding, Standardrollen, Feature Flags und globale Systemoptionen.",
    status: "local",
    fields: [
      "id",
      "appName",
      "companyName",
      "theme",
      "accentColor",
      "compactMode",
      "featureFlags",
      "defaultUserRole",
      "updatedAt",
    ],
  },
  {
    name: "sessions",
    label: "Sessions",
    description:
      "Später für echtes Login, Session-Verwaltung und serverseitige Authentifizierung.",
    status: "planned",
    fields: [
      "id",
      "userId",
      "tokenHash",
      "expiresAt",
      "createdAt",
      "lastUsedAt",
    ],
  },
];

export default function AdminDatabasePage() {
  const [mounted, setMounted] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [storageSize, setStorageSize] =
    useState("0 KB");

  const [storageItemCount, setStorageItemCount] =
    useState(0);

  useEffect(() => {
    setMounted(true);

    loadStorageStats();

    function handleUpdate() {
      loadStorageStats();
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
      "appSettingsUpdated",
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
        "appSettingsUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "filesUpdated",
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
      localStorage.getItem(
        key
      );

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

  function loadStorageStats() {
    if (typeof window === "undefined") {
      return;
    }

    let totalSize =
      0;

    let totalItems =
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
          totalSize +=
            value.length;
        }

        totalItems +=
          getCountFromStorage(
            key
          );
      }
    );

    const kb =
      totalSize / 1024;

    if (kb < 1024) {
      setStorageSize(
        `${kb.toFixed(1)} KB`
      );
    } else {
      setStorageSize(
        `${(kb / 1024).toFixed(2)} MB`
      );
    }

    setStorageItemCount(
      totalItems
    );
  }

  function getStatusLabel(
    status: DatabaseModel["status"]
  ) {
    if (status === "local") {
      return "LocalStorage";
    }

    if (status === "planned") {
      return "Geplant";
    }

    if (status === "ready") {
      return "DB-ready";
    }

    return "Unbekannt";
  }

  function getStatusClass(
    status: DatabaseModel["status"]
  ) {
    if (status === "local") {
      return "bg-indigo-50 text-indigo-700";
    }

    if (status === "planned") {
      return "bg-zinc-100 text-zinc-700";
    }

    if (status === "ready") {
      return "bg-green-50 text-green-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  function resetFilters() {
    setSearch("");

    setStatusFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <div className="space-y-6">
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

          <Link
            href="/admin"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            admin
          </Link>

          <span className="text-zinc-400">
            /
          </span>

          <span className="text-zinc-900">
            datenbank
          </span>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-6">
            🔒
          </div>

          <h1 className="text-4xl font-bold">
            Kein Zugriff
          </h1>

          <p className="text-zinc-500 mt-3">
            Du hast mit deiner aktuellen Rolle keine Berechtigung für die Datenbank-Verwaltung.
          </p>
        </div>
      </div>
    );
  }

  const filteredModels =
    databaseModels.filter(
      (model) => {
        const query =
          search.toLowerCase();

        const matchesSearch =
          model.name
            .toLowerCase()
            .includes(query) ||
          model.label
            .toLowerCase()
            .includes(query) ||
          model.description
            .toLowerCase()
            .includes(query) ||
          model.fields.some(
            (field) =>
              field
                .toLowerCase()
                .includes(query)
          );

        const matchesStatus =
          !statusFilter ||
          model.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  const localCount =
    databaseModels.filter(
      (model) =>
        model.status === "local"
    ).length;

  const plannedCount =
    databaseModels.filter(
      (model) =>
        model.status === "planned"
    ).length;

  const readyCount =
    databaseModels.filter(
      (model) =>
        model.status === "ready"
    ).length;

  return (
    <div className="space-y-8">
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

        <Link
          href="/admin"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          admin
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          datenbank
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Datenbank-Planung
          </h1>

          <p className="text-zinc-500 mt-2">
            Vorbereitung für echte Datenbank, Tabellen, Migrationen und spätere API-Anbindung
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Link
            href="/admin/companies"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Firmen
          </Link>

          <Link
            href="/admin/storage"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Speicher
          </Link>

          <Link
            href="/settings"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Einstellungen
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Modelle gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {databaseModels.length}
          </h2>
        </div>

        <button
          onClick={() =>
            setStatusFilter(
              "local"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            LocalStorage
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {localCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              "planned"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Geplant
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {plannedCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              "ready"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            DB-ready
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {readyCount}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Lokale Daten
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {storageSize}
          </h2>

          <p className="text-xs text-zinc-500 mt-1">
            {storageItemCount} Einträge
          </p>
        </div>
      </div>

      {/* CURRENT MODE */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Datenmodus
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Speicher
            </p>

            <p className="font-semibold mt-1">
              Browser LocalStorage
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Authentifizierung
            </p>

            <p className="font-semibold mt-1">
              Demo-Benutzer
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Nächster Schritt
            </p>

            <p className="font-semibold mt-1">
              API + Datenbank
            </p>
          </div>
        </div>

        {canManageSystem() && (
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <p className="font-semibold text-indigo-700">
              Empfehlung
            </p>

            <p className="text-sm text-indigo-700 mt-2">
              Als nächstes sollten Wiki, Tickets, Benutzer, Firmen und Abteilungen über echte IDs verbunden werden. Danach kann LocalStorage leichter gegen API/Datenbank ersetzt werden.
            </p>
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Modelle suchen & filtern
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Modell, Feld oder Beschreibung suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Status
            </option>

            <option value="local">
              LocalStorage
            </option>

            <option value="planned">
              Geplant
            </option>

            <option value="ready">
              DB-ready
            </option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredModels.length} von{" "}
            {databaseModels.length} Modellen gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* MODELS */}
      <div className="grid gap-4">
        {filteredModels.map(
          (model) => (
            <div
              key={model.name}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                        model.status
                      )}`}
                    >
                      {getStatusLabel(
                        model.status
                      )}
                    </span>

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {model.name}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {model.label}
                  </h2>

                  <p className="text-zinc-500 mt-2">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    {model.fields.map(
                      (field) => (
                        <span
                          key={field}
                          className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full"
                        >
                          {field}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ROADMAP */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Migrations-Reihenfolge
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              1. API-Layer bauen
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Einheitliche Funktionen für Lesen, Speichern, Löschen und Filtern vorbereiten.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              2. Benutzer & Auth
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Echtes Login, Sessions, Rollen und serverseitige Berechtigungen.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              3. Firmenstruktur verbinden
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Wiki, Tickets und Benutzer mit echten Firmen- und Abteilungs-IDs verbinden.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="font-semibold">
              4. Dateien & Aktivitäten
            </p>

            <p className="text-sm text-zinc-500 mt-2">
              Datei-Storage, Audit-Log und Admin-Reporting anbinden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}