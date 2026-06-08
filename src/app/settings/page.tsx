"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  useAppSettings,
} from "../../hooks/useAppSettings";
import {
  useUserSettings,
} from "../../hooks/useUserSettings";
import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";
import {
  getCachedCurrentUser,
} from "../../lib/currentUserRepository";
import {
  userSettingsRepository,
} from "../../lib/userSettingsRepository";
import type {
  AppAccentColor,
  AppTheme,
} from "../../types/settings";

type ThemeOption = {
  value: AppTheme;
  label: string;
  description: string;
  icon: string;
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
    description: "Velunis Look mit dunkler Navigation und heller Arbeitsfläche.",
    icon: "✨",
  },
  {
    value: "light",
    label: "Hell",
    description: "Helle Sidebar, helle Topbar und helle Arbeitsfläche.",
    icon: "☀️",
  },
  {
    value: "dark",
    label: "Dunkel",
    description: "Dunkle Oberfläche für konzentriertes Arbeiten.",
    icon: "🌙",
  },
  {
    value: "system",
    label: "System",
    description: "Folgt automatisch der Systemeinstellung deines Geräts.",
    icon: "💻",
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

  const [theme, setTheme] = useState(userSettings.theme);
  const [accentColor, setAccentColor] = useState(
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

  const selectedTheme = useMemo(
    () =>
      themeOptions.find((option) => option.value === theme) ||
      themeOptions[0],
    [
      theme,
    ],
  );

  const loading = appSettingsLoading || userSettingsLoading;

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

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Mein Bereich"
        title="Einstellungen"
        description="Persönliche Darstellung, Kontoübersicht und zentrale App-Informationen."
        badges={[
          {
            label: getThemeLabel(userSettings.theme),
          },
          {
            label: getAccentLabel(userSettings.accentColor),
          },
          {
            label: userSettings.compactMode ? "Kompakt" : "Standard",
          },
          {
            label: getRoleLabel(user?.role),
          },
        ]}
        actions={
          <>
            <Link
              href="/change-password"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Passwort ändern
            </Link>

            <button
              type="submit"
              form="user-settings-form"
              disabled={saving || loading}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-bold"
            >
              {saving ? "Speichert..." : "Speichern"}
            </button>
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Einstellungen werden geladen..."
          description="Benutzerprofil, Darstellung und App-Informationen werden vorbereitet."
        />
      )}

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">
            {message}
          </p>
        </section>
      )}

      {(error || userSettingsError) && (
        <EmptyState
          icon="⚠️"
          title="Einstellungen konnten nicht gespeichert werden"
          description={error || userSettingsError || "Unbekannter Fehler."}
        />
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Theme"
              value={getThemeLabel(userSettings.theme)}
              description="Aktuelle Oberfläche"
              icon="🎨"
              tone="indigo"
            />

            <StatCard
              label="Akzent"
              value={getAccentLabel(userSettings.accentColor)}
              description="Persönliche Markenfarbe"
              icon="✨"
              tone="blue"
            />

            <StatCard
              label="Modus"
              value={userSettings.compactMode ? "Kompakt" : "Standard"}
              description="Abstände und Dichte"
              icon="📐"
              tone="orange"
            />

            <StatCard
              label="Rolle"
              value={getRoleLabel(user?.role)}
              description="Aktueller Benutzer"
              icon="👤"
              tone="green"
            />
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Mein Konto
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Deine aktuell angemeldeten Benutzerinformationen.
                    </p>
                  </div>

                  <Link
                    href="/change-password"
                    className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                  >
                    Passwort ändern
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-zinc-50 rounded-2xl p-5">
                    <p className="text-xs text-zinc-500">
                      Name
                    </p>
                    <p className="font-black text-zinc-950 mt-1 break-words">
                      {user?.name || "Unbekannt"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-5">
                    <p className="text-xs text-zinc-500">
                      E-Mail
                    </p>
                    <p className="font-black text-zinc-950 mt-1 break-words">
                      {user?.email || "Unbekannt"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-5">
                    <p className="text-xs text-zinc-500">
                      Rolle
                    </p>
                    <p className="font-black text-zinc-950 mt-1">
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-5">
                    <p className="text-xs text-zinc-500">
                      Firma
                    </p>
                    <p className="font-black text-zinc-950 mt-1">
                      {user?.company || "Intern"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-5 md:col-span-2">
                    <p className="text-xs text-zinc-500">
                      Abteilung
                    </p>
                    <p className="font-black text-zinc-950 mt-1">
                      {user?.department || "Keine Abteilung"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form
              id="user-settings-form"
              onSubmit={(event) => void handleSubmit(event)}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-8 overflow-hidden relative"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Darstellung
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Diese Einstellungen gelten nur für deinen Benutzer.
                    </p>
                  </div>

                  <div
                    className={`rounded-3xl border p-4 min-w-[220px] ${getThemePreviewClass(
                      theme,
                    )}`}
                  >
                    <p className="text-xs opacity-60">
                      Persönliche Vorschau
                    </p>

                    <div className="flex items-center gap-3 mt-4">
                      <div
                        className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${selectedAccent.gradient}`}
                      />

                      <div>
                        <p className="font-black">
                          Velunis
                        </p>
                        <p className="text-sm opacity-60">
                          {selectedAccent.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="mt-8">
                  <h3 className="text-xl font-black">
                    Theme
                  </h3>

                  <p className="text-zinc-500 mt-1">
                    Wähle, wie die Oberfläche für dich dargestellt werden soll.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
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
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">
                              {option.icon}
                            </span>

                            <div>
                              <h4 className="font-black">
                                {option.label}
                              </h4>

                              <p className="text-sm text-zinc-500 mt-2 leading-6">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="text-xl font-black">
                    Akzentfarbe
                  </h3>

                  <p className="text-zinc-500 mt-1">
                    Wird für deine persönlichen Akzente gespeichert.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
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
                          <div className="flex items-start gap-4">
                            <span
                              className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${option.gradient} shrink-0`}
                            />

                            <div>
                              <h4 className="font-black">
                                {option.label}
                              </h4>

                              <p className="text-sm text-zinc-500 mt-2 leading-6">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-8">
                  <label className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-3xl p-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(event) =>
                        setCompactMode(event.target.checked)
                      }
                      className="h-5 w-5 mt-1 accent-indigo-600"
                    />

                    <span>
                      <span className="block font-black">
                        Kompakter Modus
                      </span>
                      <span className="block text-sm text-zinc-500 mt-1 leading-6">
                        Reduziert vertikale Abstände und macht Listen dichter.
                      </span>
                    </span>
                  </label>
                </section>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8 pt-6 border-t border-zinc-100">
                  <p className="text-sm text-zinc-500">
                    Aktuell gespeichert:{" "}
                    <strong className="text-zinc-700">
                      {userSettingsRepository.getThemeLabel(userSettings.theme)}
                    </strong>
                    {" · "}
                    <strong className="text-zinc-700">
                      {userSettingsRepository.getAccentColorLabel(
                        userSettings.accentColor,
                      )}
                    </strong>
                    {" · "}
                    <strong className="text-zinc-700">
                      {userSettings.compactMode ? "Kompakt" : "Standard"}
                    </strong>
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 font-bold"
                    >
                      Änderungen verwerfen
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
                    >
                      {saving
                        ? "Speichert..."
                        : "Persönliche Einstellungen speichern"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black">
                  App-Information
                </h2>

                <p className="text-zinc-500 mt-1">
                  Diese Werte werden zentral durch Administratoren verwaltet.
                </p>
              </div>

              <Link
                href="/admin/settings"
                className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition font-bold shrink-0"
              >
                Systemeinstellungen öffnen
              </Link>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-xs text-zinc-500">
                  App
                </p>
                <p className="font-black text-zinc-950 mt-1">
                  {appSettings.appName || "Intranet"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-xs text-zinc-500">
                  Firma
                </p>
                <p className="font-black text-zinc-950 mt-1">
                  {appSettings.companyName || "Velunis"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-xs text-zinc-500">
                  Version
                </p>
                <p className="font-black text-zinc-950 mt-1">
                  {appSettings.showVersion
                    ? appSettings.appVersion ||
                      appSettings.version ||
                      "0.1.0"
                    : "Ausgeblendet"}
                </p>
              </div>
            </div>

            <p className="relative text-sm text-zinc-500 mt-5">
              Systemwerte:{" "}
              <strong className="text-zinc-700">
                {appSettings.appName || "Intranet"}
              </strong>
              {" · "}
              <strong className="text-zinc-700">
                {appSettings.companyName || "Velunis"}
              </strong>
              {" · "}
              <strong className="text-zinc-700">
                {appSettingsRepository.getDefaultUserRoleLabel(
                  appSettings.defaultUserRole,
                )}
              </strong>
            </p>
          </section>
        </>
      )}
    </div>
  );
}