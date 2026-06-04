"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getCachedCurrentUser,
} from "../../lib/currentUserRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import {
  userSettingsRepository,
} from "../../lib/userSettingsRepository";

import {
  useAppSettings,
} from "../../hooks/useAppSettings";

import {
  useUserSettings,
} from "../../hooks/useUserSettings";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

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
      "light",

    label:
      "Hell",

    description:
      "Helle Oberfläche.",
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
      "green",

    label:
      "Grün",
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
      "orange",

    label:
      "Orange",
  },
  {
    value:
      "purple",

    label:
      "Lila",
  },
  {
    value:
      "red",

    label:
      "Rot",
  },
];

function getThemeLabel(
  theme: AppTheme
) {
  return userSettingsRepository.getThemeLabel(
    theme
  );
}

function getAccentLabel(
  accentColor: AppAccentColor
) {
  return userSettingsRepository.getAccentColorLabel(
    accentColor
  );
}

export default function SettingsPage() {
  const {
    settings:
      appSettings,
    loading:
      appSettingsLoading,
  } =
    useAppSettings();

  const {
    settings:
      userSettings,
    loading:
      userSettingsLoading,
    error:
      userSettingsError,
    updateSettings,
  } =
    useUserSettings();

  const [theme, setTheme] =
    useState<AppTheme>(
      userSettings.theme
    );

  const [accentColor, setAccentColor] =
    useState<AppAccentColor>(
      userSettings.accentColor
    );

  const [compactMode, setCompactMode] =
    useState(
      userSettings.compactMode
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const user =
    getCachedCurrentUser();

  useEffect(() => {
    setTheme(
      userSettings.theme
    );

    setAccentColor(
      userSettings.accentColor
    );

    setCompactMode(
      userSettings.compactMode
    );
  }, [
    userSettings,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setError(
        ""
      );

      await updateSettings({
        theme,
        accentColor,
        compactMode,
      });

      setMessage(
        "Persönliche Einstellungen wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Persönliche Einstellungen konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  function resetForm() {
    setTheme(
      userSettings.theme
    );

    setAccentColor(
      userSettings.accentColor
    );

    setCompactMode(
      userSettings.compactMode
    );

    setMessage(
      ""
    );

    setError(
      ""
    );
  }

  const loading =
    appSettingsLoading ||
    userSettingsLoading;

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Einstellungen"
        title="Persönliche Einstellungen"
        description="Konto, Darstellung und persönliche Oberfläche konfigurieren. Diese Einstellungen gelten nur für deinen Benutzer."
        badges={[
          {
            label:
              user?.name ||
              "Benutzer",
          },
          {
            label:
              user?.company ||
              "Intern",
          },
          {
            label:
              user?.department ||
              "Allgemein",
          },
          {
            label:
              getThemeLabel(
                theme
              ),
          },
        ]}
        actions={(
          <>
            <Link
              href="/change-password"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
            >
              Passwort ändern
            </Link>

            <button
              type="submit"
              form="personal-settings-form"
              disabled={
                saving ||
                loading
              }
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : "Speichern"}
            </button>
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Einstellungen werden geladen...
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-medium">
            {message}
          </p>
        </div>
      )}

      {(error || userSettingsError) && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <p className="text-red-700 font-medium">
            {error ||
              userSettingsError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Benutzer"
          value={user?.name || "Unbekannt"}
          description={user?.email || "Keine E-Mail"}
          icon="👤"
          tone="blue"
        />

        <StatCard
          label="Design"
          value={getThemeLabel(
            theme
          )}
          description={`Akzent: ${getAccentLabel(
            accentColor
          )}`}
          icon="🎨"
          tone="indigo"
        />

        <StatCard
          label="Darstellung"
          value={
            compactMode
              ? "Kompakt"
              : "Standard"
          }
          description="Persönlicher Layout-Modus"
          icon="📐"
        />

        <StatCard
          label="App"
          value={appSettings.appName || "Intranet"}
          description={
            appSettings.showVersion
              ? `Version ${
                  appSettings.appVersion ||
                  appSettings.version ||
                  "0.1.0"
                }`
              : appSettings.companyName ||
                "Intern"
          }
          icon="🧭"
          tone="green"
        />
      </div>

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

      <form
        id="personal-settings-form"
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-8"
      >
        <div>
          <h2 className="text-2xl font-semibold">
            Darstellung
          </h2>

          <p className="text-zinc-500 mt-1">
            Diese Einstellungen werden dauerhaft für deinen Benutzer gespeichert.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">
            Theme
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
        </div>

        <div>
          <h3 className="font-semibold mb-3">
            Akzentfarbe
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3">
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
                    className={`px-4 py-3 rounded-2xl transition ${
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

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Änderungen verwerfen
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {saving
              ? "Speichert..."
              : "Persönliche Einstellungen speichern"}
          </button>
        </div>

        <p className="text-sm text-zinc-400">
          Aktuell gespeichert:{" "}
          {userSettingsRepository.getThemeLabel(
            userSettings.theme
          )}
          {" · "}
          {userSettingsRepository.getAccentColorLabel(
            userSettings.accentColor
          )}
          {" · "}
          {userSettings.compactMode
            ? "Kompakt"
            : "Standard"}
        </p>
      </form>

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
              {appSettings.appName ||
                "Intranet"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {appSettings.companyName ||
                "Intern"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Version
            </p>

            <p className="font-semibold mt-1">
              {appSettings.showVersion
                ? appSettings.appVersion ||
                  appSettings.version ||
                  "0.1.0"
                : "Ausgeblendet"}
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mt-6">
          Globaler Standard:{" "}
          {appSettingsRepository.getThemeLabel(
            appSettings.theme
          )}
          {" · "}
          Akzent:{" "}
          {appSettingsRepository.getAccentColorLabel(
            appSettings.accentColor
          )}
        </p>
      </section>
    </div>
  );
}