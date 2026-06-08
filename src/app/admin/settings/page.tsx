"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  useAppSettings,
} from "../../../hooks/useAppSettings";
import {
  canViewAdmin,
} from "../../../lib/permissions";
import type {
  AppDefaultUserRole,
  AppSettings,
  DefaultListView,
} from "../../../types/settings";

type RoleOption = {
  value: AppDefaultUserRole;
  label: string;
  description: string;
};

type ListViewOption = {
  value: DefaultListView;
  label: string;
  description: string;
  icon: string;
};

type EditableSettings = {
  appName: string;
  companyName: string;
  appVersion: string;
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

type ToggleCardProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

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
    icon: "â–¦",
  },
  {
    value: "cards",
    label: "Karten",
    description:
      "Listen werden standardmäßig als Karten angezeigt.",
    icon: "â–£",
  },
];

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
  return {
    appName: settings.appName || "Intranet",
    companyName: settings.companyName || "Velunis",
    appVersion: settings.appVersion || settings.version || "0.1.0",
    showVersion: settings.showVersion ?? true,
    enableTicketComments: settings.enableTicketComments ?? true,
    enableTicketTemplates: settings.enableTicketTemplates ?? true,
    enableActivityLog: settings.enableActivityLog ?? true,
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

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <label
      className={`flex items-start gap-4 rounded-3xl border p-5 cursor-pointer transition ${
        checked
          ? "app-accent-border app-accent-soft"
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
        <span className="block font-black text-zinc-950">
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
        companyName: form.companyName.trim() || "Velunis",
        appVersion: form.appVersion.trim() || "0.1.0",
        version: form.appVersion.trim() || "0.1.0",
        showVersion: form.showVersion,
        enableTicketComments: form.enableTicketComments,
        enableTicketTemplates: form.enableTicketTemplates,
        enableActivityLog: form.enableActivityLog,
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

  const enabledFeatureCount = useMemo(
    () =>
      [
        form.enableTicketComments,
        form.enableTicketTemplates,
        form.enableActivityLog,
      ].filter(Boolean).length,
    [
      form.enableTicketComments,
      form.enableTicketTemplates,
      form.enableActivityLog,
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
        backHref="/admin"
        backLabel="Zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis Admin"
        title="Systemeinstellungen"
        description="Globale App-Defaults für Name, Version, Features, Listenansichten und neue Benutzer verwalten."
        badges={[
          {
            label: form.companyName || "Velunis",
          },
          {
            label: `v${form.appVersion || "0.1.0"}`,
          },
          {
            label: `${enabledFeatureCount}/3 Features aktiv`,
          },
          {
            label: `Tickets: ${getListViewLabel(form.defaultTicketView)}`,
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={saving || loading}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition disabled:opacity-50 font-bold"
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
          label="App"
          value={form.appName || "Intranet"}
          description={form.companyName || "Velunis"}
          icon="✨"
          tone="blue"
        />

        <StatCard
          label="Version"
          value={form.appVersion || "0.1.0"}
          description={
            form.showVersion
              ? "Wird angezeigt"
              : "Wird ausgeblendet"
          }
          icon="🏷️"
          tone="indigo"
        />

        <StatCard
          label="Features"
          value={`${enabledFeatureCount}/3`}
          description="Aktive Funktionsbereiche"
          icon="⚠️"
          tone="green"
        />

        <StatCard
          label="Standardrolle"
          value={getRoleLabel(form.defaultUserRole)}
          description="Für neue Benutzer"
          icon="👤"
          tone="purple"
        />
      </div>

      <form
        id="admin-settings-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-8"
      >
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              App-Daten
            </h2>
            <p className="text-zinc-500 mt-1">
              Name, Firma und Version der Anwendung.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
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

              <div className="flex items-end">
                <ToggleCard
                  title="Version anzeigen"
                  description="Zeigt die App-Version in der Oberfläche an."
                  checked={form.showVersion}
                  onChange={(checked) =>
                    updateField("showVersion", checked)
                  }
                />
              </div>
            </div>
          </div>

          <aside className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Vorschau
              </h2>
              <p className="text-zinc-500 mt-1">
                So erscheinen Name, Firma und Version.
              </p>

              <div className="mt-6 rounded-3xl app-accent-bg text-white p-6 app-brand-shadow">
                <p className="text-sm text-white/70">
                  {form.companyName || "Velunis"}
                </p>
                <h3 className="text-3xl font-black mt-2">
                  {form.appName || "Intranet"}
                </h3>
                <p className="text-white/70 mt-3">
                  Workspace
                  {form.showVersion && (
                    <>
                      {" "}
                      · v{form.appVersion || "0.1.0"}
                    </>
                  )}
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Standardansichten
          </h2>
          <p className="text-zinc-500 mt-1">
            Globale Defaults für Listen, Tabellen und Filter.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-6">
            <div>
              <h3 className="text-xl font-black">
                Ticket-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active =
                    form.defaultTicketView === option.value;

                  return (
                    <button
                      key={`ticket-${option.value}`}
                      type="button"
                      onClick={() =>
                        updateField(
                          "defaultTicketView",
                          option.value,
                        )
                      }
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow border-transparent"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <span className="text-2xl">
                        {option.icon}
                      </span>
                      <h4 className="font-black mt-3">
                        {option.label}
                      </h4>
                      <p
                        className={`text-sm mt-2 ${
                          active ? "text-white/75" : "text-zinc-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black">
                Wiki-Standardansicht
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listViewOptions.map((option) => {
                  const active =
                    form.defaultWikiView === option.value;

                  return (
                    <button
                      key={`wiki-${option.value}`}
                      type="button"
                      onClick={() =>
                        updateField(
                          "defaultWikiView",
                          option.value,
                        )
                      }
                      className={`text-left border rounded-3xl p-5 transition ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow border-transparent"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <span className="text-2xl">
                        {option.icon}
                      </span>
                      <h4 className="font-black mt-3">
                        {option.label}
                      </h4>
                      <p
                        className={`text-sm mt-2 ${
                          active ? "text-white/75" : "text-zinc-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">
            <ToggleCard
              title="Geschlossene Tickets standardmäßig ausblenden"
              description="Neue Benutzer sehen geschlossene Tickets nicht automatisch."
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
              <p className="text-sm text-zinc-500 mt-2">
                Erlaubt: 5 bis 100.
              </p>
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
              <p className="text-sm text-zinc-500 mt-2">
                Erlaubt: 5 bis 100.
              </p>
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
            <ToggleCard
              title="Ticket-Kommentare"
              description="Aktiviert Kommentare in Tickets."
              checked={form.enableTicketComments}
              onChange={(checked) =>
                updateField("enableTicketComments", checked)
              }
            />

            <ToggleCard
              title="Ticket-Vorlagen"
              description="Aktiviert Vorlagen für wiederkehrende Tickets."
              checked={form.enableTicketTemplates}
              onChange={(checked) =>
                updateField("enableTicketTemplates", checked)
              }
            />

            <ToggleCard
              title="Aktivitätsprotokoll"
              description="Aktiviert das Systemprotokoll im Intranet."
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
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
                      ? "app-accent-bg text-white app-brand-shadow border-transparent"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="font-black">
                    {option.label}
                  </h3>
                  <p
                    className={`text-sm mt-2 ${
                      active ? "text-white/75" : "text-zinc-500"
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
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Persönliche Darstellung
              </h2>
              <p className="text-zinc-500 mt-1">
                Theme, Akzentfarbe und kompakter Modus werden pro Benutzer in den persönlichen Einstellungen verwaltet.
              </p>
            </div>

            <Link
              href="/settings"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow text-center"
            >
              Persönliche Einstellungen öffnen
            </Link>
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              setForm(getDefaultEditableSettings(settings))
            }
            disabled={saving}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-medium"
          >
            Änderungen verwerfen
          </button>

          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={saving || loading}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-medium"
          >
            Auf Standard zurücksetzen
          </button>

          <button
            type="submit"
            disabled={saving || loading}
            className="app-accent-bg text-white px-6 py-4 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
          >
            {saving
              ? "Speichert..."
              : "Systemeinstellungen speichern"}
          </button>
        </section>
      </form>
    </div>
  );
}



