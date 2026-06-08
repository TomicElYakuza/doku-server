"use client";

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
  useAppSettings,
} from "../../hooks/useAppSettings";
import {
  useUserSettings,
} from "../../hooks/useUserSettings";
import {
  userSettingsRepository,
} from "../../lib/userSettingsRepository";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import type {
  AppAccentColor,
  AppTheme,
} from "../../types/settings";
import type {
  User,
} from "../../types/user";

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
  previewClass: string;
};

const themeOptions: ThemeOption[] = [
  {
    value: "modern",
    label: "Modern",
    description:
      "Velunis Standard mit moderner Sidebar und klaren Flächen.",
    icon: "✨",
  },
  {
    value: "light",
    label: "Hell",
    description:
      "Helle Oberfläche mit leichter Sidebar und viel Weißraum.",
    icon: "☀️",
  },
  {
    value: "dark",
    label: "Dunkel",
    description:
      "Dunkle Oberfläche für angenehmes Arbeiten bei wenig Licht.",
    icon: "🌙",
  },
  {
    value: "system",
    label: "System",
    description:
      "Übernimmt die Darstellung deines Betriebssystems.",
    icon: "💻",
  },
];

const accentOptions: AccentOption[] = [
  {
    value: "zinc",
    label: "Neutral",
    description: "Schwarz/Weiß und sehr ruhig.",
    previewClass: "bg-zinc-900",
  },
  {
    value: "blue",
    label: "Blau",
    description: "Klar, technisch und professionell.",
    previewClass: "bg-blue-600",
  },
  {
    value: "indigo",
    label: "Indigo",
    description: "Velunis Blau/Lila Richtung.",
    previewClass: "bg-indigo-600",
  },
  {
    value: "purple",
    label: "Lila",
    description: "Modern, digital und markant.",
    previewClass: "bg-purple-600",
  },
  {
    value: "emerald",
    label: "Emerald",
    description: "Frisch und positiv.",
    previewClass: "bg-emerald-600",
  },
  {
    value: "green",
    label: "Grün",
    description: "Ruhig und statusorientiert.",
    previewClass: "bg-green-600",
  },
  {
    value: "amber",
    label: "Amber",
    description: "Warm und auffällig.",
    previewClass: "bg-amber-500",
  },
  {
    value: "orange",
    label: "Orange",
    description: "Dynamisch und aktiv.",
    previewClass: "bg-orange-600",
  },
  {
    value: "red",
    label: "Rot",
    description: "Stark und signalorientiert.",
    previewClass: "bg-red-600",
  },
];

function getThemeLabel(theme: AppTheme) {
  return userSettingsRepository.getThemeLabel(theme);
}

function getAccentLabel(accentColor: AppAccentColor) {
  return userSettingsRepository.getAccentColorLabel(accentColor);
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

function getRoleClass(role?: string) {
  if (role === "admin") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (role === "department_lead") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function getDepartmentLabel(user: User | null) {
  return user?.department || "Keine Abteilung";
}

function getCompanyLabel(user: User | null) {
  return user?.company || "Intern";
}

function getListViewLabel(view?: string) {
  if (view === "cards") {
    return "Karten";
  }

  return "Tabelle";
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

  const [currentUser, setCurrentUser] = useState<User | null>(
    getCachedCurrentUser(),
  );

  const [theme, setTheme] = useState<AppTheme>(
    userSettings.theme,
  );
  const [accentColor, setAccentColor] = useState<AppAccentColor>(
    userSettings.accentColor,
  );
  const [compactMode, setCompactMode] = useState(
    userSettings.compactMode,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTheme(userSettings.theme);
    setAccentColor(userSettings.accentColor);
    setCompactMode(userSettings.compactMode);
  }, [
    userSettings,
  ]);

  useEffect(() => {
    function handleCurrentUserUpdated() {
      setCurrentUser(getCachedCurrentUser());
    }

    window.addEventListener(
      "currentUserUpdated",
      handleCurrentUserUpdated,
    );

    return () => {
      window.removeEventListener(
        "currentUserUpdated",
        handleCurrentUserUpdated,
      );
    };
  }, []);

  const loading =
    appSettingsLoading ||
    userSettingsLoading;

  const hasChanges =
    theme !== userSettings.theme ||
    accentColor !== userSettings.accentColor ||
    compactMode !== userSettings.compactMode;

  const savedSummary = useMemo(
    () =>
      [
        getThemeLabel(userSettings.theme),
        getAccentLabel(userSettings.accentColor),
        userSettings.compactMode ? "Kompakt" : "Standard",
      ].join(" · "),
    [
      userSettings,
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

      setMessage(
        "Persönliche Einstellungen wurden gespeichert.",
      );
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
        eyebrow="Velunis Workspace"
        title="Einstellungen"
        description="Persönliche Darstellung, Theme, Akzentfarbe und Kontoinformationen für deinen Benutzer."
        badges={[
          {
            label: getThemeLabel(theme),
          },
          {
            label: getAccentLabel(accentColor),
          },
          {
            label: compactMode ? "Kompakt" : "Standard",
          },
          {
            label: hasChanges
              ? "Ungespeicherte Änderungen"
              : "Gespeichert",
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving || loading || !hasChanges}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition disabled:opacity-50 font-bold"
            >
              Änderungen verwerfen
            </button>

            <button
              type="submit"
              form="personal-settings-form"
              disabled={saving || loading || !hasChanges}
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
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {error || userSettingsError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Theme"
          value={getThemeLabel(theme)}
          description="Persönliche Darstellung"
          icon="🎨"
          tone="indigo"
        />

        <StatCard
          label="Akzentfarbe"
          value={getAccentLabel(accentColor)}
          description="Buttons, Fokus und Highlights"
          icon="✨"
          tone="purple"
        />

        <StatCard
          label="Layout"
          value={compactMode ? "Kompakt" : "Standard"}
          description="Abstände und Dichte"
          icon="📌"
          tone="blue"
        />

        <StatCard
          label="Status"
          value={hasChanges ? "Offen" : "Aktuell"}
          description={
            hasChanges
              ? "Bitte speichern"
              : "Keine Änderungen"
          }
          icon={hasChanges ? "â—" : "✓"}
          tone={hasChanges ? "orange" : "green"}
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-black">
                    Konto
                  </p>
                  <h2 className="text-2xl font-black mt-1">
                    Mein Konto
                  </h2>
                  <p className="text-zinc-500 mt-1">
                    Aktuell angemeldeter Benutzer.
                  </p>
                </div>

                <div className="h-12 w-12 rounded-2xl app-accent-bg text-white flex items-center justify-center text-xl app-brand-shadow">
                  👤
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Name
                  </p>
                  <p className="font-black mt-1">
                    {currentUser?.name || "Unbekannt"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    E-Mail
                  </p>
                  <p className="font-black mt-1 break-all">
                    {currentUser?.email || "Unbekannt"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Benutzer-ID
                  </p>
                  <p className="font-black mt-1 break-all">
                    {currentUser?.id || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Firma
                    </p>
                    <p className="font-black mt-1 line-clamp-1">
                      {getCompanyLabel(currentUser)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Abteilung
                    </p>
                    <p className="font-black mt-1 line-clamp-1">
                      {getDepartmentLabel(currentUser)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border font-bold ${getRoleClass(
                      currentUser?.role,
                    )}`}
                  >
                    {getRoleLabel(currentUser?.role)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              App-Information
            </h2>
            <p className="text-zinc-500 mt-1">
              Diese Werte werden zentral durch Administratoren verwaltet.
            </p>

            <div className="space-y-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  App
                </p>
                <p className="font-black mt-1">
                  {appSettings.appName || "Intranet"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Firma
                </p>
                <p className="font-black mt-1">
                  {appSettings.companyName || "Velunis"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Version
                </p>
                <p className="font-black mt-1">
                  {appSettings.showVersion
                    ? appSettings.appVersion ||
                      appSettings.version ||
                      "0.1.0"
                    : "Ausgeblendet"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Globale Defaults
                </p>
                <p className="font-black mt-1">
                  Tickets:{" "}
                  {getListViewLabel(
                    appSettings.defaultTicketView || "table",
                  )}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Wiki:{" "}
                  {getListViewLabel(
                    appSettings.defaultWikiView || "table",
                  )}
                </p>
              </div>
            </div>
          </section>
        </aside>

        <form
          id="personal-settings-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Darstellung
            </h2>
            <p className="text-zinc-500 mt-1">
              Diese Einstellungen werden dauerhaft für deinen Benutzer gespeichert.
            </p>

            <div className="mt-6">
              <h3 className="text-xl font-black">
                Theme
              </h3>
              <p className="text-zinc-500 mt-1">
                Wähle aus, wie hell oder dunkel dein Workspace dargestellt wird.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {themeOptions.map((option) => {
                  const active = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow border-transparent"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">
                          {option.icon}
                        </span>

                        <span>
                          <span className="block font-black">
                            {option.label}
                          </span>
                          <span
                            className={`block text-sm mt-2 ${
                              active
                                ? "text-white/75"
                                : "text-zinc-500"
                            }`}
                          >
                            {option.description}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Akzentfarbe
            </h2>
            <p className="text-zinc-500 mt-1">
              Die Akzentfarbe beeinflusst Buttons, Fokuszustände, Highlights und Preview-Flächen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {accentOptions.map((option) => {
                const active = accentColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAccentColor(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-bg text-white app-brand-shadow border-transparent"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-8 w-8 rounded-2xl border border-white/40 shadow-sm ${option.previewClass}`}
                      />

                      <span className="font-black">
                        {option.label}
                      </span>
                    </div>

                    <p
                      className={`text-sm mt-3 ${
                        active
                          ? "text-white/75"
                          : "text-zinc-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Layout
            </h2>
            <p className="text-zinc-500 mt-1">
              Passe die Dichte der Oberfläche an.
            </p>

            <label
              className={`flex items-start gap-4 rounded-3xl border p-5 cursor-pointer transition mt-6 ${
                compactMode
                  ? "app-accent-soft app-accent-border"
                  : "bg-white border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(event) =>
                  setCompactMode(event.target.checked)
                }
                className="h-5 w-5 mt-1 accent-indigo-600"
              />

              <span>
                <span className="block font-black text-zinc-950">
                  Kompakter Modus
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Reduziert vertikale Abstände und macht Listen dichter.
                </span>
              </span>
            </label>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Vorschau
              </h2>
              <p className="text-zinc-500 mt-1">
                So wirken Theme, Akzentfarbe und Dichte zusammen.
              </p>

              <div className="mt-6 rounded-3xl app-accent-bg text-white p-6 app-brand-shadow">
                <p className="text-sm text-white/70">
                  {appSettings.companyName || "Velunis"}
                </p>
                <h3 className="text-3xl font-black mt-2">
                  {appSettings.appName || "Intranet"}
                </h3>
                <p className="text-white/75 mt-3">
                  {getThemeLabel(theme)} · {getAccentLabel(accentColor)} ·{" "}
                  {compactMode ? "Kompakt" : "Standard"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-white/60">
                      Ansicht
                    </p>
                    <p className="font-black mt-1">
                      {getThemeLabel(theme)}
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-white/60">
                      Farbe
                    </p>
                    <p className="font-black mt-1">
                      {getAccentLabel(accentColor)}
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-white/60">
                      Modus
                    </p>
                    <p className="font-black mt-1">
                      {compactMode ? "Kompakt" : "Standard"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Aktuell gespeichert
                </p>
                <p className="font-black mt-1">
                  {savedSummary}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving || loading || !hasChanges}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-medium"
            >
              Änderungen verwerfen
            </button>

            <button
              type="submit"
              disabled={saving || loading || !hasChanges}
              className="app-accent-bg text-white px-6 py-4 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : "Persönliche Einstellungen speichern"}
            </button>
          </section>
        </form>
      </section>
    </div>
  );
}
