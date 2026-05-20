"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import type {
  AppSettings,
} from "../../lib/appSettingsStorage";

import {
  getDataSource,
  getDataSourceDescription,
  getDataSourceLabel,
  getDataSourceOptions,
  saveDataSource,
} from "../../lib/dataSourceConfig";

import type {
  AppDataSource,
} from "../../lib/dataSourceConfig";

import {
  confirmReset,
} from "../../lib/confirmHelpers";

import {
  notifySuccess,
  notifyWarning,
} from "../../lib/notificationHelpers";

type ThemeValue =
  NonNullable<AppSettings["theme"]>;

type AccentColorValue =
  NonNullable<
    | AppSettings["accentColor"]
    | AppSettings["appAccentColor"]
  >;

type SidebarPositionValue =
  NonNullable<AppSettings["sidebarPosition"]>;

type UserRoleValue =
  NonNullable<AppSettings["defaultUserRole"]>;

type ThemeOption = {
  value: ThemeValue;
  label: string;
  description: string;
};

type AccentColorOption = {
  value: AccentColorValue;
  label: string;
  color: string;
};

type SidebarPositionOption = {
  value: SidebarPositionValue;
  label: string;
};

type UserRoleOption = {
  value: UserRoleValue;
  label: string;
};

const themeOptions: ThemeOption[] = [
  {
    value:
      "modern",

    label:
      "Modern",

    description:
      "Helles, modernes Standarddesign.",
  },
  {
    value:
      "dark",

    label:
      "Dark",

    description:
      "Dunkles Design für die Oberfläche.",
  },
  {
    value:
      "system",

    label:
      "System",

    description:
      "Orientiert sich später an Systemeinstellungen.",
  },
];

const accentColorOptions: AccentColorOption[] = [
  {
    value:
      "zinc",

    label:
      "Zinc",

    color:
      "#18181b",
  },
  {
    value:
      "blue",

    label:
      "Blau",

    color:
      "#2563eb",
  },
  {
    value:
      "indigo",

    label:
      "Indigo",

    color:
      "#4f46e5",
  },
  {
    value:
      "emerald",

    label:
      "Emerald",

    color:
      "#059669",
  },
  {
    value:
      "amber",

    label:
      "Amber",

    color:
      "#d97706",
  },
  {
    value:
      "red",

    label:
      "Rot",

    color:
      "#dc2626",
  },
];

const sidebarPositionOptions: SidebarPositionOption[] = [
  {
    value:
      "left",

    label:
      "Links",
  },
  {
    value:
      "right",

    label:
      "Rechts",
  },
];

const userRoleOptions: UserRoleOption[] = [
  {
    value:
      "viewer",

    label:
      "Leser",
  },
  {
    value:
      "editor",

    label:
      "Bearbeiter",
  },
  {
    value:
      "admin",

    label:
      "Administrator",
  },
];

function normalizeTheme(
  value: AppSettings["theme"]
): ThemeValue {
  if (
    value === "dark" ||
    value === "system"
  ) {
    return value;
  }

  return "modern";
}

function normalizeAccentColor(
  value:
    | AppSettings["accentColor"]
    | AppSettings["appAccentColor"]
): AccentColorValue {
  if (
    value === "blue" ||
    value === "indigo" ||
    value === "emerald" ||
    value === "amber" ||
    value === "red"
  ) {
    return value;
  }

  return "zinc";
}

function normalizeSidebarPosition(
  value: AppSettings["sidebarPosition"]
): SidebarPositionValue {
  if (value === "right") {
    return "right";
  }

  return "left";
}

function normalizeDefaultRole(
  value: AppSettings["defaultUserRole"]
): UserRoleValue {
  if (
    value === "admin" ||
    value === "editor"
  ) {
    return value;
  }

  return "viewer";
}

export default function SettingsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [appName, setAppName] =
    useState("Intranet");

  const [companyName, setCompanyName] =
    useState("Intern");

  const [appVersion, setAppVersion] =
    useState("0.1.0");

  const [theme, setTheme] =
    useState<ThemeValue>("modern");

  const [darkMode, setDarkMode] =
    useState(false);

  const [accentColor, setAccentColor] =
    useState<AccentColorValue>("zinc");

  const [sidebarPosition, setSidebarPosition] =
    useState<SidebarPositionValue>("left");

  const [showVersion, setShowVersion] =
    useState(true);

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
    useState<UserRoleValue>("viewer");

  const [dataSource, setDataSource] =
    useState<AppDataSource>("localStorage");

  useEffect(() => {
    setMounted(true);

    loadSettings();

    function handleSettingsUpdated() {
      loadSettings();
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    window.addEventListener(
      "storage",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );

      window.removeEventListener(
        "storage",
        handleSettingsUpdated
      );
    };
  }, []);

  function loadSettings() {
    const loadedSettings =
      appSettingsRepository.get();

    setAppName(
      loadedSettings.appName ||
      "Intranet"
    );

    setCompanyName(
      loadedSettings.companyName ||
      "Intern"
    );

    setAppVersion(
      loadedSettings.appVersion ||
      loadedSettings.version ||
      "0.1.0"
    );

    setTheme(
      normalizeTheme(
        loadedSettings.theme
      )
    );

    setDarkMode(
      Boolean(
        loadedSettings.darkMode
      )
    );

    setAccentColor(
      normalizeAccentColor(
        loadedSettings.accentColor ||
        loadedSettings.appAccentColor
      )
    );

    setSidebarPosition(
      normalizeSidebarPosition(
        loadedSettings.sidebarPosition
      )
    );

    setShowVersion(
      Boolean(
        loadedSettings.showVersion
      )
    );

    setCompactMode(
      Boolean(
        loadedSettings.compactMode
      )
    );

    setShowDemoHints(
      Boolean(
        loadedSettings.showDemoHints
      )
    );

    setEnableTicketTemplates(
      Boolean(
        loadedSettings.enableTicketTemplates
      )
    );

    setEnableTicketComments(
      Boolean(
        loadedSettings.enableTicketComments
      )
    );

    setEnableActivityLog(
      Boolean(
        loadedSettings.enableActivityLog
      )
    );

    setDefaultUserRole(
      normalizeDefaultRole(
        loadedSettings.defaultUserRole
      )
    );

    setDataSource(
      getDataSource()
    );
  }

  function handleSave() {
    appSettingsRepository.save({
      appName:
        appName.trim() ||
        "Intranet",

      companyName:
        companyName.trim() ||
        "Intern",

      appVersion:
        appVersion.trim() ||
        "0.1.0",

      version:
        appVersion.trim() ||
        "0.1.0",

      theme,

      darkMode,

      accentColor,

      appAccentColor:
        accentColor,

      sidebarPosition,

      showVersion,

      compactMode,

      showDemoHints,

      enableTicketTemplates,

      enableTicketComments,

      enableActivityLog,

      defaultUserRole,
    });

    saveDataSource(
      dataSource
    );

    notifySuccess(
      "Einstellungen gespeichert",
      "Die App-Einstellungen wurden übernommen."
    );
  }

  function handleReset() {
    const confirmed =
      confirmReset(
        "Einstellungen"
      );

    if (!confirmed) {
      notifyWarning(
        "Zurücksetzen abgebrochen",
        "Die Einstellungen wurden nicht verändert."
      );

      return;
    }

    appSettingsRepository.reset();

    saveDataSource(
      "localStorage"
    );

    loadSettings();

    notifySuccess(
      "Einstellungen zurückgesetzt",
      "Die Standardwerte wurden wiederhergestellt."
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-4xl font-bold">
          Einstellungen
        </h1>

        <p className="text-zinc-500 mt-2">
          App-Name, Darstellung, Features und Standardwerte verwalten
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          App-Informationen
        </h2>

        <p className="text-zinc-500 mt-2">
          Grunddaten für Branding und Anzeige.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div>
            <label className="block mb-2 font-medium">
              App-Name
            </label>

            <input
              value={appName}
              onChange={(event) =>
                setAppName(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Intranet"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Firma
            </label>

            <input
              value={companyName}
              onChange={(event) =>
                setCompanyName(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Intern"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Version
            </label>

            <input
              value={appVersion}
              onChange={(event) =>
                setAppVersion(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="0.1.0"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Darstellung
        </h2>

        <p className="text-zinc-500 mt-2">
          Standarddesign, Dark Mode, Akzentfarbe und Layout.
        </p>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">
            Theme
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setTheme(
                      option.value
                    )
                  }
                  className={`text-left border rounded-2xl p-5 transition ${
                    theme === option.value
                      ? "border-zinc-900 bg-zinc-100"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <p className="font-semibold">
                    {option.label}
                  </p>

                  <p className="text-sm text-zinc-500 mt-2">
                    {option.description}
                  </p>
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold mb-3">
            Akzentfarbe
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {accentColorOptions.map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setAccentColor(
                      option.value
                    )
                  }
                  className={`flex items-center gap-3 border rounded-2xl p-4 transition ${
                    accentColor === option.value
                      ? "border-zinc-900 bg-zinc-100"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{
                      backgroundColor:
                        option.color,
                    }}
                  />

                  <span className="font-medium">
                    {option.label}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold mb-3">
            Layout
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sidebarPositionOptions.map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setSidebarPosition(
                      option.value
                    )
                  }
                  className={`text-left border rounded-2xl p-5 transition ${
                    sidebarPosition === option.value
                      ? "border-zinc-900 bg-zinc-100"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <p className="font-semibold">
                    Sidebar {option.label}
                  </p>
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Dark Mode
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Dunkle Oberfläche aktivieren.
              </span>
            </span>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={(event) =>
                setDarkMode(
                  event.target.checked
                )
              }
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Kompaktmodus
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Weniger Innenabstand im Hauptbereich.
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
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Version anzeigen
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Version in der Sidebar anzeigen.
              </span>
            </span>

            <input
              type="checkbox"
              checked={showVersion}
              onChange={(event) =>
                setShowVersion(
                  event.target.checked
                )
              }
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Features
        </h2>

        <p className="text-zinc-500 mt-2">
          Schalte optionale Bereiche der Anwendung ein oder aus.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Demo-Hinweise
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Hilfetexte anzeigen.
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
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Ticket-Vorlagen
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Vorlagenbereich aktivieren.
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
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Ticket-Kommentare
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Kommentare in Tickets erlauben.
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
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-5">
            <span>
              <span className="block font-medium">
                Aktivitätslog
              </span>

              <span className="block text-sm text-zinc-500 mt-1">
                Systemaktionen protokollieren.
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
              className="h-5 w-5"
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Standardwerte & Datenquelle
        </h2>

        <p className="text-zinc-500 mt-2">
          Vorbereitung für Benutzerverwaltung und spätere Datenbank-Anbindung.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block mb-2 font-medium">
              Standardrolle für neue Benutzer
            </label>

            <select
              value={defaultUserRole}
              onChange={(event) =>
                setDefaultUserRole(
                  event.target.value as UserRoleValue
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {userRoleOptions.map(
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
              Datenquelle
            </label>

            <select
              value={dataSource}
              onChange={(event) =>
                setDataSource(
                  event.target.value as AppDataSource
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {getDataSourceOptions().map(
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

            <p className="text-sm text-zinc-500 mt-2">
              Aktuell:{" "}
              {getDataSourceLabel(
                dataSource
              )}
              {" — "}
              {getDataSourceDescription(
                dataSource
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Änderungen übernehmen
        </h2>

        <p className="text-zinc-500 mt-2">
          Speichere die Einstellungen oder setze sie auf Standardwerte zurück.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Zurücksetzen
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}