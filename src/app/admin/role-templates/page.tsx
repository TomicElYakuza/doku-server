"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AppModal from "../../../components/AppModal";
import AccessDeniedCard from "../../../components/AccessDeniedCard";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  canViewAdmin,
} from "../../../lib/permissions";
import {
  rolePermissionTemplateRepository,
} from "../../../lib/rolePermissionTemplateRepository";
import type {
  RolePermissionTemplate,
} from "../../../types/rolePermissionTemplate";
import type {
  UserRole,
} from "../../../types/user";

type TemplateForm = {
  key: string;
  name: string;
  description: string;
  roleKey: UserRole | string;
  permissionKeysText: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ViewMode = "table" | "cards";

const emptyForm: TemplateForm = {
  key: "",
  name: "",
  description: "",
  roleKey: "employee",
  permissionKeysText: "",
  isDefault: false,
  isActive: true,
  sortOrder: 0,
};

const roleOptions: {
  value: UserRole | string;
  label: string;
  description: string;
}[] = [
  {
    value: "employee",
    label: "Mitarbeiter",
    description:
      "Standardrolle für normale Benutzer mit Basisrechten.",
  },
  {
    value: "department_lead",
    label: "Abteilungsleiter",
    description:
      "Erweiterte Rolle für Bereichs- und Teamverantwortliche.",
  },
  {
    value: "admin",
    label: "Administrator",
    description:
      "Vollzugriff auf System, Admin Backend und Verwaltung.",
  },
];

const commonPermissions = [
  "dashboard.view",
  "news.view",
  "news.manage",
  "wiki.view",
  "wiki.manage",
  "tickets.view",
  "tickets.create",
  "tickets.manage",
  "tickets.templates.view",
  "tickets.templates.manage",
  "files.view",
  "files.manage",
  "settings.manage",
  "organization.manage",
  "users.manage",
  "users.manage_permissions",
  "admin.view",
];

function getRoleLabel(role: string) {
  return (
    roleOptions.find((option) => option.value === role)?.label ||
    role
  );
}

function getRoleClass(role: string) {
  if (role === "admin") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (role === "department_lead") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function normalizePermissionKeys(text: string) {
  return Array.from(
    new Set(
      text
        .split(/[\n,]/)
        .map((permission) => permission.trim())
        .filter(Boolean),
    ),
  );
}

function permissionKeysToText(permissionKeys: string[]) {
  return permissionKeys.join("\n");
}

function getStatusClass(active: boolean) {
  if (active) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  return "bg-zinc-100 text-zinc-500 border-zinc-200";
}

function getDefaultClass(isDefault: boolean) {
  if (isDefault) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-zinc-100 text-zinc-500 border-zinc-200";
}

function normalizeForm(template: RolePermissionTemplate): TemplateForm {
  return {
    key: template.key,
    name: template.name,
    description: template.description,
    roleKey: template.roleKey || "employee",
    permissionKeysText: permissionKeysToText(template.permissionKeys),
    isDefault: template.isDefault,
    isActive: template.isActive,
    sortOrder: template.sortOrder || 0,
  };
}

function getPermissionGroup(permission: string) {
  if (permission.startsWith("tickets")) {
    return "Tickets";
  }

  if (permission.startsWith("wiki")) {
    return "Wiki";
  }

  if (permission.startsWith("news")) {
    return "News";
  }

  if (permission.startsWith("files")) {
    return "Dateien";
  }

  if (
    permission.startsWith("users") ||
    permission.startsWith("admin")
  ) {
    return "Admin";
  }

  if (
    permission.startsWith("settings") ||
    permission.startsWith("organization")
  ) {
    return "System";
  }

  return "Sonstige";
}

function getPermissionGroupClass(group: string) {
  if (group === "Tickets") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (group === "Wiki") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (group === "News") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (group === "Dateien") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (group === "Admin") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (group === "System") {
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

export default function AdminRoleTemplatesPage() {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<RolePermissionTemplate[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState<TemplateForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadTemplates();

    function handleTemplatesUpdated() {
      void loadTemplates();
    }

    window.addEventListener(
      "rolePermissionTemplatesUpdated",
      handleTemplatesUpdated,
    );

    return () => {
      window.removeEventListener(
        "rolePermissionTemplatesUpdated",
        handleTemplatesUpdated,
      );
    };
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");

      const nextTemplates =
        await rolePermissionTemplateRepository.list();

      setTemplates(
        Array.isArray(nextTemplates)
          ? nextTemplates
          : [],
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Rollen-Vorlagen konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm<TKey extends keyof TemplateForm>(
    key: TKey,
    value: TemplateForm[TKey],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateModal() {
    setEditingKey("");

    setForm({
      ...emptyForm,
      sortOrder:
        templates.length > 0
          ? Math.max(
              ...templates.map(
                (template) => template.sortOrder || 0,
              ),
            ) + 10
          : 10,
    });

    setModalOpen(true);
  }

  function openEditModal(template: RolePermissionTemplate) {
    setEditingKey(template.key);
    setForm(normalizeForm(template));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingKey("");
    setForm(emptyForm);
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setDefaultFilter("");
  }

  function addPermissionToForm(permission: string) {
    const currentPermissions = normalizePermissionKeys(
      form.permissionKeysText,
    );

    if (currentPermissions.includes(permission)) {
      updateForm(
        "permissionKeysText",
        permissionKeysToText(
          currentPermissions.filter(
            (currentPermission) =>
              currentPermission !== permission,
          ),
        ),
      );

      return;
    }

    updateForm(
      "permissionKeysText",
      permissionKeysToText([
        ...currentPermissions,
        permission,
      ]),
    );
  }

  const selectedPermissions = useMemo(
    () => normalizePermissionKeys(form.permissionKeysText),
    [
      form.permissionKeysText,
    ],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        [
          template.key,
          template.name,
          template.description,
          template.roleKey,
          template.permissionKeys.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        !roleFilter ||
        template.roleKey === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && template.isActive) ||
        (statusFilter === "inactive" && !template.isActive);

      const matchesDefault =
        !defaultFilter ||
        (defaultFilter === "default" && template.isDefault) ||
        (defaultFilter === "custom" && !template.isDefault);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesDefault
      );
    });
  }, [
    templates,
    search,
    roleFilter,
    statusFilter,
    defaultFilter,
  ]);

  const activeCount = useMemo(
    () => templates.filter((template) => template.isActive).length,
    [
      templates,
    ],
  );

  const inactiveCount = templates.length - activeCount;

  const defaultCount = useMemo(
    () => templates.filter((template) => template.isDefault).length,
    [
      templates,
    ],
  );

  const permissionCount = useMemo(
    () =>
      Array.from(
        new Set(
          templates.flatMap((template) => template.permissionKeys),
        ),
      ).length,
    [
      templates,
    ],
  );

  const latestTemplate = templates[0];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.key.trim()) {
      alert("Bitte einen Template-Key eingeben.");
      return;
    }

    if (!form.name.trim()) {
      alert("Bitte einen Namen eingeben.");
      return;
    }

    const permissionKeys = normalizePermissionKeys(
      form.permissionKeysText,
    );

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingKey) {
        const updatedTemplate =
          await rolePermissionTemplateRepository.update(
            editingKey,
            {
              name: form.name.trim(),
              description: form.description.trim(),
              roleKey: form.roleKey,
              permissionKeys,
              isDefault: form.isDefault,
              isActive: form.isActive,
              sortOrder: form.sortOrder,
            },
          );

        setTemplates((current) =>
          current.map((template) =>
            template.key === updatedTemplate.key
              ? updatedTemplate
              : template,
          ),
        );

        closeModal();
        setMessage("Rollen-Vorlage wurde gespeichert.");
        return;
      }

      const createdTemplate =
        await rolePermissionTemplateRepository.create({
          key: form.key.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          roleKey: form.roleKey,
          permissionKeys,
          isDefault: form.isDefault,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        });

      setTemplates((current) =>
        [
          ...current,
          createdTemplate,
        ].sort((first, second) => first.sortOrder - second.sortOrder),
      );

      closeModal();
      setMessage("Rollen-Vorlage wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Rollen-Vorlage konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(template: RolePermissionTemplate) {
    try {
      setMessage("");
      setError("");

      const updatedTemplate =
        await rolePermissionTemplateRepository.update(
          template.key,
          {
            isActive: !template.isActive,
          },
        );

      setTemplates((current) =>
        current.map((item) =>
          item.key === updatedTemplate.key
            ? updatedTemplate
            : item,
        ),
      );

      setMessage(
        updatedTemplate.isActive
          ? "Rollen-Vorlage wurde aktiviert."
          : "Rollen-Vorlage wurde deaktiviert.",
      );
    } catch (toggleError) {
      console.error(toggleError);

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Status konnte nicht geändert werden.",
      );
    }
  }

  async function deleteTemplate(template: RolePermissionTemplate) {
    const confirmed = confirm(
      `Rollen-Vorlage "${template.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await rolePermissionTemplateRepository.delete(template.key);

      setTemplates((current) =>
        current.filter((item) => item.key !== template.key),
      );

      setMessage("Rollen-Vorlage wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Rollen-Vorlage konnte nicht gelöscht werden.",
      );
    }
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Rollen-Vorlagen"
        description="Du hast keine Berechtigung für die Rollen-Vorlagen."
        backHref="/admin"
        backLabel="Zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title={
          editingKey
            ? "Rollen-Vorlage bearbeiten"
            : "Rollen-Vorlage erstellen"
        }
        description="Vorlagen bündeln Standardrechte und können später auf Benutzer angewendet werden."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="role-template-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingKey
                  ? "Änderungen speichern"
                  : "Vorlage erstellen"}
            </button>
          </>
        }
      >
        <form
          id="role-template-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Stammdaten
              </h3>
              <p className="text-zinc-500 mt-1">
                Schlüssel, Name, Rolle, Status und Sortierung.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">
                  Template-Key
                </label>
                <input
                  value={form.key}
                  onChange={(event) =>
                    updateForm("key", event.target.value)
                  }
                  disabled={Boolean(editingKey)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus disabled:bg-zinc-100 disabled:text-zinc-400"
                  placeholder="z. B. employee-default"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Mitarbeiter Standard"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Rolle
                </label>
                <select
                  value={form.roleKey}
                  onChange={(event) =>
                    updateForm("roleKey", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  {roleOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Sortierung
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm(
                      "sortOrder",
                      Number(event.target.value || 0),
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                />
              </div>

              <div className="xl:col-span-2">
                <label className="block mb-2 font-medium">
                  Beschreibung
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={3}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Beschreibung der Vorlage..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-4 border border-zinc-200 rounded-3xl p-5 bg-zinc-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateForm("isDefault", event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-bold text-zinc-950">
                    Standard-Vorlage
                  </span>
                  <span className="block text-sm text-zinc-500 mt-1">
                    Diese Vorlage dient als Default für die Rolle.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-4 border border-zinc-200 rounded-3xl p-5 bg-zinc-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-bold text-zinc-950">
                    Aktiv
                  </span>
                  <span className="block text-sm text-zinc-500 mt-1">
                    Nur aktive Vorlagen können angewendet werden.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Berechtigungen
              </h3>
              <p className="text-zinc-500 mt-1">
                Eine Berechtigung pro Zeile oder Komma-getrennt.
              </p>
            </div>

            <textarea
              value={form.permissionKeysText}
              onChange={(event) =>
                updateForm("permissionKeysText", event.target.value)
              }
              rows={9}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-y font-mono text-sm"
              placeholder="Eine Berechtigung pro Zeile..."
            />

            <p className="text-sm text-zinc-500">
              {selectedPermissions.length} Berechtigungen ausgewählt.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5">
              <h3 className="font-black">
                Schnell-Auswahl
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                Häufig genutzte Rechte per Klick hinzufügen oder entfernen.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {commonPermissions.map((permission) => {
                  const active = selectedPermissions.includes(permission);
                  const group = getPermissionGroup(permission);

                  return (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => addPermissionToForm(permission)}
                      className={`text-xs px-3 py-2 rounded-xl border transition ${
                        active
                          ? "app-accent-bg text-white border-transparent app-brand-shadow"
                          : `${getPermissionGroupClass(group)} hover:scale-[1.02]`
                      }`}
                    >
                      {permission}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Velunis Admin"
        title="Rollen-Vorlagen"
        description="Standardrechte für Rollen vorbereiten, pflegen und gezielt auf Benutzer anwenden."
        badges={[
          {
            label: `${templates.length} Vorlagen`,
          },
          {
            label: `${activeCount} aktiv`,
          },
          {
            label: `${defaultCount} Standard`,
          },
          {
            label: latestTemplate
              ? `Neueste: ${latestTemplate.name}`
              : "Noch keine Vorlage",
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadTemplates()}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Aktualisieren
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Vorlage erstellen
            </button>
          </>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Rollen-Vorlagen werden geladen...
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
          label="Vorlagen"
          value={templates.length}
          description="Alle Rollen-Vorlagen"
          icon="🧩"
          active={!roleFilter && !statusFilter && !defaultFilter && !search}
          onClick={resetFilters}
        />

        <StatCard
          label="Aktiv"
          value={activeCount}
          description={`${inactiveCount} deaktiviert`}
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />

        <StatCard
          label="Standard"
          value={defaultCount}
          description="Default-Vorlagen"
          icon="â­"
          tone="orange"
          active={defaultFilter === "default"}
          onClick={() => setDefaultFilter("default")}
        />

        <StatCard
          label="Rechte"
          value={permissionCount}
          description="Eindeutige Rechte"
          icon="🔐"
          tone="indigo"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Filtere nach Rolle, Status, Standard-Vorlage oder Berechtigung.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                viewMode === "table"
                  ? "app-accent-bg text-white app-brand-shadow"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              }`}
            >
              Tabelle
            </button>

            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                viewMode === "cards"
                  ? "app-accent-bg text-white app-brand-shadow"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="Vorlagen suchen..."
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Rollen
            </option>

            {roleOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Status
            </option>
            <option value="active">
              Aktiv
            </option>
            <option value="inactive">
              Deaktiviert
            </option>
          </select>

          <select
            value={defaultFilter}
            onChange={(event) => setDefaultFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Typen
            </option>
            <option value="default">
              Standard
            </option>
            <option value="custom">
              Benutzerdefiniert
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <span className="text-sm text-zinc-500">
            {filteredTemplates.length} von {templates.length} Vorlagen gefunden.
          </span>

          {search && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Suche: {search}
            </span>
          )}

          {roleFilter && (
            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
              Rolle: {getRoleLabel(roleFilter)}
            </span>
          )}

          {statusFilter && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Status: {statusFilter === "active" ? "Aktiv" : "Deaktiviert"}
            </span>
          )}

          {defaultFilter && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Typ: {defaultFilter === "default" ? "Standard" : "Benutzerdefiniert"}
            </span>
          )}
        </div>
      </section>

      {filteredTemplates.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
            🔎
          </div>

          <h2 className="text-xl font-semibold mt-5">
            Keine Rollen-Vorlagen gefunden
          </h2>
          <p className="text-zinc-500 mt-2">
            Erstelle eine Vorlage oder passe die Filter an.
          </p>
        </div>
      )}

      {viewMode === "table" && filteredTemplates.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Vorlage
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Rolle
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Rechte
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Sortierung
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.key}
                    className="hover:bg-zinc-50 transition"
                  >
                    <td className="px-5 py-4 align-top min-w-[300px]">
                      <p className="font-black text-zinc-950">
                        {template.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {template.key}
                      </p>
                      <p className="text-zinc-500 mt-2 line-clamp-2">
                        {template.description || "Keine Beschreibung"}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getDefaultClass(
                            template.isDefault,
                          )}`}
                        >
                          {template.isDefault
                            ? "Standard"
                            : "Benutzerdefiniert"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getRoleClass(
                          String(template.roleKey),
                        )}`}
                      >
                        {getRoleLabel(String(template.roleKey))}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          template.isActive,
                        )}`}
                      >
                        {template.isActive ? "Aktiv" : "Deaktiviert"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top min-w-[260px]">
                      <div className="flex flex-wrap gap-2">
                        {template.permissionKeys.slice(0, 5).map((permission) => {
                          const group = getPermissionGroup(permission);

                          return (
                            <span
                              key={`${template.key}-${permission}`}
                              className={`text-xs px-2 py-1 rounded-lg border ${getPermissionGroupClass(
                                group,
                              )}`}
                            >
                              {permission}
                            </span>
                          );
                        })}

                        {template.permissionKeys.length > 5 && (
                          <span className="text-xs app-accent-bg text-white px-2 py-1 rounded-lg">
                            +{template.permissionKeys.length - 5}
                          </span>
                        )}

                        {template.permissionKeys.length === 0 && (
                          <span className="text-xs text-zinc-400">
                            Keine Rechte
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top text-zinc-500">
                      {template.sortOrder}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(template)}
                          className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
                        >
                          Bearbeiten
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleActive(template)}
                          className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                        >
                          {template.isActive
                            ? "Deaktivieren"
                            : "Aktivieren"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteTemplate(template)}
                          className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && filteredTemplates.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredTemplates.map((template) => (
            <article
              key={template.key}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-bold ${getRoleClass(
                        String(template.roleKey),
                      )}`}
                    >
                      {getRoleLabel(String(template.roleKey))}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                        template.isActive,
                      )}`}
                    >
                      {template.isActive ? "Aktiv" : "Deaktiviert"}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-bold ${getDefaultClass(
                        template.isDefault,
                      )}`}
                    >
                      {template.isDefault
                        ? "Standard"
                        : "Benutzerdefiniert"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black mt-4 line-clamp-1">
                    {template.name}
                  </h2>

                  <p className="text-zinc-500 mt-2 line-clamp-2">
                    {template.description || "Keine Beschreibung"}
                  </p>

                  <p className="text-xs text-zinc-400 mt-3">
                    Key: {template.key}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(template)}
                    className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
                  >
                    Bearbeiten
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleActive(template)}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                  >
                    {template.isActive ? "Deaktivieren" : "Aktivieren"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteTemplate(template)}
                    className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold"
                  >
                    Löschen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Rechte
                  </p>
                  <p className="font-black mt-1">
                    {template.permissionKeys.length}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Sortierung
                  </p>
                  <p className="font-black mt-1">
                    {template.sortOrder}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Rolle
                  </p>
                  <p className="font-black mt-1">
                    {getRoleLabel(String(template.roleKey))}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-100">
                {template.permissionKeys.slice(0, 8).map((permission) => {
                  const group = getPermissionGroup(permission);

                  return (
                    <span
                      key={`${template.key}-card-${permission}`}
                      className={`text-xs px-2 py-1 rounded-lg border ${getPermissionGroupClass(
                        group,
                      )}`}
                    >
                      {permission}
                    </span>
                  );
                })}

                {template.permissionKeys.length > 8 && (
                  <span className="text-xs app-accent-bg text-white px-2 py-1 rounded-lg">
                    +{template.permissionKeys.length - 8}
                  </span>
                )}

                {template.permissionKeys.length === 0 && (
                  <span className="text-sm text-zinc-400">
                    Keine Rechte hinterlegt.
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}


