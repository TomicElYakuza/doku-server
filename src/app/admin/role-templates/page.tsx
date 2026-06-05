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
}[] = [
  {
    value: "employee",
    label: "Mitarbeiter",
  },
  {
    value: "department_lead",
    label: "Abteilungsleiter",
  },
  {
    value: "admin",
    label: "Administrator",
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
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-zinc-100 text-zinc-500 border border-zinc-200";
}

function getDefaultClass(isDefault: boolean) {
  if (isDefault) {
    return "bg-blue-50 text-blue-700 border border-blue-100";
  }

  return "bg-zinc-100 text-zinc-500 border border-zinc-200";
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

export default function AdminRoleTemplatesPage() {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<RolePermissionTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");

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

      const nextTemplates = await rolePermissionTemplateRepository.list();

      setTemplates(Array.isArray(nextTemplates) ? nextTemplates : []);
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
          ? Math.max(...templates.map((template) => template.sortOrder || 0)) + 10
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
    const currentPermissions = normalizePermissionKeys(form.permissionKeysText);

    if (currentPermissions.includes(permission)) {
      updateForm(
        "permissionKeysText",
        permissionKeysToText(
          currentPermissions.filter((currentPermission) => currentPermission !== permission),
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
        (
          statusFilter === "active" &&
          template.isActive
        ) ||
        (
          statusFilter === "inactive" &&
          !template.isActive
        );

      const matchesDefault =
        !defaultFilter ||
        (
          defaultFilter === "default" &&
          template.isDefault
        ) ||
        (
          defaultFilter === "custom" &&
          !template.isDefault
        );

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

    const permissionKeys = normalizePermissionKeys(form.permissionKeysText);

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingKey) {
        const updatedTemplate = await rolePermissionTemplateRepository.update(
          editingKey,
          {
            name: form.name,
            description: form.description,
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

      const createdTemplate = await rolePermissionTemplateRepository.create({
        key: form.key,
        name: form.name,
        description: form.description,
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

      const updatedTemplate = await rolePermissionTemplateRepository.update(
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
        title="Kein Zugriff"
        description="Du hast keine Berechtigung für Rollen-Vorlagen."
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={editingKey ? "Rollen-Vorlage bearbeiten" : "Rollen-Vorlage erstellen"}
        description="Definiere Standardrechte für Rollen und spätere Benutzer-/Rechteprozesse."
        maxWidth="5xl"
        onClose={closeModal}
        footer={
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="bg-zinc-100 hover:bg-zinc-200 px-5 py-3 rounded-2xl transition"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="role-template-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 disabled:bg-zinc-400 transition"
            >
              {saving
                ? "Speichert..."
                : editingKey
                  ? "Änderungen speichern"
                  : "Vorlage erstellen"}
            </button>
          </div>
        }
      >
        <form
          id="role-template-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Template-Key
              </label>
              <input
                value={form.key}
                onChange={(event) => updateForm("key", event.target.value)}
                disabled={Boolean(editingKey)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                placeholder="z. B. employee-default"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Name
              </label>
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Mitarbeiter Standard"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Rolle
              </label>
              <select
                value={form.roleKey}
                onChange={(event) => updateForm("roleKey", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
                onChange={(event) => updateForm("sortOrder", Number(event.target.value))}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung der Vorlage..."
              />
            </div>

            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => updateForm("isDefault", event.target.checked)}
                  className="h-5 w-5 mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Standard-Vorlage
                  </span>
                  <span className="block text-sm text-zinc-500 mt-1">
                    Diese Vorlage dient als Default für die Rolle.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateForm("isActive", event.target.checked)}
                  className="h-5 w-5 mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Aktiv
                  </span>
                  <span className="block text-sm text-zinc-500 mt-1">
                    Nur aktive Vorlagen werden später verwendet.
                  </span>
                </span>
              </label>
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Berechtigungen
              </label>
              <textarea
                value={form.permissionKeysText}
                onChange={(event) => updateForm("permissionKeysText", event.target.value)}
                rows={8}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y font-mono text-sm"
                placeholder="Eine Berechtigung pro Zeile..."
              />

              <p className="text-sm text-zinc-500 mt-2">
                {selectedPermissions.length} Berechtigungen ausgewählt.
              </p>
            </div>

            <div className="xl:col-span-2">
              <h3 className="font-semibold">
                Schnell-Auswahl
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">
                {commonPermissions.map((permission) => {
                  const active = selectedPermissions.includes(permission);

                  return (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => addPermissionToForm(permission)}
                      className={`text-xs px-3 py-2 rounded-xl border transition ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {permission}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Admin Backend"
        title="Rollen-Vorlagen"
        description="Standardrechte für Rollen vorbereiten, pflegen und später auf Benutzer anwenden."
        badges={[
          {
            label: `${templates.length} Vorlagen`,
          },
          {
            label: `${activeCount} aktiv`,
          },
          {
            label: `${permissionCount} Rechte`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Vorlage erstellen
          </button>
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
          icon="🧬"
          active={!roleFilter && !statusFilter && !defaultFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Aktiv"
          value={activeCount}
          description="Aktive Vorlagen"
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />
        <StatCard
          label="Standard"
          value={defaultCount}
          description="Default-Vorlagen"
          icon="⭐"
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
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Filtere nach Rolle, Status oder Standard-Vorlage.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Vorlagen suchen..."
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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

        <p className="text-sm text-zinc-500 mt-5">
          {filteredTemplates.length} von {templates.length} Vorlagen gefunden.
        </p>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Vorlage
                </th>
                <th className="px-5 py-4 font-semibold">
                  Rolle
                </th>
                <th className="px-5 py-4 font-semibold">
                  Status
                </th>
                <th className="px-5 py-4 font-semibold">
                  Rechte
                </th>
                <th className="px-5 py-4 font-semibold">
                  Sortierung
                </th>
                <th className="px-5 py-4 font-semibold text-right">
                  Aktionen
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTemplates.map((template) => (
                <tr
                  key={template.key}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-5 py-4 align-top min-w-[300px]">
                    <p className="font-semibold">
                      {template.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {template.key}
                    </p>
                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {template.description || "Keine Beschreibung"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`text-xs px-3 py-1 rounded-full ${getDefaultClass(template.isDefault)}`}>
                        {template.isDefault ? "Standard" : "Benutzerdefiniert"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {getRoleLabel(String(template.roleKey))}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(template.isActive)}`}>
                      {template.isActive ? "Aktiv" : "Deaktiviert"}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top min-w-[260px]">
                    <div className="flex flex-wrap gap-2">
                      {template.permissionKeys.slice(0, 5).map((permission) => (
                        <span
                          key={`${template.key}-${permission}`}
                          className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg"
                        >
                          {permission}
                        </span>
                      ))}

                      {template.permissionKeys.length > 5 && (
                        <span className="text-xs bg-zinc-900 text-white px-2 py-1 rounded-lg">
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
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(template)}
                        className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleActive(template)}
                        className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition"
                      >
                        {template.isActive ? "Deaktivieren" : "Aktivieren"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteTemplate(template)}
                        className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 rounded-xl transition"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTemplates.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-zinc-500"
                  >
                    Keine Rollen-Vorlagen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}