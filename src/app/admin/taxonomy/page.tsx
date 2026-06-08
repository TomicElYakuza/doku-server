"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canManageSystem,
  canViewAdmin,
} from "../../../lib/permissions";
import {
  taxonomyRepository,
} from "../../../lib/taxonomyRepository";
import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import type {
  TaxonomyItem,
  TaxonomyStatus,
  TaxonomyTarget,
  TaxonomyType,
} from "../../../types/taxonomy";

type FormMode = "create" | "edit" | "";
type ViewMode = "table" | "cards";

type TargetOption = {
  value: TaxonomyTarget;
  label: string;
  description: string;
};

type TypeOption = {
  value: TaxonomyType;
  label: string;
  description: string;
};

type StatusOption = {
  value: TaxonomyStatus;
  label: string;
  description: string;
};

const targetOptions: TargetOption[] = [
  {
    value: "ticket",
    label: "Tickets",
    description:
      "Kategorien für Ticket-Erstellung, Ticket-Filter und Ticket-Struktur.",
  },
  {
    value: "wiki",
    label: "Wiki",
    description:
      "Kategorien für Wiki-Seiten, Dokumentation und Wissensbereiche.",
  },
  {
    value: "global",
    label: "Global",
    description:
      "Globale Tags, die in mehreren Modulen verwendet werden können.",
  },
];

const typeOptions: TypeOption[] = [
  {
    value: "category",
    label: "Kategorie",
    description:
      "Hierarchische Kategorie, optional mit Parent-Struktur.",
  },
  {
    value: "tag",
    label: "Tag",
    description:
      "Schlagwort zur schnellen Zuordnung und Filterung.",
  },
];

const statusOptions: StatusOption[] = [
  {
    value: "active",
    label: "Aktiv",
    description:
      "Kann in Dropdowns und Filtern verwendet werden.",
  },
  {
    value: "inactive",
    label: "Inaktiv",
    description:
      "Bleibt gespeichert, wird aber nicht aktiv angeboten.",
  },
  {
    value: "archived",
    label: "Archiviert",
    description:
      "Historischer Eintrag, nicht mehr für neue Zuordnungen gedacht.",
  },
];

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTargetLabel(target: TaxonomyTarget | string) {
  return (
    targetOptions.find((option) => option.value === target)?.label ||
    target
  );
}

function getTypeLabel(type: TaxonomyType | string) {
  return (
    typeOptions.find((option) => option.value === type)?.label ||
    type
  );
}

function getStatusLabel(status: TaxonomyStatus | string) {
  return (
    statusOptions.find((option) => option.value === status)?.label ||
    status
  );
}

function getStatusClass(status: TaxonomyStatus | string) {
  if (status === "active") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "inactive") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (status === "archived") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getTargetClass(target: TaxonomyTarget | string) {
  if (target === "ticket") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (target === "wiki") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (target === "global") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getTypeClass(type: TaxonomyType | string) {
  if (type === "category") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (type === "tag") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function sortTaxonomyItems(items: TaxonomyItem[]) {
  return [...items].sort((first, second) => {
    const targetCompare = first.target.localeCompare(second.target);

    if (targetCompare !== 0) {
      return targetCompare;
    }

    const typeCompare = first.type.localeCompare(second.type);

    if (typeCompare !== 0) {
      return typeCompare;
    }

    const sortCompare = first.sortOrder - second.sortOrder;

    if (sortCompare !== 0) {
      return sortCompare;
    }

    return first.name.localeCompare(second.name);
  });
}

export default function AdminTaxonomyPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<TaxonomyItem[]>([]);

  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [formMode, setFormMode] = useState<FormMode>("");
  const [editingId, setEditingId] = useState("");

  const [target, setTarget] = useState<TaxonomyTarget>("ticket");
  const [type, setType] = useState<TaxonomyType>("category");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<TaxonomyStatus>("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadItems();

    function handleTaxonomyUpdated() {
      void loadItems();
    }

    window.addEventListener(
      "taxonomyUpdated",
      handleTaxonomyUpdated,
    );

    return () => {
      window.removeEventListener(
        "taxonomyUpdated",
        handleTaxonomyUpdated,
      );
    };
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const nextItems = await taxonomyRepository.list();

      setItems(
        sortTaxonomyItems(
          Array.isArray(nextItems) ? nextItems : [],
        ),
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Kategorien & Tags konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormMode("");
    setEditingId("");
    setTarget("ticket");
    setType("category");
    setName("");
    setSlug("");
    setDescription("");
    setParentId("");
    setSortOrder(0);
    setStatus("active");
  }

  function closeModal() {
    resetForm();
  }

  function openCreateForm(
    nextTarget: TaxonomyTarget = "ticket",
    nextType: TaxonomyType = "category",
  ) {
    if (!canManageSystem()) {
      alert("Du hast keine Berechtigung, Kategorien & Tags zu verwalten.");
      return;
    }

    resetForm();
    setTarget(nextTarget);
    setType(nextTarget === "global" ? "tag" : nextType);
    setFormMode("create");
  }

  function startEditItem(item: TaxonomyItem) {
    if (!canManageSystem()) {
      alert("Du hast keine Berechtigung, Kategorien & Tags zu bearbeiten.");
      return;
    }

    setEditingId(item.id);
    setTarget(item.target);
    setType(item.type);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description || "");
    setParentId(item.parentId || "");
    setSortOrder(item.sortOrder);
    setStatus(item.status);
    setFormMode("edit");
  }

  const categoryItems = useMemo(
    () =>
      items.filter((item) => item.type === "category"),
    [
      items,
    ],
  );

  const tagItems = useMemo(
    () =>
      items.filter((item) => item.type === "tag"),
    [
      items,
    ],
  );

  const activeItems = useMemo(
    () =>
      items.filter((item) => item.status === "active"),
    [
      items,
    ],
  );

  const inactiveItems = useMemo(
    () =>
      items.filter((item) => item.status === "inactive"),
    [
      items,
    ],
  );

  const archivedItems = useMemo(
    () =>
      items.filter((item) => item.status === "archived"),
    [
      items,
    ],
  );

  const ticketCategories = useMemo(
    () =>
      items.filter(
        (item) =>
          item.target === "ticket" &&
          item.type === "category",
      ),
    [
      items,
    ],
  );

  const wikiCategories = useMemo(
    () =>
      items.filter(
        (item) =>
          item.target === "wiki" &&
          item.type === "category",
      ),
    [
      items,
    ],
  );

  const globalTags = useMemo(
    () =>
      items.filter(
        (item) =>
          item.target === "global" &&
          item.type === "tag",
      ),
    [
      items,
    ],
  );

  const parentOptions = useMemo(
    () =>
      items.filter(
        (item) =>
          item.type === "category" &&
          item.target === target &&
          item.id !== editingId,
      ),
    [
      items,
      target,
      editingId,
    ],
  );

  const filterParentOptions = useMemo(
    () =>
      items.filter((item) => item.type === "category"),
    [
      items,
    ],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const pathLabel = taxonomyRepository.getPathLabel(item.id, items);
      const parent = items.find(
        (parentItem) => parentItem.id === item.parentId,
      );

      const matchesSearch =
        !query ||
        [
          item.id,
          item.name,
          item.slug,
          item.description,
          item.type,
          item.target,
          item.status,
          item.sortOrder,
          parent?.name,
          pathLabel,
          item.createdAt,
          item.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesTarget =
        !targetFilter ||
        item.target === targetFilter;

      const matchesType =
        !typeFilter ||
        item.type === typeFilter;

      const matchesStatus =
        !statusFilter ||
        item.status === statusFilter;

      const matchesParent =
        !parentFilter ||
        item.parentId === parentFilter;

      return (
        matchesSearch &&
        matchesTarget &&
        matchesType &&
        matchesStatus &&
        matchesParent
      );
    });
  }, [
    items,
    search,
    targetFilter,
    typeFilter,
    statusFilter,
    parentFilter,
  ]);

  function resetFilters() {
    setSearch("");
    setTargetFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setParentFilter("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canManageSystem()) {
      alert("Du hast keine Berechtigung, Kategorien & Tags zu verwalten.");
      return;
    }

    if (!name.trim()) {
      alert("Bitte einen Namen eingeben.");
      return;
    }

    const nextSlug = slug.trim()
      ? createSlug(slug)
      : createSlug(name);

    if (!nextSlug) {
      alert("Bitte einen gültigen Slug eingeben.");
      return;
    }

    const nextParentId = type === "category" ? parentId : "";

    const payload = {
      type,
      target,
      name: name.trim(),
      slug: nextSlug,
      description: description.trim(),
      parentId: nextParentId,
      sortOrder: Number(sortOrder || 0),
      status,
    };

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingId) {
        await taxonomyRepository.update(editingId, payload);

        closeModal();
        await loadItems();
        setMessage("Eintrag wurde gespeichert.");
        return;
      }

      await taxonomyRepository.create(payload);

      closeModal();
      await loadItems();
      setMessage("Eintrag wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Eintrag konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item: TaxonomyItem) {
    if (!canManageSystem()) {
      alert("Du hast keine Berechtigung, Kategorien & Tags zu löschen.");
      return;
    }

    const children = items.filter(
      (currentItem) => currentItem.parentId === item.id,
    );

    const confirmed = confirm(
      `Eintrag "${item.name}" wirklich löschen? Untereinträge: ${children.length}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await taxonomyRepository.delete(item.id);
      await loadItems();

      setMessage("Eintrag wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Eintrag konnte nicht gelöscht werden.",
      );
    }
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Kategorien & Tags"
        description="Du hast keine Berechtigung für die Taxonomie-Verwaltung."
        backHref="/admin"
        backLabel="Zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={Boolean(formMode)}
        onClose={closeModal}
        title={
          editingId
            ? "Eintrag bearbeiten"
            : "Eintrag erstellen"
        }
        description="Kategorien und Tags werden zentral in PostgreSQL gespeichert."
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
              form="taxonomy-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingId
                  ? "Speichern"
                  : "Erstellen"}
            </button>
          </>
        }
      >
        <form
          id="taxonomy-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Ziel & Typ
              </h3>
              <p className="text-zinc-500 mt-1">
                Lege fest, wo der Eintrag verwendet wird.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {targetOptions.map((option) => {
                const active = target === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTarget(option.value);
                      setParentId("");

                      if (
                        option.value === "global" &&
                        type === "category"
                      ) {
                        setType("tag");
                      }
                    }}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-bg text-white app-brand-shadow border-transparent"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h4 className="font-black">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {typeOptions.map((option) => {
                const active = type === option.value;
                const disabled =
                  target === "global" &&
                  option.value === "category";

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setType(option.value);

                      if (option.value === "tag") {
                        setParentId("");
                      }
                    }}
                    className={`text-left border rounded-3xl p-5 transition disabled:opacity-50 ${
                      active
                        ? "app-accent-bg text-white border-transparent app-brand-shadow"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h4 className="font-black">
                      {option.label}
                    </h4>
                    <p
                      className={`text-sm mt-2 ${
                        active ? "text-white/75" : "text-zinc-500"
                      }`}
                    >
                      {disabled
                        ? "Globale Einträge werden als Tags geführt."
                        : option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Stammdaten
              </h3>
              <p className="text-zinc-500 mt-1">
                Name, Slug, Parent und Sortierung für Dropdowns und Filter.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;

                    setName(value);

                    if (!slug) {
                      setSlug(createSlug(value));
                    }
                  }}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. Intranet"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Slug
                </label>
                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(createSlug(event.target.value))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. intranet"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Sortierung
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(Number(event.target.value || 0))
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Parent
                </label>
                <select
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  disabled={type !== "category"}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <option value="">
                    Kein Parent
                  </option>

                  {parentOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {taxonomyRepository.getPathLabel(item.id, items)}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-zinc-500 mt-2">
                  Nur Kategorien können einen Parent haben.
                </p>
              </div>

              <div className="xl:col-span-2">
                <label className="block mb-2 font-medium">
                  Beschreibung
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
                  placeholder="Beschreibung..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Status
              </h3>
              <p className="text-zinc-500 mt-1">
                Aktive Einträge werden in Formularen und Filtern angeboten.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {statusOptions.map((option) => {
                const active = status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`text-left border rounded-3xl p-5 transition ${
                      active
                        ? "app-accent-bg text-white border-transparent app-brand-shadow"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <h4 className="font-black">
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
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Velunis Admin"
        title="Kategorien & Tags"
        description="Zentrale Taxonomie für Tickets, Wiki und globale Tags. Kategorien können hierarchisch aufgebaut werden."
        badges={[
          {
            label: `${items.length} Einträge`,
          },
          {
            label: `${categoryItems.length} Kategorien`,
          },
          {
            label: `${tagItems.length} Tags`,
          },
          {
            label: `${activeItems.length} aktiv`,
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadItems()}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Aktualisieren
            </button>

            {canManageSystem() && (
              <>
                <button
                  type="button"
                  onClick={() => openCreateForm("ticket", "category")}
                  className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
                >
                  Kategorie erstellen
                </button>

                <button
                  type="button"
                  onClick={() => openCreateForm("global", "tag")}
                  className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
                >
                  Tag erstellen
                </button>
              </>
            )}
          </>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Kategorien & Tags werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard
          label="Gesamt"
          value={items.length}
          description="Alle Einträge"
          icon="🗂️"
          active={
            !targetFilter &&
            !typeFilter &&
            !statusFilter &&
            !parentFilter &&
            !search
          }
          onClick={resetFilters}
        />

        <StatCard
          label="Ticket-Kategorien"
          value={ticketCategories.length}
          description="Für Tickets"
          icon="🎫"
          tone="orange"
          active={
            targetFilter === "ticket" &&
            typeFilter === "category"
          }
          onClick={() => {
            setTargetFilter("ticket");
            setTypeFilter("category");
          }}
        />

        <StatCard
          label="Wiki-Kategorien"
          value={wikiCategories.length}
          description="Für Wiki-Seiten"
          icon="📚"
          tone="indigo"
          active={
            targetFilter === "wiki" &&
            typeFilter === "category"
          }
          onClick={() => {
            setTargetFilter("wiki");
            setTypeFilter("category");
          }}
        />

        <StatCard
          label="Globale Tags"
          value={globalTags.length}
          description="Für mehrere Module"
          icon="🏷️"
          tone="purple"
          active={
            targetFilter === "global" &&
            typeFilter === "tag"
          }
          onClick={() => {
            setTargetFilter("global");
            setTypeFilter("tag");
          }}
        />

        <StatCard
          label="Aktiv"
          value={activeItems.length}
          description={`${inactiveItems.length} inaktiv · ${archivedItems.length} archiviert`}
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Name, Slug, Beschreibung, Ziel, Typ oder Parent-Pfad.
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

        <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="Kategorien & Tags suchen..."
          />

          <select
            value={targetFilter}
            onChange={(event) => setTargetFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Ziele
            </option>

            {targetOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Typen
            </option>

            {typeOptions.map((option) => (
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

            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={parentFilter}
            onChange={(event) => setParentFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Parents
            </option>

            {filterParentOptions.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {taxonomyRepository.getPathLabel(item.id, items)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <span className="text-sm text-zinc-500">
            {filteredItems.length} von {items.length} Einträgen gefunden.
          </span>

          {search && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Suche: {search}
            </span>
          )}

          {targetFilter && (
            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
              Ziel: {getTargetLabel(targetFilter)}
            </span>
          )}

          {typeFilter && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Typ: {getTypeLabel(typeFilter)}
            </span>
          )}

          {statusFilter && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Status: {getStatusLabel(statusFilter)}
            </span>
          )}
        </div>
      </section>

      {filteredItems.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
            🔎
          </div>

          <h2 className="text-xl font-semibold mt-5">
            Keine Einträge gefunden
          </h2>
          <p className="text-zinc-500 mt-2">
            Erstelle einen Eintrag oder passe die Filter an.
          </p>
        </div>
      )}

      {viewMode === "table" && filteredItems.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Eintrag
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Ziel / Typ
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Pfad
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Parent
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Status
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
                {filteredItems.map((item) => {
                  const parent = items.find(
                    (parentItem) => parentItem.id === item.parentId,
                  );
                  const pathLabel =
                    taxonomyRepository.getPathLabel(item.id, items) ||
                    item.name;
                  const children = items.filter(
                    (currentItem) => currentItem.parentId === item.id,
                  );

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="font-black text-zinc-950">
                          {item.name}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {item.description || "Keine Beschreibung vorhanden."}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Slug: {item.slug}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getTargetClass(
                              item.target,
                            )}`}
                          >
                            {getTargetLabel(item.target)}
                          </span>

                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getTypeClass(
                              item.type,
                            )}`}
                          >
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-600">
                        {pathLabel}
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-600">
                        {parent?.name || "-"}
                        {children.length > 0 && (
                          <p className="text-xs text-zinc-400 mt-1">
                            {children.length} Untereinträge
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                            item.status,
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-600">
                        {item.sortOrder}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {canManageSystem() && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditItem(item)}
                              className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
                            >
                              Bearbeiten
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDeleteItem(item)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                            >
                              Löschen
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && filteredItems.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const parent = items.find(
              (parentItem) => parentItem.id === item.parentId,
            );
            const pathLabel =
              taxonomyRepository.getPathLabel(item.id, items) ||
              item.name;
            const children = items.filter(
              (currentItem) => currentItem.parentId === item.id,
            );

            return (
              <article
                key={item.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getTargetClass(
                          item.target,
                        )}`}
                      >
                        {getTargetLabel(item.target)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getTypeClass(
                          item.type,
                        )}`}
                      >
                        {getTypeLabel(item.type)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusClass(
                          item.status,
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      {children.length > 0 && (
                        <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                          {children.length} Untereinträge
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-black mt-4 line-clamp-1">
                      {item.name}
                    </h2>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {item.description || "Keine Beschreibung vorhanden."}
                    </p>
                  </div>

                  {canManageSystem() && (
                    <div className="flex flex-wrap gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditItem(item)}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(item)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Slug
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {item.slug}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Pfad
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {pathLabel}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Parent
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {parent?.name || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Sortierung
                    </p>
                    <p className="font-bold mt-1">
                      {item.sortOrder}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Erstellt
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {item.createdAt || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Aktualisiert
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {item.updatedAt || "-"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}


