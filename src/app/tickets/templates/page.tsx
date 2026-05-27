"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ticketTemplateRepository,
} from "../../../lib/ticketTemplateRepository";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  useFeatureFlags,
} from "../../../hooks/useFeatureFlags";

import AppModal from "../../../components/AppModal";

import PageHero from "../../../components/PageHero";

import StatCard from "../../../components/StatCard";

import type {
  TicketTemplate,
} from "../../../types/ticketTemplate";

type TemplateStatus =
  | "active"
  | "inactive";

function getValue(
  template: TicketTemplate,
  key: string,
  fallback = ""
) {
  const value =
    (
      template as unknown as Record<string, unknown>
    )[key];

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(
    value
  );
}

function getArrayValue(
  template: TicketTemplate,
  key: string
) {
  const value =
    (
      template as unknown as Record<string, unknown>
    )[key];

  if (Array.isArray(value)) {
    return value
      .map(
        (item) =>
          String(
            item
          )
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

function splitTags(
  value: string
) {
  return value
    .split(",")
    .map(
      (tag) =>
        tag.trim()
    )
    .filter(Boolean);
}

function getStatusClass(
  status: string
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getStatusLabel(
  status: string
) {
  if (status === "active") {
    return "Aktiv";
  }

  if (status === "inactive") {
    return "Inaktiv";
  }

  return status ||
    "Unbekannt";
}

function getPriorityLabel(
  priority: string
) {
  if (priority === "low") {
    return "Niedrig";
  }

  if (priority === "medium") {
    return "Mittel";
  }

  if (priority === "high") {
    return "Hoch";
  }

  if (priority === "urgent") {
    return "Dringend";
  }

  return priority ||
    "Mittel";
}

function getPriorityClass(
  priority: string
) {
  if (priority === "urgent") {
    return "bg-red-50 text-red-700";
  }

  if (priority === "high") {
    return "bg-orange-50 text-orange-700";
  }

  if (priority === "medium") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function TicketTemplatesPage() {
  const {
    ticketTemplatesEnabled,
  } =
    useFeatureFlags();

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTemplateId, setEditingTemplateId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("Allgemein");

  const [priority, setPriority] =
    useState("medium");

  const [status, setStatus] =
    useState<TemplateStatus>("active");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    void loadTemplates();

    function handleTemplatesUpdated() {
      void loadTemplates();
    }

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTemplatesUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTemplatesUpdated
      );
    };
  }, []);

  async function loadTemplates() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextTemplates =
        await ticketTemplateRepository.list();

      setTemplates(
        Array.isArray(
          nextTemplates
        )
          ? nextTemplates
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ticket-Vorlagen konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const filteredTemplates =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return templates.filter(
          (template) => {
            const templateStatus =
              getValue(
                template,
                "status",
                "active"
              );

            const templateTags =
              getArrayValue(
                template,
                "tags"
              ).join(" ");

            const matchesSearch =
              !query ||
              [
                getValue(
                  template,
                  "id"
                ),
                getValue(
                  template,
                  "title"
                ),
                getValue(
                  template,
                  "description"
                ),
                getValue(
                  template,
                  "category"
                ),
                getValue(
                  template,
                  "priority"
                ),
                getValue(
                  template,
                  "assignedTo"
                ),
                templateTags,
                getValue(
                  template,
                  "createdAt"
                ),
                getValue(
                  template,
                  "updatedAt"
                ),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesStatus =
              !statusFilter ||
              templateStatus === statusFilter;

            return (
              matchesSearch &&
              matchesStatus
            );
          }
        );
      },
      [
        templates,
        search,
        statusFilter,
      ]
    );

  const activeTemplates =
    useMemo(
      () =>
        templates.filter(
          (template) =>
            getValue(
              template,
              "status",
              "active"
            ) === "active"
        ),
      [
        templates,
      ]
    );

  const inactiveTemplates =
    useMemo(
      () =>
        templates.filter(
          (template) =>
            getValue(
              template,
              "status",
              "active"
            ) === "inactive"
        ),
      [
        templates,
      ]
    );

  const urgentTemplates =
    useMemo(
      () =>
        templates.filter(
          (template) => {
            const templatePriority =
              getValue(
                template,
                "priority",
                "medium"
              );

            return (
              templatePriority === "urgent" ||
              templatePriority === "high"
            );
          }
        ),
      [
        templates,
      ]
    );

  function resetForm() {
    setEditingTemplateId(
      ""
    );

    setTitle(
      ""
    );

    setDescription(
      ""
    );

    setCategory(
      "Allgemein"
    );

    setPriority(
      "medium"
    );

    setStatus(
      "active"
    );

    setAssignedTo(
      ""
    );

    setTags(
      ""
    );
  }

  function closeModal() {
    setModalOpen(
      false
    );

    resetForm();
  }

  function openCreateForm() {
    resetForm();

    setModalOpen(
      true
    );
  }

  function startEditTemplate(
    template: TicketTemplate
  ) {
    setEditingTemplateId(
      getValue(
        template,
        "id"
      )
    );

    setTitle(
      getValue(
        template,
        "title"
      )
    );

    setDescription(
      getValue(
        template,
        "description"
      )
    );

    setCategory(
      getValue(
        template,
        "category",
        "Allgemein"
      )
    );

    setPriority(
      getValue(
        template,
        "priority",
        "medium"
      )
    );

    setStatus(
      getValue(
        template,
        "status",
        "active"
      ) as TemplateStatus
    );

    setAssignedTo(
      getValue(
        template,
        "assignedTo"
      )
    );

    setTags(
      getArrayValue(
        template,
        "tags"
      ).join(
        ", "
      )
    );

    setModalOpen(
      true
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    if (
      editingTemplateId &&
      !canEdit()
    ) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu bearbeiten."
      );

      return;
    }

    if (
      !editingTemplateId &&
      !canCreate()
    ) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu erstellen."
      );

      return;
    }

    const payload = {
      title:
        title.trim(),

      description:
        description.trim(),

      category:
        category.trim() ||
        "Allgemein",

      priority,

      status,

      assignedTo:
        assignedTo.trim(),

      tags:
        splitTags(
          tags
        ),
    };

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

      if (editingTemplateId) {
        await ticketTemplateRepository.update(
          editingTemplateId,
          payload as never
        );

        closeModal();

        await loadTemplates();

        setMessage(
          "Vorlage wurde gespeichert."
        );

        return;
      }

      await ticketTemplateRepository.create(
        payload as never
      );

      closeModal();

      await loadTemplates();

      setMessage(
        "Vorlage wurde erstellt."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Vorlage konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeleteTemplate(
    template: TicketTemplate
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu löschen."
      );

      return;
    }

    const templateId =
      getValue(
        template,
        "id"
      );

    const templateTitle =
      getValue(
        template,
        "title",
        "Vorlage"
      );

    const confirmed =
      confirm(
        `Ticket-Vorlage "${templateTitle}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage(
        ""
      );

      setError(
        ""
      );

      await ticketTemplateRepository.delete(
        templateId
      );

      await loadTemplates();

      setMessage(
        "Vorlage wurde gelöscht."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Vorlage konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch(
      ""
    );

    setStatusFilter(
      ""
    );
  }

  if (!ticketTemplatesEnabled) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zu Tickets
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            Ticket-Vorlagen deaktiviert
          </h1>

          <p className="text-zinc-500 mt-2">
            Dieses Modul ist aktuell in den Einstellungen deaktiviert.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={
          editingTemplateId
            ? "Vorlage bearbeiten"
            : "Vorlage erstellen"
        }
        description="Ticket-Vorlage wird direkt in PostgreSQL gespeichert."
        maxWidth="3xl"
        onClose={closeModal}
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="ticket-template-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingTemplateId
                  ? "Vorlage speichern"
                  : "Vorlage erstellen"}
            </button>
          </div>
        )}
      >
        <form
          id="ticket-template-form"
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-medium">
              Titel
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="z. B. Neuer Arbeitsplatz"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Beschreibung
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={5}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
              placeholder="Standardbeschreibung für das Ticket..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Allgemein"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Priorität
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="low">
                  Niedrig
                </option>

                <option value="medium">
                  Mittel
                </option>

                <option value="high">
                  Hoch
                </option>

                <option value="urgent">
                  Dringend
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TemplateStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="active">
                  Aktiv
                </option>

                <option value="inactive">
                  Inaktiv
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>

              <input
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name oder Team"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <input
                value={tags}
                onChange={(event) =>
                  setTags(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="hardware, onboarding, support"
              />
            </div>
          </div>
        </form>
      </AppModal>

      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>
      </div>

      <PageHero
        eyebrow="Tickets"
        title="Ticket-Vorlagen"
        description="Wiederverwendbare Vorlagen für Supportfälle aus PostgreSQL verwalten."
        badges={[
          {
            label:
              `${templates.length} Vorlagen`,
          },
          {
            label:
              `${activeTemplates.length} aktiv`,
          },
          {
            label:
              `${inactiveTemplates.length} inaktiv`,
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void loadTemplates()
              }
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
            >
              Aktualisieren
            </button>

            {canCreate() && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Vorlage erstellen
              </button>
            )}
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Ticket-Vorlagen werden geladen...
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
          label="Vorlagen gesamt"
          value={templates.length}
          description="Alle Ticket-Vorlagen"
          icon="📋"
          active={!statusFilter}
          onClick={resetFilters}
        />

        <StatCard
          label="Aktiv"
          value={activeTemplates.length}
          description="Verwendbare Vorlagen"
          icon="✅"
          tone="green"
          active={statusFilter === "active"}
          onClick={() =>
            setStatusFilter(
              "active"
            )
          }
        />

        <StatCard
          label="Inaktiv"
          value={inactiveTemplates.length}
          description="Nicht in Verwendung"
          icon="⏸️"
          active={statusFilter === "inactive"}
          onClick={() =>
            setStatusFilter(
              "inactive"
            )
          }
        />

        <StatCard
          label="Hoch/Dringend"
          value={urgentTemplates.length}
          description="Priorisierte Vorlagen"
          icon="🚨"
          tone="red"
          onClick={() =>
            setSearch(
              "urgent high hoch dringend"
            )
          }
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Kategorie oder Tags.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Vorlagen suchen..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Status
            </option>

            <option value="active">
              Aktiv
            </option>

            <option value="inactive">
              Inaktiv
            </option>
          </select>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredTemplates.length} von {templates.length} Vorlagen gefunden.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filteredTemplates.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-semibold">
              Keine Vorlagen gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Erstelle eine neue Vorlage oder passe die Filter an.
            </p>
          </div>
        )}

        {filteredTemplates.map(
          (template) => {
            const templateId =
              getValue(
                template,
                "id"
              );

            const templateTitle =
              getValue(
                template,
                "title",
                "Unbenannte Vorlage"
              );

            const templateDescription =
              getValue(
                template,
                "description",
                "Keine Beschreibung vorhanden."
              );

            const templateCategory =
              getValue(
                template,
                "category",
                "Allgemein"
              );

            const templatePriority =
              getValue(
                template,
                "priority",
                "medium"
              );

            const templateStatus =
              getValue(
                template,
                "status",
                "active"
              );

            const templateTags =
              getArrayValue(
                template,
                "tags"
              );

            return (
              <div
                key={templateId}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(templateStatus)}`}>
                        {getStatusLabel(
                          templateStatus
                        )}
                      </span>

                      <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(templatePriority)}`}>
                        {getPriorityLabel(
                          templatePriority
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {templateCategory}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {templateTitle}
                    </h2>

                    <p className="text-zinc-500 mt-2 whitespace-pre-wrap">
                      {templateDescription}
                    </p>

                    {templateTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        {templateTags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 shrink-0">
                    {canEdit() && (
                      <button
                        type="button"
                        onClick={() =>
                          startEditTemplate(
                            template
                          )
                        }
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Bearbeiten
                      </button>
                    )}

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteTemplate(
                            template
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}