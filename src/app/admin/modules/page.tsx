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
  adminModuleRepository,
} from "../../../lib/adminModuleRepository";
import {
  canViewAdmin,
} from "../../../lib/permissions";
import type {
  AdminModuleConfig,
} from "../../../types/adminModule";

type ModuleForm = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  badgeLabel: string;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  isCore: boolean;
};

const emptyForm: ModuleForm = {
  key: "",
  title: "",
  description: "",
  href: "",
  icon: "🧩",
  category: "admin",
  badgeLabel: "",
  sortOrder: 0,
  isEnabled: true,
  isVisible: true,
  isCore: false,
};

const categoryOptions = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "content",
    label: "Inhalte",
  },
  {
    value: "tickets",
    label: "Tickets",
  },
  {
    value: "system",
    label: "System",
  },
];

function getCategoryLabel(category: string) {
  return (
    categoryOptions.find((option) => option.value === category)?.label ||
    category
  );
}

function getStatusClass(enabled: boolean) {
  if (enabled) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-zinc-100 text-zinc-500 border border-zinc-200";
}

function getVisibleClass(visible: boolean) {
  if (visible) {
    return "bg-blue-50 text-blue-700 border border-blue-100";
  }

  return "bg-orange-50 text-orange-700 border border-orange-100";
}

function normalizeForm(module: AdminModuleConfig): ModuleForm {
  return {
    key: module.key,
    title: module.title,
    description: module.description,
    href: module.href,
    icon: module.icon || "🧩",
    category: module.category || "admin",
    badgeLabel: module.badgeLabel || "",
    sortOrder: module.sortOrder || 0,
    isEnabled: module.isEnabled,
    isVisible: module.isVisible,
    isCore: module.isCore,
  };
}

export default function AdminModulesPage() {
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<AdminModuleConfig[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState<ModuleForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadModules();

    function handleAdminModulesUpdated() {
      void loadModules();
    }

    window.addEventListener(
      "adminModulesUpdated",
      handleAdminModulesUpdated,
    );

    return () => {
      window.removeEventListener(
        "adminModulesUpdated",
        handleAdminModulesUpdated,
      );
    };
  }, []);

  async function loadModules() {
    try {
      setLoading(true);
      setError("");

      const nextModules = await adminModuleRepository.list();

      setModules(Array.isArray(nextModules) ? nextModules : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Admin-Module konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateForm<TKey extends keyof ModuleForm>(
    key: TKey,
    value: ModuleForm[TKey],
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
        modules.length > 0
          ? Math.max(...modules.map((module) => module.sortOrder || 0)) + 10
          : 10,
    });
    setModalOpen(true);
  }

  function openEditModal(module: AdminModuleConfig) {
    setEditingKey(module.key);
    setForm(normalizeForm(module));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingKey("");
    setForm(emptyForm);
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setVisibilityFilter("");
  }

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return modules.filter((module) => {
      const matchesSearch =
        !query ||
        [
          module.key,
          module.title,
          module.description,
          module.href,
          module.icon,
          module.category,
          module.badgeLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !categoryFilter ||
        module.category === categoryFilter;

      const matchesStatus =
        !statusFilter ||
        (
          statusFilter === "enabled" &&
          module.isEnabled
        ) ||
        (
          statusFilter === "disabled" &&
          !module.isEnabled
        );

      const matchesVisibility =
        !visibilityFilter ||
        (
          visibilityFilter === "visible" &&
          module.isVisible
        ) ||
        (
          visibilityFilter === "hidden" &&
          !module.isVisible
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesVisibility
      );
    });
  }, [
    modules,
    search,
    categoryFilter,
    statusFilter,
    visibilityFilter,
  ]);

  const enabledCount = useMemo(
    () => modules.filter((module) => module.isEnabled).length,
    [
      modules,
    ],
  );

  const hiddenCount = useMemo(
    () => modules.filter((module) => !module.isVisible).length,
    [
      modules,
    ],
  );

  const coreCount = useMemo(
    () => modules.filter((module) => module.isCore).length,
    [
      modules,
    ],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.key.trim()) {
      alert("Bitte einen Modul-Key eingeben.");
      return;
    }

    if (!form.title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!form.href.trim()) {
      alert("Bitte einen Link eingeben.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingKey) {
        const updatedModule = await adminModuleRepository.update(
          editingKey,
          {
            title: form.title,
            description: form.description,
            href: form.href,
            icon: form.icon,
            category: form.category,
            badgeLabel: form.badgeLabel,
            sortOrder: form.sortOrder,
            isEnabled: form.isEnabled,
            isVisible: form.isVisible,
            isCore: form.isCore,
          },
        );

        setModules((current) =>
          current.map((module) =>
            module.key === updatedModule.key
              ? updatedModule
              : module,
          ),
        );

        closeModal();
        setMessage("Admin-Modul wurde gespeichert.");
        return;
      }

      const createdModule = await adminModuleRepository.create({
        key: form.key,
        title: form.title,
        description: form.description,
        href: form.href,
        icon: form.icon,
        category: form.category,
        badgeLabel: form.badgeLabel,
        sortOrder: form.sortOrder,
        isEnabled: form.isEnabled,
        isVisible: form.isVisible,
        isCore: form.isCore,
      });

      setModules((current) =>
        [
          ...current,
          createdModule,
        ].sort((first, second) => first.sortOrder - second.sortOrder),
      );

      closeModal();
      setMessage("Admin-Modul wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Admin-Modul konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(module: AdminModuleConfig) {
    try {
      setMessage("");
      setError("");

      const updatedModule = await adminModuleRepository.update(
        module.key,
        {
          isEnabled: !module.isEnabled,
        },
      );

      setModules((current) =>
        current.map((item) =>
          item.key === updatedModule.key
            ? updatedModule
            : item,
        ),
      );

      setMessage(
        updatedModule.isEnabled
          ? "Modul wurde aktiviert."
          : "Modul wurde deaktiviert.",
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

  async function toggleVisible(module: AdminModuleConfig) {
    try {
      setMessage("");
      setError("");

      const updatedModule = await adminModuleRepository.update(
        module.key,
        {
          isVisible: !module.isVisible,
        },
      );

      setModules((current) =>
        current.map((item) =>
          item.key === updatedModule.key
            ? updatedModule
            : item,
        ),
      );

      setMessage(
        updatedModule.isVisible
          ? "Modul wird angezeigt."
          : "Modul wurde ausgeblendet.",
      );
    } catch (toggleError) {
      console.error(toggleError);

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Sichtbarkeit konnte nicht geändert werden.",
      );
    }
  }

  async function deleteModule(module: AdminModuleConfig) {
    if (module.isCore) {
      alert("Kernmodule können nicht gelöscht werden. Du kannst sie deaktivieren oder ausblenden.");
      return;
    }

    const confirmed = confirm(
      `Admin-Modul "${module.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await adminModuleRepository.delete(module.key);

      setModules((current) =>
        current.filter((item) => item.key !== module.key),
      );

      setMessage("Admin-Modul wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Admin-Modul konnte nicht gelöscht werden.",
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
        description="Du hast keine Berechtigung für die Modulverwaltung."
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={editingKey ? "Admin-Modul bearbeiten" : "Admin-Modul erstellen"}
        description="Diese Einträge steuern später die Modulstruktur im Admin Backend."
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
              form="admin-module-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 disabled:bg-zinc-400 transition"
            >
              {saving
                ? "Speichert..."
                : editingKey
                  ? "Änderungen speichern"
                  : "Modul erstellen"}
            </button>
          </div>
        }
      >
        <form
          id="admin-module-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Modul-Key
              </label>
              <input
                value={form.key}
                onChange={(event) => updateForm("key", event.target.value)}
                disabled={Boolean(editingKey)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                placeholder="z. B. users"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Titel"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Link
              </label>
              <input
                value={form.href}
                onChange={(event) => updateForm("href", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="/admin/users"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Icon
              </label>
              <input
                value={form.icon}
                onChange={(event) => updateForm("icon", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="🧩"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {categoryOptions.map((option) => (
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
                Badge
              </label>
              <input
                value={form.badgeLabel}
                onChange={(event) => updateForm("badgeLabel", event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z. B. Benutzer"
              />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-4">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) => updateForm("isEnabled", event.target.checked)}
                  className="h-5 w-5 mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Aktiv
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-4">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(event) => updateForm("isVisible", event.target.checked)}
                  className="h-5 w-5 mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Sichtbar
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 border border-zinc-200 rounded-2xl p-4">
                <input
                  type="checkbox"
                  checked={form.isCore}
                  onChange={(event) => updateForm("isCore", event.target.checked)}
                  className="h-5 w-5 mt-1"
                />
                <span>
                  <span className="block font-medium">
                    Kernmodul
                  </span>
                </span>
              </label>
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={4}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung des Moduls..."
              />
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Admin Backend"
        title="Admin-Module"
        description="Verwaltungsbereiche zentral vorbereiten, aktivieren, ausblenden und sortieren."
        badges={[
          {
            label: `${modules.length} Module`,
          },
          {
            label: `${enabledCount} aktiv`,
          },
          {
            label: `${hiddenCount} ausgeblendet`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Modul erstellen
          </button>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Admin-Module werden geladen...
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
          label="Module gesamt"
          value={modules.length}
          description="Alle konfigurierten Module"
          icon="🧩"
          active={!categoryFilter && !statusFilter && !visibilityFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Aktiv"
          value={enabledCount}
          description="Aktivierte Module"
          icon="✅"
          tone="green"
          active={statusFilter === "enabled"}
          onClick={() => setStatusFilter("enabled")}
        />
        <StatCard
          label="Ausgeblendet"
          value={hiddenCount}
          description="Nicht sichtbare Module"
          icon="🙈"
          tone="orange"
          active={visibilityFilter === "hidden"}
          onClick={() => setVisibilityFilter("hidden")}
        />
        <StatCard
          label="Kernmodule"
          value={coreCount}
          description="Nicht löschbare Module"
          icon="🔒"
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
              Filtere nach Kategorie, Status oder Sichtbarkeit.
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
            placeholder="Module suchen..."
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>
            {categoryOptions.map((option) => (
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
            <option value="enabled">
              Aktiv
            </option>
            <option value="disabled">
              Deaktiviert
            </option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Sichtbarkeiten
            </option>
            <option value="visible">
              Sichtbar
            </option>
            <option value="hidden">
              Ausgeblendet
            </option>
          </select>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredModules.length} von {modules.length} Modulen gefunden.
        </p>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Modul
                </th>
                <th className="px-5 py-4 font-semibold">
                  Link
                </th>
                <th className="px-5 py-4 font-semibold">
                  Kategorie
                </th>
                <th className="px-5 py-4 font-semibold">
                  Status
                </th>
                <th className="px-5 py-4 font-semibold">
                  Sichtbarkeit
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
              {filteredModules.map((module) => (
                <tr
                  key={module.key}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-5 py-4 align-top min-w-[280px]">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {module.icon}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {module.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {module.key}
                        </p>
                        <p className="text-zinc-500 mt-2 line-clamp-2">
                          {module.description || "Keine Beschreibung"}
                        </p>
                        {module.isCore && (
                          <span className="inline-flex mt-2 text-xs bg-zinc-900 text-white px-2 py-1 rounded-full">
                            Kernmodul
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-top text-zinc-500">
                    {module.href}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {getCategoryLabel(module.category)}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(module.isEnabled)}`}>
                      {module.isEnabled ? "Aktiv" : "Deaktiviert"}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top">
                    <span className={`text-xs px-3 py-1 rounded-full ${getVisibleClass(module.isVisible)}`}>
                      {module.isVisible ? "Sichtbar" : "Ausgeblendet"}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-top text-zinc-500">
                    {module.sortOrder}
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(module)}
                        className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleEnabled(module)}
                        className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition"
                      >
                        {module.isEnabled ? "Deaktivieren" : "Aktivieren"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleVisible(module)}
                        className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition"
                      >
                        {module.isVisible ? "Ausblenden" : "Anzeigen"}
                      </button>

                      {!module.isCore && (
                        <button
                          type="button"
                          onClick={() => void deleteModule(module)}
                          className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 rounded-xl transition"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredModules.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-zinc-500"
                  >
                    Keine Module gefunden.
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