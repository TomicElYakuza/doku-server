"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
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

type ViewMode = "table" | "cards";

const emptyForm: ModuleForm = {
  key: "",
  title: "",
  description: "",
  href: "",
  icon: "",
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
    return "bg-green-50 text-green-700 border-green-100";
  }

  return "bg-zinc-100 text-zinc-500 border-zinc-200";
}

function getVisibleClass(visible: boolean) {
  if (visible) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-orange-50 text-orange-700 border-orange-100";
}

function normalizeForm(module: AdminModuleConfig): ModuleForm {
  return {
    key: module.key,
    title: module.title,
    description: module.description,
    href: module.href,
    icon: module.icon || "",
    category: module.category || "admin",
    badgeLabel: module.badgeLabel || "",
    sortOrder: module.sortOrder || 0,
    isEnabled: module.isEnabled,
    isVisible: module.isVisible,
    isCore: module.isCore,
  };
}

function sortModules(modules: AdminModuleConfig[]) {
  return [
    ...modules,
  ].sort((first, second) => {
    const sortCompare =
      Number(first.sortOrder || 0) - Number(second.sortOrder || 0);

    if (sortCompare !== 0) {
      return sortCompare;
    }

    return first.title.localeCompare(second.title);
  });
}

export default function AdminModulesPage() {
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<AdminModuleConfig[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
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

      setModules(
        sortModules(
          Array.isArray(nextModules) ? nextModules : [],
        ),
      );
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
        (statusFilter === "enabled" && module.isEnabled) ||
        (statusFilter === "disabled" && !module.isEnabled);

      const matchesVisibility =
        !visibilityFilter ||
        (visibilityFilter === "visible" && module.isVisible) ||
        (visibilityFilter === "hidden" && !module.isVisible);

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

  const visibleCount = useMemo(
    () => modules.filter((module) => module.isVisible).length,
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
            title: form.title.trim(),
            description: form.description.trim(),
            href: form.href.trim(),
            icon: form.icon.trim(),
            category: form.category,
            badgeLabel: form.badgeLabel.trim(),
            sortOrder: Number(form.sortOrder || 0),
            isEnabled: form.isEnabled,
            isVisible: form.isVisible,
            isCore: form.isCore,
          },
        );

        setModules((current) =>
          sortModules(
            current.map((module) =>
              module.key === updatedModule.key
                ? updatedModule
                : module,
            ),
          ),
        );

        closeModal();
        setMessage("Admin-Modul wurde gespeichert.");
        return;
      }

      const createdModule = await adminModuleRepository.create({
        key: form.key.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        href: form.href.trim(),
        icon: form.icon.trim(),
        category: form.category,
        badgeLabel: form.badgeLabel.trim(),
        sortOrder: Number(form.sortOrder || 0),
        isEnabled: form.isEnabled,
        isVisible: form.isVisible,
        isCore: form.isCore,
      });

      setModules((current) =>
        sortModules([
          ...current,
          createdModule,
        ]),
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
        sortModules(
          current.map((item) =>
            item.key === updatedModule.key
              ? updatedModule
              : item,
          ),
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
        sortModules(
          current.map((item) =>
            item.key === updatedModule.key
              ? updatedModule
              : item,
          ),
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
      alert(
        "Kernmodule können nicht gelöscht werden. Du kannst sie deaktivieren oder ausblenden.",
      );
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
        title="Admin-Module nicht verfügbar"
        description="Du hast keine Berechtigung, Admin-Module zu sehen."
        backHref="/admin"
        backLabel="Zurück zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title={editingKey ? "Modul bearbeiten" : "Modul erstellen"}
        description="Admin-Module steuern, welche Verwaltungsbereiche im Admin Dashboard angezeigt werden."
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 font-bold"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="module-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingKey
                  ? "Änderungen speichern"
                  : "Modul erstellen"}
            </button>
          </>
        }
      >
        <form
          id="module-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">
              Modul-Daten
            </h3>

            <p className="text-zinc-500 mt-1">
              Titel, Link, Icon und Kategorie für das Admin Dashboard.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block mb-2 font-bold">
                  Modul-Key
                </label>

                <input
                  value={form.key}
                  onChange={(event) =>
                    updateForm("key", event.target.value)
                  }
                  disabled={Boolean(editingKey)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus disabled:bg-zinc-100 disabled:text-zinc-400"
                  placeholder="z. B. users"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Titel
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Titel"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Link
                </label>

                <input
                  value={form.href}
                  onChange={(event) =>
                    updateForm("href", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="/admin/users"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Icon
                </label>

                <input
                  value={form.icon}
                  onChange={(event) =>
                    updateForm("icon", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="🛠️"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Kategorie
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
                <label className="block mb-2 font-bold">
                  Badge
                </label>

                <input
                  value={form.badgeLabel}
                  onChange={(event) =>
                    updateForm("badgeLabel", event.target.value)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. Benutzer"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
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
                <label className="block mb-2 font-bold">
                  Beschreibung
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={4}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Beschreibung des Moduls..."
                />
              </div>
            </div>
          </section>

          <section className="bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
            <h3 className="text-xl font-black">
              Status & Sichtbarkeit
            </h3>

            <p className="text-zinc-500 mt-1">
              Lege fest, ob das Modul aktiv ist, angezeigt wird und als Kernmodul geschützt ist.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
              <label className="flex items-start gap-3 bg-white border border-zinc-200 rounded-3xl p-5">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) =>
                    updateForm("isEnabled", event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-black">
                    Aktiv
                  </span>
                  <span className="block text-zinc-500 text-sm mt-1">
                    Modul kann verwendet werden.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 bg-white border border-zinc-200 rounded-3xl p-5">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(event) =>
                    updateForm("isVisible", event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-black">
                    Sichtbar
                  </span>
                  <span className="block text-zinc-500 text-sm mt-1">
                    Modul erscheint im Admin Dashboard.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 bg-white border border-zinc-200 rounded-3xl p-5">
                <input
                  type="checkbox"
                  checked={form.isCore}
                  onChange={(event) =>
                    updateForm("isCore", event.target.checked)
                  }
                  className="h-5 w-5 mt-1 accent-indigo-600"
                />

                <span>
                  <span className="block font-black">
                    Kernmodul
                  </span>
                  <span className="block text-zinc-500 text-sm mt-1">
                    Geschützt vor Löschung.
                  </span>
                </span>
              </label>
            </div>
          </section>
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
          {
            label: `${coreCount} Kernmodule`,
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadModules()}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Aktualisieren
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Modul erstellen
            </button>
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Admin-Module werden geladen..."
          description="Modul-Konfigurationen, Sichtbarkeit und Sortierung werden vorbereitet."
        />
      )}

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">
            {message}
          </p>
        </section>
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Admin-Module konnten nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadModules()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
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
          label="Sichtbar"
          value={visibleCount}
          description={`${hiddenCount} ausgeblendet`}
          icon="👁️"
          tone="blue"
          active={visibilityFilter === "visible"}
          onClick={() => setVisibilityFilter("visible")}
        />

        <StatCard
          label="Kernmodule"
          value={coreCount}
          description="Nicht löschbare Module"
          icon="🛡️"
          tone="indigo"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-black">
                Suche & Filter
              </h2>

              <p className="text-zinc-500 mt-1">
                Filtere nach Kategorie, Status, Sichtbarkeit, Link oder Modul-Key.
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
              placeholder="Module suchen..."
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="text-sm text-zinc-500">
              {filteredModules.length} von {modules.length} Modulen gefunden.
            </span>

            {search && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Suche: {search}
              </span>
            )}

            {categoryFilter && (
              <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                Kategorie: {getCategoryLabel(categoryFilter)}
              </span>
            )}

            {statusFilter && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Status: {statusFilter === "enabled" ? "Aktiv" : "Deaktiviert"}
              </span>
            )}

            {visibilityFilter && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Sichtbarkeit: {visibilityFilter === "visible" ? "Sichtbar" : "Ausgeblendet"}
              </span>
            )}
          </div>
        </div>
      </section>

      {!loading && !error && filteredModules.length === 0 && (
        <EmptyState
          icon="🧩"
          title="Keine Module gefunden"
          description="Passe die Filter an oder erstelle ein neues Admin-Modul."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Modul erstellen
            </button>
          }
        />
      )}

      {viewMode === "table" && filteredModules.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Modul
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Link
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Kategorie
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Status
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Sichtbarkeit
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500">
                    Sortierung
                  </th>
                  <th className="px-5 py-4 font-bold text-zinc-500 text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredModules.map((module) => (
                  <tr
                    key={module.key}
                    className="hover:bg-zinc-50 transition"
                  >
                    <td className="px-5 py-4 align-top min-w-[300px]">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">
                          {module.icon || "🧩"}
                        </span>

                        <div>
                          <p className="font-black text-zinc-950">
                            {module.title}
                          </p>

                          <p className="text-xs text-zinc-400 mt-1">
                            {module.key}
                          </p>

                          <p className="text-zinc-500 mt-2 line-clamp-2">
                            {module.description || "Keine Beschreibung"}
                          </p>

                          {module.isCore && (
                            <span className="inline-flex mt-2 text-xs app-accent-soft app-accent-text px-2 py-1 rounded-full font-bold">
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
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                        {getCategoryLabel(module.category)}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          module.isEnabled,
                        )}`}
                      >
                        {module.isEnabled ? "Aktiv" : "Deaktiviert"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getVisibleClass(
                          module.isVisible,
                        )}`}
                      >
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
                          className="app-accent-bg text-white px-3 py-2 rounded-xl transition font-bold app-brand-shadow"
                        >
                          Bearbeiten
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleEnabled(module)}
                          className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition font-bold"
                        >
                          {module.isEnabled ? "Deaktivieren" : "Aktivieren"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleVisible(module)}
                          className="bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition font-bold"
                        >
                          {module.isVisible ? "Ausblenden" : "Anzeigen"}
                        </button>

                        {!module.isCore && (
                          <button
                            type="button"
                            onClick={() => void deleteModule(module)}
                            className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 rounded-xl transition font-bold"
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && filteredModules.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredModules.map((module) => (
            <article
              key={module.key}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
            >
              <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-3xl">
                        {module.icon || "🧩"}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          module.isEnabled,
                        )}`}
                      >
                        {module.isEnabled ? "Aktiv" : "Deaktiviert"}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getVisibleClass(
                          module.isVisible,
                        )}`}
                      >
                        {module.isVisible ? "Sichtbar" : "Ausgeblendet"}
                      </span>

                      {module.isCore && (
                        <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                          Kernmodul
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-black mt-4">
                      {module.title}
                    </h2>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {module.description || "Keine Beschreibung"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(module)}
                    className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow shrink-0"
                  >
                    Bearbeiten
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Key
                    </p>
                    <p className="font-black mt-1 break-all">
                      {module.key}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Kategorie
                    </p>
                    <p className="font-black mt-1">
                      {getCategoryLabel(module.category)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Link
                    </p>
                    <p className="font-black mt-1 break-all">
                      {module.href}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Sortierung
                    </p>
                    <p className="font-black mt-1">
                      {module.sortOrder}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => void toggleEnabled(module)}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-bold"
                  >
                    {module.isEnabled ? "Deaktivieren" : "Aktivieren"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleVisible(module)}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-bold"
                  >
                    {module.isVisible ? "Ausblenden" : "Anzeigen"}
                  </button>

                  {!module.isCore && (
                    <button
                      type="button"
                      onClick={() => void deleteModule(module)}
                      className="bg-red-600 text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}