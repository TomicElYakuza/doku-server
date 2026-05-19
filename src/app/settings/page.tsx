"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getAccentColorLabel,
  getAccentColorOptions,
  getAppSettings,
  getThemeLabel,
  getThemeOptions,
  resetAppSettings,
  saveAppSettings,
} from "../../lib/appSettingsStorage";

import type {
  AppAccentColor,
  AppSettings,
  AppTheme,
} from "../../lib/appSettingsStorage";

type StorageStat = {
  key: string;
  label: string;
  count: number;
};

const STORAGE_KEYS = {
  tickets: "dms_tickets",
  ticketTemplates: "dms_ticket_templates",
  ticketComments: "dms_ticket_comments",
  activities: "dms_activities",
  user: "dms_user",
  wikiPages: "dms_wiki_pages",
  trashPages: "dms_trash_pages",
  files: "dms_files",
  appSettings: "dms_app_settings",
};

export default function SettingsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [stats, setStats] =
    useState<StorageStat[]>([]);

  const [settings, setSettings] =
    useState<AppSettings | null>(null);

  const [appName, setAppName] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [theme, setTheme] =
    useState<AppTheme>("light");

  const [accentColor, setAccentColor] =
    useState<AppAccentColor>("indigo");

  const [compactMode, setCompactMode] =
    useState(false);

  const [showDemoHints, setShowDemoHints] =
    useState(true);

  const [enableTicketTemplates, setEnableTicketTemplates] =
    useState(true);

  const [enableTicketComments, setEnableTicketComments] =
    useState(true);

  const [enableActivityLog, setEnableActivityLog] =
    useState(true);

  const [defaultUserRole, setDefaultUserRole] =
    useState<"admin" | "editor" | "viewer">("viewer");

  useEffect(() => {
    setMounted(true);

    loadStats();

    loadSettings();

    function handleStorageUpdate() {
      loadStats();
    }

    function handleSettingsUpdate() {
      loadSettings();

      loadStats();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "ticketCommentsUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "activityUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "trashUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdate
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "ticketCommentsUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "activityUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "trashUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdate
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

  function loadStats() {
    if (typeof window === "undefined") {
      return;
    }

    setStats([
      {
        key: STORAGE_KEYS.tickets,
        label: "Tickets",
        count: getCountFromStorage(
          STORAGE_KEYS.tickets
        ),
      },
      {
        key: STORAGE_KEYS.ticketTemplates,
        label: "Ticket-Vorlagen",
        count: getCountFromStorage(
          STORAGE_KEYS.ticketTemplates
        ),
      },
      {
        key: STORAGE_KEYS.ticketComments,
        label: "Ticket-Kommentare",
        count: getCountFromStorage(
          STORAGE_KEYS.ticketComments
        ),
      },
      {
        key: STORAGE_KEYS.activities,
        label: "Aktivitäten",
        count: getCountFromStorage(
          STORAGE_KEYS.activities
        ),
      },
      {
        key: STORAGE_KEYS.wikiPages,
        label: "Wiki-Dokumente",
        count: getCountFromStorage(
          STORAGE_KEYS.wikiPages
        ),
      },
      {
        key: STORAGE_KEYS.trashPages,
        label: "Papierkorb",
        count: getCountFromStorage(
          STORAGE_KEYS.trashPages
        ),
      },
      {
        key: STORAGE_KEYS.files,
        label: "Dateien",
        count: getCountFromStorage(
          STORAGE_KEYS.files
        ),
      },
      {
        key: STORAGE_KEYS.appSettings,
        label: "App-Einstellungen",
        count: getCountFromStorage(
          STORAGE_KEYS.appSettings
        ),
      },
    ]);
  }

  function loadSettings() {
    const loadedSettings =
      getAppSettings();

    setSettings(
      loadedSettings
    );

    setAppName(
      loadedSettings.appName
    );

    setCompanyName(
      loadedSettings.companyName
    );

    setTheme(
      loadedSettings.theme
    );

    setAccentColor(
      loadedSettings.accentColor
    );

    setCompactMode(
      loadedSettings.compactMode
    );

    setShowDemoHints(
      loadedSettings.showDemoHints
    );

    setEnableTicketTemplates(
      loadedSettings.enableTicketTemplates
    );

    setEnableTicketComments(
      loadedSettings.enableTicketComments
    );

    setEnableActivityLog(
      loadedSettings.enableActivityLog
    );

    setDefaultUserRole(
      loadedSettings.defaultUserRole
    );
  }

  function dispatchAllUpdates() {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new Event("ticketsUpdated")
    );

    window.dispatchEvent(
      new Event("ticketTemplatesUpdated")
    );

    window.dispatchEvent(
      new Event("ticketCommentsUpdated")
    );

    window.dispatchEvent(
      new Event("activityUpdated")
    );

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );

    window.dispatchEvent(
      new Event("trashUpdated")
    );

    window.dispatchEvent(
      new Event("appSettingsUpdated")
    );
  }

  function removeStorageKey(
    key: string
  ) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(
      key
    );

    dispatchAllUpdates();

    loadStats();
  }

  function handleSaveSettings() {
    if (!settings) {
      return;
    }

    if (!appName.trim()) {
      alert(
        "Bitte einen App-Namen eingeben."
      );

      return;
    }

    if (!companyName.trim()) {
      alert(
        "Bitte einen Firmennamen eingeben."
      );

      return;
    }

    const savedSettings =
      saveAppSettings({
        ...settings,

        appName:
          appName.trim(),

        companyName:
          companyName.trim(),

        theme,

        accentColor,

        compactMode,

        showDemoHints,

        enableTicketTemplates,

        enableTicketComments,

        enableActivityLog,

        defaultUserRole,
      });

    setSettings(
      savedSettings
    );

    alert(
      "Einstellungen wurden gespeichert."
    );
  }

  function handleResetSettings() {
    const confirmed =
      confirm(
        "App-Einstellungen wirklich auf Standard zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    const resetSettings =
      resetAppSettings();

    setSettings(
      resetSettings
    );

    loadSettings();

    loadStats();
  }

  function clearTickets() {
    const confirmed =
      confirm(
        "Alle Tickets löschen? Kommentare zu Tickets bleiben nur erhalten, wenn du sie nicht separat löschst."
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.tickets
    );
  }

  function clearTicketTemplates() {
    const confirmed =
      confirm(
        "Alle Ticket-Vorlagen löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.ticketTemplates
    );
  }

  function clearTicketComments() {
    const confirmed =
      confirm(
        "Alle Ticket-Kommentare löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.ticketComments
    );
  }

  function clearActivities() {
    const confirmed =
      confirm(
        "Alle Aktivitäten löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.activities
    );
  }

  function clearWikiPages() {
    const confirmed =
      confirm(
        "Alle Wiki-Dokumente löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.wikiPages
    );
  }

  function clearWikiTrash() {
    const confirmed =
      confirm(
        "Papierkorb leeren?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.trashPages
    );
  }

  function clearFiles() {
    const confirmed =
      confirm(
        "Alle gespeicherten Dateien löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.files
    );
  }

  function clearUser() {
    const confirmed =
      confirm(
        "Benutzer-Setup zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.user
    );
  }

  function clearAppSettings() {
    const confirmed =
      confirm(
        "App-Einstellungen löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.appSettings
    );

    loadSettings();
  }

  function clearAllDemoData() {
    const confirmed =
      confirm(
        "Wirklich alle lokalen Demo-Daten löschen? Tickets, Vorlagen, Kommentare, Aktivitäten, Wiki-Daten, Papierkorb, Dateien, Benutzer-Setup und App-Einstellungen werden entfernt."
      );

    if (!confirmed) {
      return;
    }

    Object.values(
      STORAGE_KEYS
    ).forEach(
      (key) => {
        localStorage.removeItem(
          key
        );
      }
    );

    dispatchAllUpdates();

    loadSettings();

    loadStats();
  }

  function exportLocalStorage() {
    if (typeof window === "undefined") {
      return;
    }

    const data: Record<string, string> =
      {};

    Object.values(
      STORAGE_KEYS
    ).forEach(
      (key) => {
        const value =
          localStorage.getItem(
            key
          );

        if (value !== null) {
          data[key] =
            value;
        }
      }
    );

    const json =
      JSON.stringify(
        data,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      `dms-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  function importLocalStorage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed =
      confirm(
        "Import starten? Bestehende lokale Daten mit gleichen Schlüsseln werden überschrieben."
      );

    if (!confirmed) {
      event.target.value =
        "";

      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        try {
          const result =
            reader.result;

          if (
            typeof result !== "string"
          ) {
            alert(
              "Import fehlgeschlagen."
            );

            return;
          }

          const parsed =
            JSON.parse(result);

          if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
          ) {
            alert(
              "Ungültige Import-Datei."
            );

            return;
          }

          Object.entries(
            parsed
          ).forEach(
            ([key, value]) => {
              if (
                Object.values(
                  STORAGE_KEYS
                ).includes(key)
              ) {
                localStorage.setItem(
                  key,
                  String(value)
                );
              }
            }
          );

          dispatchAllUpdates();

          loadSettings();

          loadStats();

          alert(
            "Import abgeschlossen."
          );
        } catch {
          alert(
            "Import fehlgeschlagen. Datei ist kein gültiges JSON."
          );
        } finally {
          event.target.value =
            "";
        }
      };

    reader.readAsText(
      file
    );
  }

  if (!mounted || !settings) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-6xl">
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
          einstellungen
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
            Einstellungen
          </h1>

          <p className="text-zinc-500 mt-2">
            App-Konfiguration, lokale Demo-Daten, Export, Import und Reset verwalten
          </p>
        </div>

        <Link
          href="/admin"
          className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          Admin-Dashboard
        </Link>
      </div>

      {/* APP SETTINGS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            App
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {settings.appName}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Firma
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {settings.companyName}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Theme
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {getThemeLabel(
              settings.theme
            )}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Accent
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {getAccentColorLabel(
              settings.accentColor
            )}
          </h2>
        </div>
      </div>

      {/* APP SETTINGS FORM */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          App-Einstellungen
        </h2>

        <p className="text-zinc-500 mt-2">
          Diese Einstellungen liegen aktuell im Browser. Später können sie in der Datenbank pro Firma oder global gespeichert werden.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block mb-2 font-medium">
              App-Name
            </label>

            <input
              type="text"
              value={appName}
              onChange={(event) =>
                setAppName(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="DMS Intranet"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Firmenname
            </label>

            <input
              type="text"
              value={companyName}
              onChange={(event) =>
                setCompanyName(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Firma"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Theme
            </label>

            <select
              value={theme}
              onChange={(event) =>
                setTheme(
                  event.target.value as AppTheme
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {getThemeOptions().map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Accent Color
            </label>

            <select
              value={accentColor}
              onChange={(event) =>
                setAccentColor(
                  event.target.value as AppAccentColor
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {getAccentColorOptions().map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Standardrolle für neue Benutzer
            </label>

            <select
              value={defaultUserRole}
              onChange={(event) =>
                setDefaultUserRole(
                  event.target.value as
                    | "admin"
                    | "editor"
                    | "viewer"
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              <option value="viewer">
                Leser
              </option>

              <option value="editor">
                Bearbeiter
              </option>

              <option value="admin">
                Administrator
              </option>
            </select>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Zuletzt geändert
            </p>

            <p className="font-semibold mt-1">
              {settings.updatedAt}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <label className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 cursor-pointer">
            <span>
              <span className="block font-medium">
                Kompakter Modus
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Später für kleinere Abstände und dichtere Tabellen.
              </span>
            </span>

            <input
              type="checkbox"
              checked={compactMode}
              onChange={(event) =>
                setCompactMode(
                  event.target.checked
                )
              }
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 cursor-pointer">
            <span>
              <span className="block font-medium">
                Demo-Hinweise anzeigen
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Hinweise für spätere Datenbank- und Admin-Funktionen anzeigen.
              </span>
            </span>

            <input
              type="checkbox"
              checked={showDemoHints}
              onChange={(event) =>
                setShowDemoHints(
                  event.target.checked
                )
              }
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 cursor-pointer">
            <span>
              <span className="block font-medium">
                Ticket-Vorlagen aktivieren
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Vorlagen-Modul für wiederkehrende Tickets.
              </span>
            </span>

            <input
              type="checkbox"
              checked={enableTicketTemplates}
              onChange={(event) =>
                setEnableTicketTemplates(
                  event.target.checked
                )
              }
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 cursor-pointer">
            <span>
              <span className="block font-medium">
                Ticket-Kommentare aktivieren
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Kommentare bei Tickets erlauben.
              </span>
            </span>

            <input
              type="checkbox"
              checked={enableTicketComments}
              onChange={(event) =>
                setEnableTicketComments(
                  event.target.checked
                )
              }
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 cursor-pointer md:col-span-2">
            <span>
              <span className="block font-medium">
                Aktivitätslog aktivieren
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Änderungen, Kommentare, Löschungen und Ticket-Aktionen protokollieren.
              </span>
            </span>

            <input
              type="checkbox"
              checked={enableActivityLog}
              onChange={(event) =>
                setEnableActivityLog(
                  event.target.checked
                )
              }
              className="w-5 h-5"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleSaveSettings}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Einstellungen speichern
          </button>

          <button
            onClick={loadSettings}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Änderungen verwerfen
          </button>

          <button
            onClick={handleResetSettings}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-red-50 transition"
          >
            App-Einstellungen zurücksetzen
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(
          (item) => (
            <div
              key={item.key}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <p className="text-sm text-zinc-500">
                {item.label}
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {item.count}
              </h2>
            </div>
          )
        )}
      </div>

      {/* DATA MANAGEMENT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Datenverwaltung
        </h2>

        <p className="text-zinc-500 mt-2">
          Alle Daten liegen aktuell lokal im Browser-Storage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button
            onClick={exportLocalStorage}
            className="bg-zinc-900 text-white px-5 py-4 rounded-2xl hover:bg-zinc-700 transition text-left"
          >
            Lokale Daten exportieren
          </button>

          <label className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition cursor-pointer text-left">
            Lokale Daten importieren

            <input
              type="file"
              accept="application/json"
              onChange={importLocalStorage}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* RESET SECTIONS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Einzelne Bereiche löschen
        </h2>

        <p className="text-zinc-500 mt-2">
          Damit kannst du gezielt einzelne lokale Bereiche zurücksetzen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={clearTickets}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Tickets löschen
          </button>

          <button
            onClick={clearTicketTemplates}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Ticket-Vorlagen löschen
          </button>

          <button
            onClick={clearTicketComments}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Ticket-Kommentare löschen
          </button>

          <button
            onClick={clearActivities}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Aktivitäten löschen
          </button>

          <button
            onClick={clearWikiPages}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Wiki-Dokumente löschen
          </button>

          <button
            onClick={clearWikiTrash}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Papierkorb leeren
          </button>

          <button
            onClick={clearFiles}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Dateien löschen
          </button>

          <button
            onClick={clearUser}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Benutzer-Setup löschen
          </button>

          <button
            onClick={clearAppSettings}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            App-Einstellungen löschen
          </button>
        </div>
      </div>

      {/* DANGER */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-red-800">
          Gefahrenbereich
        </h2>

        <p className="text-red-700 mt-2">
          Diese Aktion löscht alle lokalen Demo-Daten dieses Browsers.
        </p>

        <button
          onClick={clearAllDemoData}
          className="mt-6 bg-red-600 text-white px-6 py-4 rounded-2xl hover:bg-red-500 transition"
        >
          Alle lokalen Demo-Daten löschen
        </button>
      </div>
    </div>
  );
}