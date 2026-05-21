"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import {
  canManageSettings,
} from "../../lib/permissions";

import {
  saveSettingsResetActivity,
  saveSettingsUpdatedActivity,
} from "../../lib/settingsActivityHelpers";

import type {
  AppAccentColor,
  AppSettings,
  AppTheme,
  SidebarPosition,
} from "../../types/settings";

import type {
  UserRole,
} from "../../types/user";

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadSettings();

    function handleSettingsUpdated() {
      void loadSettings();
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

  async function loadSettings() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextSettings =
        await appSettingsRepository.get();

      setSettings(
        nextSettings
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Einstellungen konnten nicht geladen werden."
      );

      setSettings(
        appSettingsRepository.getDefault()
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function updateField<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings(
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
      alert(
        "Du hast keine Berechtigung, Einstellungen zu speichern."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const updatedSettings =
        await appSettingsRepository.save(
          settings
        );

      setSettings(
        updatedSettings
      );

      saveSettingsUpdatedActivity(
        updatedSettings
      );

      alert(
        "Einstellungen wurden gespeichert."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
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
      alert(
        "Du hast keine Berechtigung, Einstellungen zurückzusetzen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Einstellungen wirklich auf Standardwerte zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(
        true
      );

      const resetSettings =
        await appSettingsRepository.reset();

      setSettings(
        resetSettings
      );

      saveSettingsResetActivity(
        resetSettings
      );
    } catch (resetError) {
      console.error(
        resetError
      );

      alert(
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

  const themeOptions =
    appSettingsRepository.getThemeOptions();

  const accentColorOptions =
    appSettingsRepository.getAccentColorOptions();

  const sidebarPositionOptions =
    appSettingsRepository.getSidebarPositionOptions();

  const defaultUserRoleOptions =
    appSettingsRepository.getDefaultUserRoleOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Einstellungen
        </h1>

        <p className="text-zinc-500 mt-2">
          Systemweite Konfiguration aus PostgreSQL.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Einstellungen werden geladen...
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

      <form
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="space-y-8"
      >
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Allgemein
          </h2>

          <p className="text-zinc-500 mt-1">
            Name, Firma und Version der Anwendung.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                App-Name
              </label>

              <input
                value={settings.appName}
                onChange={(event) =>
                  updateField(
                    "appName",
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firmenname
              </label>

              <input
                value={settings.companyName}
                onChange={(event) =>
                  updateField(
                    "companyName",
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                App-Version
              </label>

              <input
                value={settings.appVersion}
                onChange={(event) => {
                  updateField(
                    "appVersion",
                    event.target.value
                  );

                  updateField(
                    "version",
                    event.target.value
                  );
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Standardrolle
              </label>

              <select
                value={settings.defaultUserRole}
                onChange={(event) =>
                  updateField(
                    "defaultUserRole",
                    event.target.value as UserRole
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {defaultUserRoleOptions.map(
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
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Oberfläche
          </h2>

          <p className="text-zinc-500 mt-1">
            Theme, Akzentfarbe und Layout-Optionen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Theme
              </label>

              <select
                value={settings.theme}
                onChange={(event) =>
                  updateField(
                    "theme",
                    event.target.value as AppTheme
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {themeOptions.map(
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
                value={settings.accentColor}
                onChange={(event) => {
                  updateField(
                    "accentColor",
                    event.target.value as AppAccentColor
                  );

                  updateField(
                    "appAccentColor",
                    event.target.value as AppAccentColor
                  );
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {accentColorOptions.map(
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
                value={settings.sidebarPosition}
                onChange={(event) =>
                  updateField(
                    "sidebarPosition",
                    event.target.value as SidebarPosition
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {sidebarPositionOptions.map(
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

            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(event) =>
                    updateField(
                      "darkMode",
                      event.target.checked
                    )
                  }
                />

                <span className="font-medium">
                  Dark Mode aktivieren
                </span>
              </label>

              <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(event) =>
                    updateField(
                      "compactMode",
                      event.target.checked
                    )
                  }
                />

                <span className="font-medium">
                  Kompaktmodus
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Funktionen
          </h2>

          <p className="text-zinc-500 mt-1">
            Feature-Schalter für einzelne Bereiche.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={settings.showVersion}
                onChange={(event) =>
                  updateField(
                    "showVersion",
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                Version anzeigen
              </span>
            </label>

            <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={settings.showDemoHints}
                onChange={(event) =>
                  updateField(
                    "showDemoHints",
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                Demo-Hinweise anzeigen
              </span>
            </label>

            <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={settings.enableTicketTemplates}
                onChange={(event) =>
                  updateField(
                    "enableTicketTemplates",
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                Ticket-Vorlagen aktivieren
              </span>
            </label>

            <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={settings.enableTicketComments}
                onChange={(event) =>
                  updateField(
                    "enableTicketComments",
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                Ticket-Kommentare aktivieren
              </span>
            </label>

            <label className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={settings.enableActivityLog}
                onChange={(event) =>
                  updateField(
                    "enableActivityLog",
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                Aktivitätsprotokoll aktivieren
              </span>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
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
              void handleReset()
            }
            disabled={saving}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Zurücksetzen
          </button>
        </div>
      </form>
    </div>
  );
}