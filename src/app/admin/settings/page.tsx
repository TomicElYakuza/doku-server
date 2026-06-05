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
  DefaultListView,
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

type ListViewOption = {
  value: DefaultListView;
  label: string;
  description: string;
};

type EditableSettings = {
  appName: string;
  companyName: string;
  appVersion: string;
  theme: AppTheme;
  darkMode: boolean;
  accentColor: AppAccentColor;
  compactMode: boolean;
  showVersion: boolean;
  showDemoHints: boolean;
  enableTicketComments: boolean;
  enableTicketTemplates: boolean;
  enableActivityLog: boolean;
  defaultUserRole: AppDefaultUserRole;
  defaultTicketView: DefaultListView;
  defaultWikiView: DefaultListView;
  hideClosedTicketsByDefault: boolean;
  ticketsPerPage: number;
  wikiPerPage: number;
};

const themeOptions: ThemeOption[] = [
  {
    value: "modern",
    label: "Modern",
    description: "Schwarze Sidebar mit heller Inhaltsfläche.",
  },
  {
    value: "light",
    label: "Hell",
    description: "Helle Oberfläche für die Anwendung.",
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
    value: "green",
    label: "Grün",
  },
  {
    value: "red",
    label: "Rot",
  },
  {
    value: "orange",
    label: "Orange",
  },
  {
    value: "purple",
    label: "Lila",
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

const listViewOptions: ListViewOption[] = [
  {
    value: "table",
    label: "Tabelle",
    description: "Listen werden standardmäßig als Tabelle angezeigt.",
  },
  {
    value: "cards",
    label: "Karten",
    description: "Listen werden standardmäßig als Karten angezeigt.",
  },
];

function normalizeTheme(value: AppSettings["theme"]): AppTheme {
  if (
    value === "light" ||
    value === "dark" ||
    value === "system"
  ) {
    return value;
  }

  return "modern";
}

function normalizeAccentColor(value: AppSettings["accentColor"]): AppAccentColor {
  if (
    value === "blue" ||
    value === "green" ||
    value === "red" ||
    value === "orange" ||
    value === "purple" ||
    value === "indigo" ||
    value === "emerald" ||
    value === "amber"
  ) {
    return value;
  }

  return "zinc";
}

function normalizeDefaultUserRole(value: AppSettings["defaultUserRole"]): AppDefaultUserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeListView(value: AppSettings["defaultTicketView"]): DefaultListView {
  if (value === "cards") {
    return "cards";
  }

  return "table";
}

function normalizePageSize(
  value: unknown,
  fallback: number,
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  if (numberValue < 5) {
    return 5;
  }

  if (numberValue > 100) {
    return 100;
  }

  return Math.floor(numberValue);
}

function getDefaultEditableSettings(settings: AppSettings): EditableSettings {
  return {
    appName: settings.appName || "Intranet",
    companyName: settings.companyName || "Intern",
    appVersion: settings.appVersion || settings.version || "0.1.0",
    theme: normalizeTheme(settings.theme),
    darkMode: Boolean(settings.darkMode),
    accentColor: normalizeAccentColor(
      settings.accentColor || settings.appAccentColor,
    ),
    compactMode: Boolean(settings.compactMode),
    showVersion: Boolean(settings.showVersion),
    showDemoHints: Boolean(settings.showDemoHints),
    enableTicketComments: Boolean(settings.enableTicketComments),
    enableTicketTemplates: Boolean(settings.enableTicketTemplates),
    enableActivityLog: Boolean(settings.enableActivityLog),
    defaultUserRole: normalizeDefaultUserRole(settings.defaultUserRole),
    defaultTicketView: normalizeListView(settings.defaultTicketView),
    defaultWikiView: normalizeListView(settings.defaultWikiView),
    hideClosedTicketsByDefault: Boolean(settings.hideClosedTicketsByDefault),
    ticketsPerPage: normalizePageSize(settings.ticketsPerPage, 25),
    wikiPerPage: normalizePageSize(settings.wikiPerPage, 25),
  };
}

function getThemeLabel(theme: AppTheme) {
  return (
    themeOptions.find((option) => option.value === theme)?.label ||
    theme
  );
}

function getAccentLabel(accentColor: AppAccentColor) {
  return (
    accentOptions.find((option) => option.value === accentColor)?.label ||
    accentColor
  );
}

function getRoleLabel(role: AppDefaultUserRole) {
  return (
    roleOptions.find((option) => option.value === role)?.label ||
    role
  );
}

function getListViewLabel(view: DefaultListView) {
  return (
    listViewOptions.find((option) => option.value === view)?.label ||
    view
  );
}

export default function AdminSettingsPage() {
  const {
    settings,
    loading,
    updateSettings,
    resetSettings,
  } = useAppSettings();

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<EditableSettings>(
    getDefaultEditableSettings(settings),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setForm(getDefaultEditableSettings(settings));
  }, [
    settings,
  ]);

  function updateField<TKey extends keyof EditableSettings>(
    key: TKey,
    value: EditableSettings[TKey],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await updateSettings({
        appName: form.appName.trim() || "Intranet",
        companyName: form.companyName.trim() || "Intern",
        appVersion: form.appVersion.trim() || "0.1.0",
        version: form.appVersion.trim() || "0.1.0",
        theme: form.theme,
        darkMode: form.theme === "dark" ? true : form.darkMode,
        accentColor: form.accentColor,
        appAccentColor: form.accentColor,
        compactMode: form.compactMode,
        showVersion: form.showVersion,
        showDemoHints: form.showDemoHints,
        enableTicketComments: form.enableTicketComments,
        enableTicketTemplates: form.enableTicketTemplates,
        enableActivityLog: form.enableActivityLog,
        defaultUserRole: form.defaultUserRole,
        defaultTicketView: form.defaultTicketView,
        defaultWikiView: form.defaultWikiView,
        hideClosedTicketsByDefault: form.hideClosedTicketsByDefault,
        ticketsPerPage: normalizePageSize(form.ticketsPerPage, 25),
        wikiPerPage: normalizePageSize(form.wikiPerPage, 25),
      });

      setMessage("Systemeinstellungen wurden gespeichert.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Systemeinstellungen konnten nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const confirmed = confirm(
      "Systemeinstellungen wirklich auf Standard zurücksetzen?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await resetSettings();

      setMessage("Systemeinstellungen wurden zurückgesetzt.");
    } catch (resetError) {
      console.error(resetError);

      setError(
        resetError instanceof Error
          ? resetError.message
          : "Systemeinstellungen konnten nicht zurückgesetzt werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Kein Zugriff"
        description="Du hast keine Berechtigung für die Systemeinstellungen."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Systemeinstellungen"
        description="Globale App-Konfiguration, Features, Standardrollen und Standardansichten."
        badges={[
          {
            label: form.companyName || "Intern",
          },
          {
            label: `Version ${form.appVersion || "0.1.0"}`,
          },
          {
            label: getThemeLabel(form.theme),
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={saving || loading}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition disabled:opacity-50"
            >
              Zurücksetzen
            </button>

            <button
              type="submit"
              form="admin-settings-form"
              disabled={saving || loading}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              {saving ? "Speichert..." : "Speichern"}
            </button>
          </div>
        }
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Design"
          value={getThemeLabel(form.theme)}
          description={`Akzent: ${getAccentLabel(form.accentColor)}`}
          icon="🎨"
          tone="purple"
        />
        <StatCard
          label="Standardrolle"
          value={getRoleLabel(form.defaultUserRole)}
          description="Für neue Benutzer"
          icon="👤"
          tone="blue"
        />
        <StatCard
          label="Tickets"
          value={getListViewLabel(form.defaultTicketView)}
          description={
            form.hideClosedTicketsByDefault
              ? "Geschlossene standardmäßig ausblenden"
              : "Geschlossene standardmäßig anzeigen"
          }
          icon="🎫"
          tone="orange"
        />
        <StatCard
          label="Wiki"
          value={getListViewLabel(form.defaultWikiView)}
          description={`${form.wikiPerPage} Einträge pro Seite`}
          icon="📚"
          tone="indigo"
        />
      </div>

      <form
        id="admin-settings-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-8"
      >
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Allgemein
          </h2>
          <p className="text-zinc-500 mt-1">
            Name, Firma und Version der Anwendung.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                App-Name
              </label>
              <input
                value={form.appName}
                onChange={(event) => updateField("appName", event.target.value)}
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
                onChange={(event) => updateField("companyName", event.target.value)}
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
                onChange={(event) => updateField("appVersion", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="0.1.0"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Darstellung
          </h2>
          <p className="text-zinc-500 mt-1">
            Globales Design und Anzeigeoptionen für die Oberfläche.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {themeOptions.map((option) => {
              const active = form.theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("theme", option.value)}
                  className={`text-left border rounded-3xl p-5 transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="font-semibold">
                    {option.label}
                  </h3>
                  <p className={`text-sm mt-2 ${active ? "text-zinc-200" : "text-zinc-500"}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold">
              Akzentfarbe
            </h3>

            <div className="flex flex-wrap gap-2 mt-4">
              {accentOptions.map((option) => {
                const active = form.accentColor === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("accentColor", option.value)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.darkMode}
                onChange={(event) => updateField("darkMode", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Dark Mode
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Dunkle Darstellung erzwingen.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.compactMode}
                onChange={(event) => updateField("compactMode", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Kompakter Modus
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Reduzierte Abstände.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.showVersion}
                onChange={(event) => updateField("showVersion", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Version anzeigen
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Version in der Oberfläche anzeigen.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Standardansichten
          </h2>
          <p className="text-zinc-500 mt-1">
            Globale Defaults für Listen, Tabellen und Filter.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold">
                Ticket-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active = form.defaultTicketView === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("defaultTicketView", option.value)}
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <h4 className="font-semibold">
                        {option.label}
                      </h4>
                      <p className={`text-sm mt-2 ${active ? "text-zinc-200" : "text-zinc-500"}`}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">
                Wiki-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active = form.defaultWikiView === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("defaultWikiView", option.value)}
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <h4 className="font-semibold">
                        {option.label}
                      </h4>
                      <p className={`text-sm mt-2 ${active ? "text-zinc-200" : "text-zinc-500"}`}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.hideClosedTicketsByDefault}
                onChange={(event) =>
                  updateField("hideClosedTicketsByDefault", event.target.checked)
                }
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Geschlossene Tickets ausblenden
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Neue Benutzer sehen geschlossene Tickets standardmäßig nicht.
                </span>
              </span>
            </label>

            <div>
              <label className="block mb-2 font-medium">
                Tickets pro Seite
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={form.ticketsPerPage}
                onChange={(event) =>
                  updateField("ticketsPerPage", Number(event.target.value))
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Wiki-Seiten pro Seite
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={form.wikiPerPage}
                onChange={(event) =>
                  updateField("wikiPerPage", Number(event.target.value))
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Features
          </h2>
          <p className="text-zinc-500 mt-1">
            Globale Module und Funktionsbereiche aktivieren oder deaktivieren.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.enableTicketComments}
                onChange={(event) => updateField("enableTicketComments", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Ticket-Kommentare
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Kommentare bei Tickets erlauben.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.enableTicketTemplates}
                onChange={(event) => updateField("enableTicketTemplates", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Ticket-Vorlagen
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Vorlagen-Modul für Tickets aktivieren.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.enableActivityLog}
                onChange={(event) => updateField("enableActivityLog", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Aktivitätsprotokoll
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Aktivitäten im System protokollieren und anzeigen.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={form.showDemoHints}
                onChange={(event) => updateField("showDemoHints", event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  Demo-Hinweise
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Hilfetexte und Demo-Hinweise anzeigen.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Benutzer
          </h2>
          <p className="text-zinc-500 mt-1">
            Standardwerte für neue Benutzer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {roleOptions.map((option) => {
              const active = form.defaultUserRole === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("defaultUserRole", option.value)}
                  className={`text-left border rounded-3xl p-5 transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="font-semibold">
                    {option.label}
                  </h3>
                  <p className={`text-sm mt-2 ${active ? "text-zinc-200" : "text-zinc-500"}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={saving || loading}
            className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Auf Standard zurücksetzen
          </button>

          <button
            type="submit"
            disabled={saving || loading}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:bg-zinc-400"
          >
            {saving ? "Speichert..." : "Systemeinstellungen speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}