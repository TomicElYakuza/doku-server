"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useAppSettings,
} from "../../hooks/useAppSettings";

import {
  canManageSettings,
} from "../../lib/permissions";

import AccessDeniedCard from "../../components/AccessDeniedCard";

import type {
  AppSettings,
} from "../../types/settings";

type ThemeOption = {
  value: string;
  label: string;
  description: string;
};

type AccentOption = {
  value: string;
  label: string;
};

const themeOptions: ThemeOption[] = [
  {
    value:
      "modern",

    label:
      "Modern",

    description:
      "Schwarze Sidebar und Topbar mit heller Inhaltsfläche.",
  },
  {
    value:
      "light",

    label:
      "Hell",

    description:
      "Klassische helle Oberfläche.",
  },
  {
    value:
      "dark",

    label:
      "Dunkel",

    description:
      "Dunkle Oberfläche für die gesamte Anwendung.",
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
      "red",

    label:
      "Rot",
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
      "indigo",

    label:
      "Indigo",
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

    version:
      settings.version ||
      settings.appVersion ||
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

    appAccentColor:
      settings.appAccentColor ||
      settings.accentColor ||
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
  };
}

export default function SettingsPage() {
  const {
    settings,
    loading,
    updateSettings,
    resetSettings,
  } =
    useAppSettings();

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

    if (!canManageSettings()) {
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

      const updates: Partial<AppSettings> = {
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
      };

      await updateSettings(
        updates
      );

      setMessage(
        "Einstellungen wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Einstellungen konnten nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleReset() {
    if (!canManageSettings()) {
      return;
    }

    const confirmed =
      confirm(
        "Einstellungen wirklich auf Standard zurücksetzen?"
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
        "Einstellungen wurden zurückgesetzt."
      );
    } catch (resetError) {
      console.error(
        resetError
      );

      setError(
        resetError instanceof Error
          ? resetError.message
          : "Einstellungen konnten nicht zurückgesetzt werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (!canManageSettings()) {
    return (
      <AccessDeniedCard />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Einstellungen
          </h1>

          <p className="text-zinc-500 mt-2">
            App-Name, Design, Darstellung und Features zentral aus PostgreSQL konfigurieren.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void handleReset()
          }
          disabled={saving}
          className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
        >
          Zurücksetzen
        </button>
      </div>

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

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="space-y-8"
      >
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Allgemein
            </h2>

            <p className="text-zinc-500 mt-1">
              Name und Basisinformationen der Anwendung.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
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
                Firma
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

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Design
            </h2>

            <p className="text-zinc-500 mt-1">
              Modern nutzt schwarze Topbar und Sidebar. Dark Mode macht die gesamte App dunkel.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {themeOptions.map(
              (option) => {
                const active =
                  form.theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateField(
                        "theme",
                          option.value as typeof form.theme
                      );

                      updateField(
                        "darkMode",
                        option.value === "dark"
                      );
                    }}
                    className={`text-left border rounded-3xl p-6 transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h3 className="text-xl font-semibold">
                      {option.label}
                    </h3>

                    <p className={`mt-2 ${
                      active
                        ? "text-zinc-200"
                        : "text-zinc-500"
                    }`}>
                      {option.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <label className="block mb-3 font-medium">
                Akzentfarbe
              </label>

              <div className="flex flex-wrap gap-3">
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
  option.value as typeof form.accentColor
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

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
                <span>
                  <span className="block font-medium">
                    Kompakter Modus
                  </span>

                  <span className="block text-sm text-zinc-500 mt-1">
                    Reduziert vertikale Abstände.
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

              <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
                <span>
                  <span className="block font-medium">
                    Version anzeigen
                  </span>

                  <span className="block text-sm text-zinc-500 mt-1">
                    Zeigt die App-Version in unterstützten Komponenten.
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
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Features
            </h2>

            <p className="text-zinc-500 mt-1">
              Module ein- oder ausschalten, ohne alte LocalStorage-Logik.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
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

            <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="block font-medium">
                  Ticket-Vorlagen
                </span>

                <span className="block text-sm text-zinc-500 mt-1">
                  Wiederverwendbare Ticket-Vorlagen aktivieren.
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

            <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="block font-medium">
                  Aktivitätsprotokoll
                </span>

                <span className="block text-sm text-zinc-500 mt-1">
                  Systemaktivitäten anzeigen.
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

            <label className="flex items-center justify-between gap-5 bg-zinc-50 rounded-2xl p-5">
              <span>
                <span className="block font-medium">
                  Demo-Hinweise
                </span>

                <span className="block text-sm text-zinc-500 mt-1">
                  Hilfetexte und Hinweise anzeigen.
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

        <section className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {saving
              ? "Speichert..."
              : "Einstellungen speichern"}
          </button>

          <button
            type="button"
            onClick={() =>
              setForm(
                getDefaultEditableSettings(
                  settings
                )
              )
            }
            disabled={saving}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Änderungen verwerfen
          </button>
        </section>
      </form>
    </div>
  );
}