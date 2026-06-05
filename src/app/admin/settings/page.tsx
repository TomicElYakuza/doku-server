"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
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
  description: string;
  gradient: string;
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
    description:
      "Velunis Look mit dunkler Sidebar, dunkler Topbar und heller Arbeitsfläche.",
  },
  {
    value: "light",
    label: "Hell",
    description:
      "Helle Oberfläche mit Velunis-Akzent für helle Arbeitsplätze.",
  },
  {
    value: "dark",
    label: "Dunkel",
    description:
      "Dunkle Oberfläche für alle unterstützten Komponenten.",
  },
  {
    value: "system",
    label: "System",
    description:
      "Folgt automatisch der Hell-/Dunkel-Einstellung des Betriebssystems.",
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

const roleOptions: RoleOption[] = [
  {
    value: "employee",
    label: "Mitarbeiter",
    description:
      "Neue Benutzer starten mit normalen Mitarbeiterrechten.",
  },
  {
    value: "department_lead",
    label: "Abteilungsleiter",
    description:
      "Neue Benutzer starten mit Abteilungsleiter-Rolle.",
  },
  {
    value: "admin",
    label: "Administrator",
    description:
      "Neue Benutzer starten direkt mit Admin-Rechten.",
  },
];

const listViewOptions: ListViewOption[] = [
  {
    value: "table",
    label: "Tabelle",
    description:
      "Listen werden standardmäßig als Tabelle angezeigt.",
  },
  {
    value: "cards",
    label: "Karten",
    description:
      "Listen werden standardmäßig als Karten angezeigt.",
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

function normalizeAccentColor(
  value: AppSettings["accentColor"],
): AppAccentColor {
  if (
    value === "velunis" ||
    value === "blue" ||
    value === "green" ||
    value === "red" ||
    value === "orange" ||
    value === "purple" ||
    value === "indigo" ||
    value === "emerald" ||
    value === "amber" ||
    value === "zinc"
  ) {
    return value;
  }

  return "velunis";
}

function normalizeDefaultUserRole(
  value: AppSettings["defaultUserRole"],
): AppDefaultUserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeListView(
  value: AppSettings["defaultTicketView"],
): DefaultListView {
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

function getDefaultEditableSettings(
  settings: AppSettings,
): EditableSettings {
  const accentColor = normalizeAccentColor(
    settings.appAccentColor ||
      settings.accentColor ||
      "velunis",
  );

  return {
    appName: settings.appName || "Intranet",
    companyName: settings.companyName || "Velunis",
    appVersion:
      settings.appVersion ||
      settings.version ||
      "0.1.0",
    theme: normalizeTheme(settings.theme),
    darkMode: Boolean(settings.darkMode),
    accentColor,
    compactMode: Boolean(settings.compactMode),
    showVersion: settings.showVersion ?? true,
    enableTicketComments:
      settings.enableTicketComments ?? true,
    enableTicketTemplates:
      settings.enableTicketTemplates ?? true,
    enableActivityLog:
      settings.enableActivityLog ?? true,
    defaultUserRole: normalizeDefaultUserRole(
      settings.defaultUserRole,
    ),
    defaultTicketView: normalizeListView(
      settings.defaultTicketView,
    ),
    defaultWikiView: normalizeListView(
      settings.defaultWikiView,
    ),
    hideClosedTicketsByDefault:
      settings.hideClosedTicketsByDefault ?? true,
    ticketsPerPage: normalizePageSize(
      settings.ticketsPerPage,
      25,
    ),
    wikiPerPage: normalizePageSize(
      settings.wikiPerPage,
      25,
    ),
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
    accentOptions.find((option) => option.value === accentColor)
      ?.label || accentColor
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
    listViewOptions.find((option) => option.value === view)
      ?.label || view
  );
}

function getThemePreviewClass(theme: AppTheme) {
  if (theme === "dark") {
    return "bg-zinc-950 text-white border-zinc-800";
  }

  if (theme === "light") {
    return "bg-white text-zinc-950 border-zinc-200";
  }

  if (theme === "system") {
    return "bg-gradient-to-br from-white to-zinc-950 text-zinc-950 border-zinc-300";
  }

  return "bg-[#060711] text-white border-white/10";
}

type ToggleCardProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <label
      className={`flex items-start gap-4 rounded-3xl border p-5 transition cursor-pointer ${
        checked
          ? "border-indigo-300 bg-indigo-50"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 mt-1 accent-indigo-600"
      />

      <span>
        <span className="block font-bold text-zinc-950">
          {title}
        </span>
        <span className="block text-sm text-zinc-500 mt-1">
          {description}
        </span>
      </span>
    </label>
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
  const [form, setForm] = useState(
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
        companyName:
          form.companyName.trim() || "Velunis",
        appVersion:
          form.appVersion.trim() || "0.1.0",
        version:
          form.appVersion.trim() || "0.1.0",
        theme: form.theme,
        darkMode:
          form.theme === "dark"
            ? true
            : form.theme === "light"
              ? false
              : form.darkMode,
        accentColor: form.accentColor,
        appAccentColor: form.accentColor,
        compactMode: form.compactMode,
        showVersion: form.showVersion,
        enableTicketComments:
          form.enableTicketComments,
        enableTicketTemplates:
          form.enableTicketTemplates,
        enableActivityLog:
          form.enableActivityLog,
        defaultUserRole: form.defaultUserRole,
        defaultTicketView: form.defaultTicketView,
        defaultWikiView: form.defaultWikiView,
        hideClosedTicketsByDefault:
          form.hideClosedTicketsByDefault,
        ticketsPerPage: normalizePageSize(
          form.ticketsPerPage,
          25,
        ),
        wikiPerPage: normalizePageSize(
          form.wikiPerPage,
          25,
        ),
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

  const selectedAccent = useMemo(
    () =>
      accentOptions.find(
        (option) => option.value === form.accentColor,
      ) || accentOptions[0],
    [
      form.accentColor,
    ],
  );

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Systemeinstellungen"
        description="Du hast keine Berechtigung für die Systemeinstellungen."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Systemeinstellungen"
        description="Branding, Darstellung, Standardansichten und globale Funktionsbereiche für Velunis zentral konfigurieren."
        badges={[
          {
            label: `Design: ${getThemeLabel(form.theme)}`,
          },
          {
            label: `Akzent: ${getAccentLabel(form.accentColor)}`,
          },
          {
            label: `Version ${form.appVersion || "0.1.0"}`,
          },
        ]}
        actions={
          <>
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
          label="Firma"
          value={form.companyName || "Velunis"}
          description="Globales Branding"
          icon="✦"
          tone="indigo"
        />
        <StatCard
          label="Design"
          value={getThemeLabel(form.theme)}
          description="Aktueller Modus"
          icon="🎨"
          tone="purple"
        />
        <StatCard
          label="Akzent"
          value={getAccentLabel(form.accentColor)}
          description="Systemfarbe"
          icon="🌈"
          tone="blue"
        />
        <StatCard
          label="Standardrolle"
          value={getRoleLabel(form.defaultUserRole)}
          description="Neue Benutzer"
          icon="👤"
          tone="orange"
        />
      </div>

      <form
        id="admin-settings-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-8"
      >
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Allgemein
              </h2>
              <p className="text-zinc-500 mt-1">
                Name, Firma und Version der Anwendung.
              </p>
            </div>

            <div className="rounded-3xl bg-zinc-50 border border-zinc-200 p-4 min-w-64">
              <p className="text-xs text-zinc-500">
                Vorschau
              </p>
              <p className="font-black text-xl mt-1">
                {form.companyName || "Velunis"}
              </p>
              <p className="text-sm text-zinc-500">
                {form.appName || "Intranet"} Workspace · v
                {form.appVersion || "0.1.0"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                App-Name
              </label>
              <input
                value={form.appName}
                onChange={(event) =>
                  updateField("appName", event.target.value)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
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
                  updateField("companyName", event.target.value)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="Velunis"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Version
              </label>
              <input
                value={form.appVersion}
                onChange={(event) =>
                  updateField("appVersion", event.target.value)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="0.1.0"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                Design & Branding
              </h2>
              <p className="text-zinc-500 mt-1">
                Velunis-Farbton, Theme und globale Darstellung.
              </p>
            </div>

            <div
              className={`rounded-3xl bg-gradient-to-br ${selectedAccent.gradient} text-white p-5 min-w-72 shadow-[0_16px_40px_rgba(79,70,229,0.22)]`}
            >
              <p className="text-xs uppercase tracking-[0.22em] font-black text-white/70">
                Brand Preview
              </p>
              <p className="text-2xl font-black mt-2">
                Velunis
              </p>
              <p className="text-sm text-white/75 mt-1">
                {selectedAccent.label}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold">
                Theme
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Dark Mode ist vollständig mit dem Velunis-Branding kompatibel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {themeOptions.map((option) => {
                  const active = form.theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateField("theme", option.value);
                        updateField(
                          "darkMode",
                          option.value === "dark",
                        );
                      }}
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-indigo-300 ring-4 ring-indigo-500/10 bg-indigo-50"
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
                Diese Farbe wird für Branding, aktive Elemente und Fokuszustände verwendet.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {accentOptions.map((option) => {
                  const active = form.accentColor === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateField("accentColor", option.value)
                      }
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-indigo-300 ring-4 ring-indigo-500/10 bg-indigo-50"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToggleCard
                title="Dark Mode erzwingen"
                description="Erzwingt dunkle Darstellung, unabhängig vom Theme."
                checked={form.darkMode}
                onChange={(checked) =>
                  updateField("darkMode", checked)
                }
              />

              <ToggleCard
                title="Kompakter Modus"
                description="Reduziert Abstände für dichtere Oberflächen."
                checked={form.compactMode}
                onChange={(checked) =>
                  updateField("compactMode", checked)
                }
              />

              <ToggleCard
                title="Version anzeigen"
                description="Zeigt die App-Version in unterstützten Komponenten."
                checked={form.showVersion}
                onChange={(checked) =>
                  updateField("showVersion", checked)
                }
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Standardansichten
          </h2>
          <p className="text-zinc-500 mt-1">
            Globale Defaults für Listen, Tabellen und Filter.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-bold">
                Ticket-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active =
                    form.defaultTicketView === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateField(
                          "defaultTicketView",
                          option.value,
                        )
                      }
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <h4 className="font-black">
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
              <h3 className="font-bold">
                Wiki-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active =
                    form.defaultWikiView === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateField(
                          "defaultWikiView",
                          option.value,
                        )
                      }
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <h4 className="font-black">
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
            <ToggleCard
              title="Geschlossene Tickets ausblenden"
              description="Neue Benutzer sehen geschlossene Tickets standardmäßig nicht."
              checked={form.hideClosedTicketsByDefault}
              onChange={(checked) =>
                updateField(
                  "hideClosedTicketsByDefault",
                  checked,
                )
              }
            />

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
                  updateField(
                    "ticketsPerPage",
                    Number(event.target.value),
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
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
                  updateField(
                    "wikiPerPage",
                    Number(event.target.value),
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Features
          </h2>
          <p className="text-zinc-500 mt-1">
            Globale Funktionsbereiche aktivieren oder deaktivieren.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <ToggleCard
              title="Ticket-Kommentare"
              description="Kommentare bei Tickets erlauben."
              checked={form.enableTicketComments}
              onChange={(checked) =>
                updateField("enableTicketComments", checked)
              }
            />

            <ToggleCard
              title="Ticket-Vorlagen"
              description="Vorlagen-Modul für wiederkehrende Fälle aktivieren."
              checked={form.enableTicketTemplates}
              onChange={(checked) =>
                updateField("enableTicketTemplates", checked)
              }
            />

            <ToggleCard
              title="Aktivitätsprotokoll"
              description="Aktivitäten im System protokollieren und anzeigen."
              checked={form.enableActivityLog}
              onChange={(checked) =>
                updateField("enableActivityLog", checked)
              }
            />
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Benutzer
          </h2>
          <p className="text-zinc-500 mt-1">
            Standardwerte für neue Benutzer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {roleOptions.map((option) => {
              const active =
                form.defaultUserRole === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateField("defaultUserRole", option.value)
                  }
                  className={`text-left border rounded-3xl p-5 transition ${
                    active
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="font-black">
                    {option.label}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              setForm(getDefaultEditableSettings(settings))
            }
            disabled={saving}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Änderungen verwerfen
          </button>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={saving || loading}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              Auf Standard zurücksetzen
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white px-6 py-4 rounded-2xl hover:opacity-90 transition disabled:opacity-50 font-black shadow-[0_16px_40px_rgba(79,70,229,0.24)]"
            >
              {saving
                ? "Speichert..."
                : "Systemeinstellungen speichern"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}