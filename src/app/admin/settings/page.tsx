"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useAppSettings,
} from "../../../hooks/useAppSettings";

import {
  canViewAdmin,
} from "../../../lib/permissions";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

import PageHero from "../../../components/PageHero";

import StatCard from "../../../components/StatCard";

import type {
  AppAccentColor,
  AppDefaultUserRole,
  AppSettings,
  AppTheme,
} from "../../../types/settings";

type ThemeOption = {
  value: AppTheme;
  label: string;
  description: string;
};

type AccentOption = {
  value: AppAccentColor;
  label: string;
};

type RoleOption = {
  value: AppDefaultUserRole;
  label: string;
  description: string;
};

const themeOptions: ThemeOption[] = [
  {
    value: "modern",
    label: "Modern",
    description: "Schwarze Sidebar mit heller Inhaltsfläche.",
  },
  {
    value: "dark",
    label: "Dunkel",
    description: "Dunklere Oberfläche für die Anwendung.",
  },
  {
    value: "system",
    label: "System",
    description: "Richtet sich nach der Systemeinstellung.",
  },
];

const accentOptions: AccentOption[] = [
  {
    value: "zinc",
    label: "Neutral",
  },
  {
    value: "blue",
    label: "Blau",
  },
  {
    value: "indigo",
    label: "Indigo",
  },
  {
    value: "emerald",
    label: "Emerald",
  },
  {
    value: "amber",
    label: "Amber",
  },
  {
    value: "red",
    label: "Rot",
  },
];

const roleOptions: RoleOption[] = [
  {
    value: "employee",
    label: "Mitarbeiter",
    description: "Neue Benutzer starten mit normalen Mitarbeiterrechten.",
  },
  {
    value: "department_lead",
    label: "Abteilungsleiter",
    description: "Neue Benutzer starten mit Abteilungsleiter-Rolle.",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Neue Benutzer starten direkt mit Admin-Rechten.",
  },
];

function getDefaultEditableSettings(
  settings: AppSettings
) {
  return {
    appName:
      settings.appName ||
      "Intranet",

    companyName:
      settings.companyName ||
      "Intern",

    appVersion:
      settings.appVersion ||
      settings.version ||
      "0.1.0",

    theme:
      settings.theme ||
      "modern",

    darkMode:
      Boolean(
        settings.darkMode
      ),

    accentColor:
      settings.accentColor ||
      settings.appAccentColor ||
      "zinc",

    compactMode:
      Boolean(
        settings.compactMode
      ),

    showVersion:
      Boolean(
        settings.showVersion
      ),

    showDemoHints:
      Boolean(
        settings.showDemoHints
      ),

    enableTicketComments:
      Boolean(
        settings.enableTicketComments
      ),

    enableTicketTemplates:
      Boolean(
        settings.enableTicketTemplates
      ),

    enableActivityLog:
      Boolean(
        settings.enableActivityLog
      ),

    defaultUserRole:
      settings.defaultUserRole ||
      "employee",
  };
}

function getThemeLabel(
  theme: AppTheme
) {
  return (
    themeOptions.find(
      (option) =>
        option.value === theme
    )?.label ||
    theme
  );
}

function getAccentLabel(
  accentColor: AppAccentColor
) {
  return (
    accentOptions.find(
      (option) =>
        option.value === accentColor
    )?.label ||
    accentColor
  );
}

function getRoleLabel(
  role: AppDefaultUserRole
) {
  return (
    roleOptions.find(
      (option) =>
        option.value === role
    )?.label ||
    role
  );
}

export default function AdminSettingsPage() {
  const {
    settings,
    loading,
    updateSettings,
    resetSettings,
  } =
    useAppSettings();

  const [mounted, setMounted] =
    useState(false);

  const [form, setForm] =
    useState(
      getDefaultEditableSettings(
        settings
      )
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );
  }, []);

  useEffect(() => {
    setForm(
      getDefaultEditableSettings(
        settings
      )
    );
  }, [
    settings,
  ]);

  function updateField<
    TKey extends keyof typeof form
  >(
    key: TKey,
    value: typeof form[TKey]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

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
        appName:
          form.appName.trim() ||
          "Intranet",

        companyName:
          form.companyName.trim() ||
          "Intern",

        appVersion:
          form.appVersion.trim() ||
          "0.1.0",

        version:
          form.appVersion.trim() ||
          "0.1.0",

        theme:
          form.theme,

        darkMode:
          form.theme === "dark"
            ? true
            : form.darkMode,

        accentColor:
          form.accentColor,

        appAccentColor:
          form.accentColor,

        compactMode:
          form.compactMode,

        showVersion:
          form.showVersion,

        showDemoHints:
          form.showDemoHints,

        enableTicketComments:
          form.enableTicketComments,

        enableTicketTemplates:
          form.enableTicketTemplates,

        enableActivityLog:
          form.enableActivityLog,

        defaultUserRole:
          form.defaultUserRole,
      });

      setMessage(
        "Systemeinstellungen wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Systemeinstellungen konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleReset() {
    const confirmed =
      confirm(
        "Systemeinstellungen wirklich auf Standard zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

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

      await resetSettings();

      setMessage(
        "Systemeinstellungen wurden zurückgesetzt."
      );
    } catch (resetError) {
      console.error(
        resetError
      );

      setError(
        resetError instanceof Error
          ? resetError.message
          : "Systemeinstellungen konnten nicht zurückgesetzt werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Systemeinstellungen"
        description="Globale Anwendungseinstellungen, Darstellung, Features und Standardwerte zentral verwalten."
        badges={[
          {
            label:
              form.appName ||
              "Intranet",
          },
          {
            label:
              form.companyName ||
              "Intern",
          },
          {
            label:
              `Version ${form.appVersion || "0.1.0"}`,
          },
          {
            label:
              getThemeLabel(
                form.theme
              ),
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void handleReset()
              }
              disabled={
                saving ||
                loading
              }
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition disabled:opacity-50"
            >
              Zurücksetzen
            </button>

            <button
              type="submit"
              form="admin-settings-form"
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
            Systemeinstellungen werden geladen...
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

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="App"
          value={form.appName || "Intranet"}
          description={form.companyName || "Intern"}
          icon="🧭"
          tone="indigo"
        />

        <StatCard
          label="Design"
          value={getThemeLabel(
            form.theme
          )}
          description={`Akzent: ${getAccentLabel(
            form.accentColor
          )}`}
          icon="🎨"
        />

        <StatCard
          label="Features"
          value={
            [
              form.enableTicketComments,
              form.enableTicketTemplates,
              form.enableActivityLog,
            ].filter(Boolean).length
          }
          description="Aktive Module"
          icon="⚙️"
          tone="green"
        />

        <StatCard
          label="Standardrolle"
          value={getRoleLabel(
            form.defaultUserRole
          )}
          description="Für neue Benutzer"
          icon="👤"
          tone="blue"
        />
      </div>

      <form
        id="admin-settings-form"
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="space-y-8"
      >
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">
              Allgemein
            </h2>

            <p className="text-zinc-500 mt-1">
              Name, Firma und Version der Anwendung.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                App-Name
              </label>

              <input
                value={form.appName}
                onChange={(event) =>
                  updateField(
                    "appName",
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Intranet"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firmenname
              </label>

              <input
                value={form.companyName}
                onChange={(event) =>
                  updateField(
                    "companyName",
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
                value={form.appVersion}
                onChange={(event) =>
                  updateField(
                    "appVersion",
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="0.1.0"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">
              Darstellung
            </h2>

            <p className="text-zinc-500 mt-1">
              Globales Design und Anzeigeoptionen für die Oberfläche.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            {themeOptions.map(
              (option) => {
                const active =
                  form.theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateField(
                        "theme",
                        option.value
                      )
                    }
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {option.label}
                    </p>

                    <p className={active ? "text-zinc-300 text-sm mt-2" : "text-zinc-500 text-sm mt-2"}>
                      {option.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold">
              Akzentfarbe
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-4">
              {accentOptions.map(
                (option) => {
                  const active =
                    form.accentColor === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateField(
                          "accentColor",
                          option.value
                        )
                      }
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-8">
            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Dark Mode
                </span>

                <span className="text-sm text-zinc-500">
                  Dunkle Darstellung erzwingen.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.darkMode}
                onChange={(event) =>
                  updateField(
                    "darkMode",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Kompakter Modus
                </span>

                <span className="text-sm text-zinc-500">
                  Reduzierte Abstände.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.compactMode}
                onChange={(event) =>
                  updateField(
                    "compactMode",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Version anzeigen
                </span>

                <span className="text-sm text-zinc-500">
                  Version in der Oberfläche anzeigen.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.showVersion}
                onChange={(event) =>
                  updateField(
                    "showVersion",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">
              Features
            </h2>

            <p className="text-zinc-500 mt-1">
              Globale Module und Funktionsbereiche aktivieren oder deaktivieren.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Ticket-Kommentare
                </span>

                <span className="text-sm text-zinc-500">
                  Kommentare bei Tickets erlauben.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.enableTicketComments}
                onChange={(event) =>
                  updateField(
                    "enableTicketComments",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Ticket-Vorlagen
                </span>

                <span className="text-sm text-zinc-500">
                  Vorlagen-Modul für Tickets aktivieren.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.enableTicketTemplates}
                onChange={(event) =>
                  updateField(
                    "enableTicketTemplates",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Aktivitätsprotokoll
                </span>

                <span className="text-sm text-zinc-500">
                  Aktivitäten im System protokollieren und anzeigen.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.enableActivityLog}
                onChange={(event) =>
                  updateField(
                    "enableActivityLog",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="font-medium block">
                  Demo-Hinweise
                </span>

                <span className="text-sm text-zinc-500">
                  Hilfetexte und Demo-Hinweise anzeigen.
                </span>
              </span>

              <input
                type="checkbox"
                checked={form.showDemoHints}
                onChange={(event) =>
                  updateField(
                    "showDemoHints",
                    event.target.checked
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">
              Benutzer
            </h2>

            <p className="text-zinc-500 mt-1">
              Standardwerte für neue Benutzer.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            {roleOptions.map(
              (option) => {
                const active =
                  form.defaultUserRole === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateField(
                        "defaultUserRole",
                        option.value
                      )
                    }
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {option.label}
                    </p>

                    <p className={active ? "text-zinc-300 text-sm mt-2" : "text-zinc-500 text-sm mt-2"}>
                      {option.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                void handleReset()
              }
              disabled={
                saving ||
                loading
              }
              className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              Auf Standard zurücksetzen
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loading
              }
              className="bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : "Systemeinstellungen speichern"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}