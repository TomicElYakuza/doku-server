"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
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
  description: string;
  gradient: string;
};

const themeOptions: ThemeOption[] = [
  {
    value: "modern",
    label: "Modern",
    description:
      "Velunis Look mit dunkler Navigation und heller Arbeitsfläche.",
  },
  {
    value: "light",
    label: "Hell",
    description:
      "Helle Sidebar, helle Topbar und helle Arbeitsfläche.",
  },
  {
    value: "dark",
    label: "Dunkel",
    description:
      "Dunkle Oberfläche für konzentriertes Arbeiten.",
  },
  {
    value: "system",
    label: "System",
    description:
      "Folgt automatisch der Systemeinstellung deines Geräts.",
  },
];

const accentOptions: AccentOption[] = [
  {
    value: "velunis",
    label: "Velunis Blau/Lila",
    description: "Empfohlenes Firmenbranding.",
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
  },
  {
    value: "blue",
    label: "Blau",
    description: "Klar und technisch.",
    gradient: "from-blue-600 to-blue-700",
  },
  {
    value: "purple",
    label: "Lila",
    description: "Modern und kreativ.",
    gradient: "from-purple-600 to-fuchsia-600",
  },
  {
    value: "indigo",
    label: "Indigo",
    description: "Ruhig und digital.",
    gradient: "from-indigo-600 to-indigo-700",
  },
  {
    value: "emerald",
    label: "Emerald",
    description: "Frisch und statusorientiert.",
    gradient: "from-emerald-600 to-green-600",
  },
  {
    value: "amber",
    label: "Amber",
    description: "Warm und auffällig.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    value: "zinc",
    label: "Neutral",
    description: "Minimal ohne starke Markenfarbe.",
    gradient: "from-zinc-700 to-zinc-950",
  },
];

function getThemeLabel(theme: AppTheme) {
  return userSettingsRepository.getThemeLabel(theme);
}

function getAccentLabel(accentColor: AppAccentColor) {
  return userSettingsRepository.getAccentColorLabel(accentColor);
}

function getThemePreviewClass(theme: AppTheme) {
  if (theme === "dark") {
    return "bg-zinc-950 text-white border-zinc-800";
  }

  if (theme === "light") {
    return "bg-white text-zinc-950 border-zinc-200";
  }

  if (theme === "system") {
    return "bg-gradient-to-br from-white via-zinc-100 to-zinc-950 text-zinc-950 border-zinc-300";
  }

  return "bg-[#060711] text-white border-white/10";
}

function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

export default function SettingsPage() {
  const {
    settings: appSettings,
    loading: appSettingsLoading,
  } = useAppSettings();

  const {
    settings: userSettings,
    loading: userSettingsLoading,
    error: userSettingsError,
    updateSettings,
  } = useUserSettings();

  const [theme, setTheme] = useState<AppTheme>(userSettings.theme);
  const [accentColor, setAccentColor] = useState<AppAccentColor>(
    userSettings.accentColor,
  );
  const [compactMode, setCompactMode] = useState(
    userSettings.compactMode,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = getCachedCurrentUser();

  useEffect(() => {
    setTheme(userSettings.theme);
    setAccentColor(userSettings.accentColor);
    setCompactMode(userSettings.compactMode);
  }, [
    userSettings,
  ]);

  const selectedAccent = useMemo(
    () =>
      accentOptions.find((option) => option.value === accentColor) ||
      accentOptions[0],
    [
      accentColor,
    ],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await updateSettings({
        theme,
        accentColor,
        compactMode,
      });

      setMessage("Persönliche Einstellungen wurden gespeichert.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Persönliche Einstellungen konnten nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTheme(userSettings.theme);
    setAccentColor(userSettings.accentColor);
    setCompactMode(userSettings.compactMode);
    setMessage("");
    setError("");
  }

  const loading = appSettingsLoading || userSettingsLoading;

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Benutzerbereich"
        title="Einstellungen"
        description="Passe deine persönliche Darstellung, Akzentfarbe und kompakte Ansicht an."
        badges={[
          {
            label: `Theme: ${getThemeLabel(theme)}`,
          },
          {
            label: `Akzent: ${getAccentLabel(accentColor)}`,
          },
          {
            label: compactMode ? "Kompakt" : "Standardabstände",
          },
        ]}
        actions={
          <>
            <Link
              href="/settings/password"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
            >
              Passwort ändern
            </Link>

            <button
              type="submit"
              form="personal-settings-form"
              disabled={saving || loading}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-bold"
            >
              {saving ? "Speichert..." : "Speichern"}
            </button>
          </>
        }
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
            {error || userSettingsError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Benutzer"
          value={user?.name || "Unbekannt"}
          description={getRoleLabel(user?.role)}
          icon="👤"
          tone="indigo"
        />
        <StatCard
          label="Theme"
          value={getThemeLabel(theme)}
          description="Persönliche Darstellung"
          icon="🎨"
          tone="purple"
        />
        <StatCard
          label="Akzent"
          value={getAccentLabel(accentColor)}
          description="Persönliche Farbe"
          icon="🌈"
          tone="blue"
        />
        <StatCard
          label="Layout"
          value={compactMode ? "Kompakt" : "Standard"}
          description="Abstände im Interface"
          icon="↔️"
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Mein Konto
              </h2>
              <p className="text-zinc-500 mt-1">
                Deine aktuell angemeldeten Benutzerinformationen.
              </p>
            </div>

            <Link
              href="/settings/password"
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
            >
              Passwort ändern
            </Link>
          </div>

          <div className="space-y-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Name
              </p>
              <p className="font-bold mt-1">
                {user?.name || "Unbekannt"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                E-Mail
              </p>
              <p className="font-bold mt-1 break-all">
                {user?.email || "Unbekannt"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Rolle
              </p>
              <p className="font-bold mt-1">
                {getRoleLabel(user?.role)}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Firma
              </p>
              <p className="font-bold mt-1">
                {user?.company || "Intern"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Abteilung
              </p>
              <p className="font-bold mt-1">
                {user?.department || "Keine Abteilung"}
              </p>
            </div>
          </div>
        </section>

        <form
          id="personal-settings-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-8 xl:col-span-2"
        >
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Darstellung
              </h2>
              <p className="text-zinc-500 mt-1">
                Diese Einstellungen gelten nur für deinen Benutzer.
              </p>
            </div>

            <div
              className={`rounded-3xl bg-gradient-to-br ${selectedAccent.gradient} text-white p-5 min-w-72 app-brand-shadow`}
            >
              <p className="text-xs uppercase tracking-[0.22em] font-black text-white/70">
                Persönliche Vorschau
              </p>
              <p className="text-2xl font-black mt-2">
                Velunis
              </p>
              <p className="text-sm text-white/75 mt-1">
                {selectedAccent.label}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold">
              Theme
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Wähle, wie die Oberfläche für dich dargestellt werden soll.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
              {themeOptions.map((option) => {
                const active = theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-border app-accent-soft ring-4 ring-indigo-500/10"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`h-16 rounded-2xl border mb-4 ${getThemePreviewClass(
                        option.value,
                      )}`}
                    />

                    <h4 className="font-black text-zinc-950">
                      {option.label}
                    </h4>
                    <p className="text-sm text-zinc-500 mt-2">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold">
              Akzentfarbe
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Wird für deine persönlichen Akzente gespeichert.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
              {accentOptions.map((option) => {
                const active = accentColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAccentColor(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-border app-accent-soft ring-4 ring-indigo-500/10"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`h-12 rounded-2xl bg-gradient-to-r ${option.gradient} shadow-sm`}
                    />

                    <h4 className="font-black text-zinc-950 mt-4">
                      {option.label}
                    </h4>
                    <p className="text-sm text-zinc-500 mt-1">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label
            className={`flex items-start gap-4 rounded-3xl border p-5 transition cursor-pointer ${
              compactMode
                ? "app-accent-border app-accent-soft"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
          >
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(event) => setCompactMode(event.target.checked)}
              className="h-5 w-5 mt-1 accent-indigo-600"
            />

            <span>
              <span className="block font-bold text-zinc-950">
                Kompakter Modus
              </span>
              <span className="block text-sm text-zinc-500 mt-1">
                Reduziert vertikale Abstände und macht Listen dichter.
              </span>
            </span>
          </label>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
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
              disabled={saving || loading}
              className="app-accent-bg text-white px-6 py-4 rounded-2xl transition disabled:opacity-50 font-black app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : "Persönliche Einstellungen speichern"}
            </button>
          </div>

          <p className="text-sm text-zinc-500">
            Aktuell gespeichert:{" "}
            <span className="font-semibold text-zinc-900">
              {userSettingsRepository.getThemeLabel(userSettings.theme)}
            </span>
            {" · "}
            <span className="font-semibold text-zinc-900">
              {userSettingsRepository.getAccentColorLabel(
                userSettings.accentColor,
              )}
            </span>
            {" · "}
            <span className="font-semibold text-zinc-900">
              {userSettings.compactMode ? "Kompakt" : "Standard"}
            </span>
          </p>
        </form>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              App-Information
            </h2>
            <p className="text-zinc-500 mt-1">
              Diese Werte werden zentral durch Administratoren verwaltet.
            </p>
          </div>

          <Link
            href="/admin/settings"
            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
          >
            Systemeinstellungen öffnen
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-50 rounded-3xl p-5">
            <p className="text-sm text-zinc-500">
              App
            </p>
            <p className="font-bold mt-2">
              {appSettings.appName || "Intranet"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-3xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>
            <p className="font-bold mt-2">
              {appSettings.companyName || "Velunis"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-3xl p-5">
            <p className="text-sm text-zinc-500">
              Version
            </p>
            <p className="font-bold mt-2">
              {appSettings.showVersion
                ? appSettings.appVersion ||
                  appSettings.version ||
                  "0.1.0"
                : "Ausgeblendet"}
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          Systemwerte:{" "}
          <span className="font-semibold text-zinc-900">
            {appSettings.appName || "Intranet"}
          </span>
          {" · "}
          <span className="font-semibold text-zinc-900">
            {appSettings.companyName || "Velunis"}
          </span>
          {" · "}
          <span className="font-semibold text-zinc-900">
            {appSettingsRepository.getDefaultUserRoleLabel(
              appSettings.defaultUserRole,
            )}
          </span>
        </p>
      </section>
    </div>
  );
}