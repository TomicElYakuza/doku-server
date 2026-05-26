"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  getCachedCurrentUser,
} from "../../lib/currentUserRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import {
  useAppSettings,
} from "../../hooks/useAppSettings";

import type {
  AppAccentColor,
  AppTheme,
} from "../../types/settings";

type ThemeOption = {
  value: AppTheme;
  label: string;
  description: string;
};

type AccentOption = {
  value: AppAccentColor;
  label: string;
};

const themeOptions: ThemeOption[] = [
  {
    value:
      "modern",

    label:
      "Modern",

    description:
      "Standard-Oberfläche mit dunkler Sidebar.",
  },
  {
    value:
      "dark",

    label:
      "Dunkel",

    description:
      "Dunklere Oberfläche.",
  },
  {
    value:
      "system",

    label:
      "System",

    description:
      "Richtet sich nach dem Betriebssystem.",
  },
];

const accentOptions: AccentOption[] = [
  {
    value:
      "zinc",

    label:
      "Neutral",
  },
  {
    value:
      "blue",

    label:
      "Blau",
  },
  {
    value:
      "indigo",

    label:
      "Indigo",
  },
  {
    value:
      "emerald",

    label:
      "Emerald",
  },
  {
    value:
      "amber",

    label:
      "Amber",
  },
  {
    value:
      "red",

    label:
      "Rot",
  },
];

export default function SettingsPage() {
  const {
    settings,
    loading,
  } =
    useAppSettings();

  const [theme, setTheme] =
    useState<AppTheme>(
      settings.theme ||
        "modern"
    );

  const [accentColor, setAccentColor] =
    useState<AppAccentColor>(
      settings.accentColor ||
        settings.appAccentColor ||
        "zinc"
    );

  const [compactMode, setCompactMode] =
    useState(
      Boolean(
        settings.compactMode
      )
    );

  const user =
    getCachedCurrentUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Einstellungen
        </h1>

        <p className="text-zinc-500 mt-2">
          Persönliche Einstellungen, Konto und Darstellung.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Einstellungen werden geladen...
          </p>
        </div>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Mein Konto
            </h2>

            <p className="text-zinc-500 mt-1">
              Deine aktuell angemeldeten Benutzerinformationen.
            </p>
          </div>

          <Link
            href="/change-password"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition shrink-0"
          >
            Passwort ändern
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Name
            </p>

            <p className="font-semibold mt-1">
              {user?.name ||
                "Unbekannt"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              E-Mail
            </p>

            <p className="font-semibold mt-1 break-all">
              {user?.email ||
                "Unbekannt"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {user?.company ||
                "Intern"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Abteilung
            </p>

            <p className="font-semibold mt-1">
              {user?.department ||
                "Allgemein"}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">
            Darstellung
          </h2>

          <p className="text-zinc-500 mt-1">
            Persönliche Darstellung ist vorbereitet. Die Werte werden im nächsten Schritt pro Benutzer gespeichert.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
          <p className="text-amber-800 font-medium">
            Hinweis
          </p>

          <p className="text-amber-700 mt-1">
            Aktuell sind dies Vorschau-Einstellungen. Damit normale Benutzer ihr Design dauerhaft speichern können, ergänzen wir als nächstes User-Designsettings in der Datenbank.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map(
            (option) => {
              const active =
                theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setTheme(
                      option.value
                    )
                  }
                  className={`text-left border rounded-3xl p-6 transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="text-xl font-semibold">
                    {option.label}
                  </h3>

                  <p className={active ? "text-zinc-200 mt-2" : "text-zinc-500 mt-2"}>
                    {option.description}
                  </p>
                </button>
              );
            }
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3">
            Akzentfarbe
          </h3>

          <div className="flex flex-wrap gap-2">
            {accentOptions.map(
              (option) => {
                const active =
                  accentColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setAccentColor(
                        option.value
                      )
                    }
                    className={`px-4 py-2 rounded-xl transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 hover:bg-zinc-200"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
          <span>
            <span className="font-medium block">
              Kompakter Modus
            </span>

            <span className="text-sm text-zinc-500">
              Reduziert vertikale Abstände.
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
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          App-Information
        </h2>

        <p className="text-zinc-500 mt-1">
          Diese Werte werden zentral durch Administratoren verwaltet.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              App
            </p>

            <p className="font-semibold mt-1">
              {settings.appName ||
                "Intranet"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {settings.companyName ||
                "Intern"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Version
            </p>

            <p className="font-semibold mt-1">
              {settings.showVersion
                ? settings.appVersion ||
                  settings.version ||
                  "0.1.0"
                : "Ausgeblendet"}
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mt-6">
          Standarddesign:{" "}
          {appSettingsRepository.getThemeLabel(
            settings.theme
          )}
          {" · "}
          Akzent:{" "}
          {appSettingsRepository.getAccentColorLabel(
            settings.accentColor
          )}
        </p>
      </section>
    </div>
  );
}