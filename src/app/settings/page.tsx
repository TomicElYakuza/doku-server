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
  getDefaultUserRoleOptions,
  getSidebarPositionOptions,
  getThemeLabel,
  getThemeOptions,
  resetAppSettings,
  saveAppSettings,
} from "../../lib/appSettingsStorage";

import type {
  AppAccentColor,
  AppSettings,
  AppTheme,
  SidebarPosition,
} from "../../lib/appSettingsStorage";

import type {
  UserRole,
} from "../../lib/userStorage";

import {
  canManageSystem,
} from "../../lib/permissions";

import {
  saveSettingsResetActivity,
  saveSettingsUpdatedActivity,
} from "../../lib/settingsActivityHelpers";

export default function SettingsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [settings, setSettings] =
    useState<AppSettings | null>(null);

  const [appName, setAppName] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [appVersion, setAppVersion] =
    useState("");

  const [theme, setTheme] =
    useState<AppTheme>("modern");

  const [darkMode, setDarkMode] =
    useState(false);

  const [accentColor, setAccentColor] =
    useState<AppAccentColor>("zinc");

  const [sidebarPosition, setSidebarPosition] =
    useState<SidebarPosition>("left");

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
    useState<UserRole>("viewer");

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

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

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

    setAppVersion(
      loadedSettings.appVersion ||
        loadedSettings.version
    );

    setTheme(
      loadedSettings.theme
    );

    setDarkMode(
      loadedSettings.darkMode
    );

    setAccentColor(
      loadedSettings.accentColor ||
        loadedSettings.appAccentColor
    );

    setSidebarPosition(
      loadedSettings.sidebarPosition
    );

    setShowVersion(
      loadedSettings.showVersion
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

  function handleSaveSettings() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Einstellungen zu speichern."
      );

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
        appName:
          appName.trim(),

        companyName:
          companyName.trim(),

        appVersion:
          appVersion.trim() ||
          "0.1.0",

        version:
          appVersion.trim() ||
          "0.1.0",

        theme,

        darkMode,

        appAccentColor:
          accentColor,

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

    setSettings(
      savedSettings
    );

    saveSettingsUpdatedActivity(
      savedSettings
    );

    alert(
      "Einstellungen wurden gespeichert."
    );
  }

  function handleResetSettings() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Einstellungen zurückzusetzen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Einstellungen wirklich auf Standard zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    const resetSettings =
      resetAppSettings();

    setSettings(
      resetSettings
    );

    saveSettingsResetActivity(
      resetSettings
    );

    loadSettings();

    alert(
      "Einstellungen wurden zurückgesetzt."
    );
  }

  if (!mounted) {
    return null;
  }

  if (!settings) {
    return null;
  }

  if (!canManageSystem()) {
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

          <span className="text-zinc-900">
            einstellungen
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center text-2xl mb-6">
            🔒
          </div>

          <h1 className="text-4xl font-bold">
            Kein Zugriff
          </h1>

          <p className="text-zinc-500 mt-3">
            Du hast mit deiner aktuellen Rolle keine Berechtigung für die Systemeinstellungen.
          </p>
        </div>
      </div>
    );
  }

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

        <span className="text-zinc-900">
          einstellungen
        </span>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Einstellungen
          </h1>

          <p className="text-zinc-500 mt-2">
            App-Name, Design, Features und Standardwerte verwalten
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleResetSettings}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Zurücksetzen
          </button>

          <button
            onClick={handleSaveSettings}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Speichern
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            App
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {settings.appName}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            {settings.companyName}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Version
          </p>

          <h2 className="text-2xl font-bold mt-3">
            {settings.appVersion}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Anzeige: {settings.showVersion ? "Aktiv" : "Aus"}
          </p>
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

          <p className="text-sm text-zinc-500 mt-2">
            Farbe:{" "}
            {getAccentColorLabel(
              settings.accentColor
            )}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Aktualisiert
          </p>

          <h2 className="text-xl font-bold mt-3">
            {settings.updatedAt}
          </h2>
        </div>
      </div>

      {/* GENERAL */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Allgemein
        </h2>

        <p className="text-zinc-500 mt-2">
          Grunddaten deiner DMS-/Ticket-/Intranet-App.
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
              placeholder="Intern"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Version
            </label>

            <input
              type="text"
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

          <div>
            <label className="block mb-2 font-medium">
              Standardrolle
            </label>

            <select
              value={defaultUserRole}
              onChange={(event) =>
                setDefaultUserRole(
                  event.target.value as UserRole
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {getDefaultUserRoleOptions().map(
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
        </div>
      </div>

      {/* DESIGN */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Design
        </h2>

        <p className="text-zinc-500 mt-2">
          Theme, Akzentfarbe, Dark Mode und Layoutverhalten.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
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
              Akzentfarbe
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
              Sidebar-Position
            </label>

            <select
              value={sidebarPosition}
              onChange={(event) =>
                setSidebarPosition(
                  event.target.value as SidebarPosition
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              {getSidebarPositionOptions().map(
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

          <div className="grid gap-3">
            <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
              <span>
                Dark Mode
              </span>

              <input
                type="checkbox"
                checked={darkMode}
                onChange={(event) =>
                  setDarkMode(
                    event.target.checked
                  )
                }
              />
            </label>

            <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
              <span>
                Kompakter Modus
              </span>

              <input
                type="checkbox"
                checked={compactMode}
                onChange={(event) =>
                  setCompactMode(
                    event.target.checked
                  )
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Funktionen
        </h2>

        <p className="text-zinc-500 mt-2">
          Feature-Schalter für Demo, Tickets, Kommentare und Aktivitäten.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
            <span>
              Version anzeigen
            </span>

            <input
              type="checkbox"
              checked={showVersion}
              onChange={(event) =>
                setShowVersion(
                  event.target.checked
                )
              }
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
            <span>
              Demo-Hinweise anzeigen
            </span>

            <input
              type="checkbox"
              checked={showDemoHints}
              onChange={(event) =>
                setShowDemoHints(
                  event.target.checked
                )
              }
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
            <span>
              Ticket-Vorlagen aktivieren
            </span>

            <input
              type="checkbox"
              checked={enableTicketTemplates}
              onChange={(event) =>
                setEnableTicketTemplates(
                  event.target.checked
                )
              }
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
            <span>
              Ticket-Kommentare aktivieren
            </span>

            <input
              type="checkbox"
              checked={enableTicketComments}
              onChange={(event) =>
                setEnableTicketComments(
                  event.target.checked
                )
              }
            />
          </label>

          <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
            <span>
              Aktivitätslog aktivieren
            </span>

            <input
              type="checkbox"
              checked={enableActivityLog}
              onChange={(event) =>
                setEnableActivityLog(
                  event.target.checked
                )
              }
            />
          </label>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={handleResetSettings}
          className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
        >
          Zurücksetzen
        </button>

        <button
          onClick={handleSaveSettings}
          className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
        >
          Einstellungen speichern
        </button>
      </div>
    </div>
  );
}