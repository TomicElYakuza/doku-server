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
  companyRepository,
} from "../../../lib/companyRepository";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  saveTicketTemplateCreatedActivity,
  saveTicketTemplateDeletedActivity,
  saveTicketTemplateUpdatedActivity,
} from "../../../lib/ticketTemplateActivityHelpers";

import type {
  Company,
  Department,
} from "../../../types/company";

import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../types/ticketTemplate";

function getStatusLabel(
  status: TicketTemplateStatus | string
) {
  return ticketTemplateRepository.getStatusLabel(
    status
  );
}

function getStatusClass(
  status: TicketTemplateStatus | string
) {
  return ticketTemplateRepository.getStatusClass(
    status
  );
}

function getPriorityLabel(
  priority: TicketTemplatePriority | string
) {
  return ticketTemplateRepository.getPriorityLabel(
    priority
  );
}

function getPriorityClass(
  priority: TicketTemplatePriority | string
) {
  return ticketTemplateRepository.getPriorityClass(
    priority
  );
}

export default function TicketTemplatesPage() {
  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingTemplateId, setEditingTemplateId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TicketTemplateStatus>("open");

  const [priority, setPriority] =
    useState<TicketTemplatePriority>("medium");

  const [category, setCategory] =
    useState("Allgemein");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

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

  useEffect(() => {
    void loadData();

    function handleTicketTemplatesUpdated() {
      void loadData();
    }

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTicketTemplatesUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTicketTemplatesUpdated
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextTemplates,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          ticketTemplateRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setTemplates(
        nextTemplates
      );

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
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

  function getCompanyName(
    id?: string
  ) {
    if (!id) {
      return "Intern";
    }

    return (
      companies.find(
        (company) =>
          company.id === id
      )?.name ||
      "Intern"
    );
  }

  function getDepartmentName(
    id?: string
  ) {
    if (!id) {
      return "Allgemein";
    }

    return (
      departments.find(
        (department) =>
          department.id === id
      )?.name ||
      "Allgemein"
    );
  }

  const departmentOptions =
    useMemo(
      () => {
        if (!companyId) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === companyId
        );
      },
      [
        departments,
        companyId,
      ]
    );

  const filteredTemplates =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return templates.filter(
          (template) => {
            const matchesSearch =
              !query ||
              [
                template.title,
                template.description,
                template.status,
                template.priority,
                template.category,
                template.company,
                template.department,
                template.assignedTo,
                template.tags?.join(" "),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesStatus =
              !statusFilter ||
              template.status === statusFilter;

            const matchesPriority =
              !priorityFilter ||
              template.priority === priorityFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesPriority
            );
          }
        );
      },
      [
        templates,
        search,
        statusFilter,
        priorityFilter,
      ]
    );

  const highOrUrgentTemplates =
    templates.filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent"
    );

  function resetForm() {
    setEditingTemplateId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory("Allgemein");
    setCompanyId("");
    setDepartmentId("");
    setAssignedTo("");
    setTags("");
    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();

    const firstCompany =
      companies[0];

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id
      );

    setCompanyId(
      firstCompany?.id ||
        ""
    );

    setDepartmentId(
      firstDepartment?.id ||
        ""
    );

    setShowForm(
      true
    );
  }

  function startEditTemplate(
    template: TicketTemplate
  ) {
    setEditingTemplateId(
      template.id
    );

    setTitle(
      template.title
    );

    setDescription(
      template.description
    );

    setStatus(
      template.status
    );

    setPriority(
      template.priority
    );

    setCategory(
      template.category ||
        "Allgemein"
    );

    setCompanyId(
      template.companyId ||
        ""
    );

    setDepartmentId(
      template.departmentId ||
        ""
    );

    setAssignedTo(
      template.assignedTo ||
        ""
    );

    setTags(
      template.tags.join(
        ", "
      )
    );

    setShowForm(
      true
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canCreate() && !editingTemplateId) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu erstellen."
      );

      return;
    }

    if (!canEdit() && editingTemplateId) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu bearbeiten."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    const companyName =
      getCompanyName(
        companyId
      );

    const departmentName =
      getDepartmentName(
        departmentId
      );

    try {
      setSaving(
        true
      );

      if (editingTemplateId) {
        const updatedTemplate =
          await ticketTemplateRepository.update(
            editingTemplateId,
            {
              title:
                title.trim(),

              description:
                description.trim(),

              status,

              priority,

              category:
                category.trim() ||
                "Allgemein",

              companyId,

              departmentId,

              company:
                companyName,

              department:
                departmentName,

              assignedTo:
                assignedTo.trim(),

              tags:
                splitTags(
                  tags
                ),
            }
          );

        if (updatedTemplate) {
          saveTicketTemplateUpdatedActivity(
            updatedTemplate
          );
        }

        resetForm();

        await loadData();

        return;
      }

      const createdTemplate =
        await ticketTemplateRepository.create({
          title:
            title.trim(),

          description:
            description.trim(),

          status,

          priority,

          category:
            category.trim() ||
            "Allgemein",

          companyId,

          departmentId,

          company:
            companyName,

          department:
            departmentName,

          assignedTo:
            assignedTo.trim(),

          tags:
            splitTags(
              tags
            ),
        });

      saveTicketTemplateCreatedActivity(
        createdTemplate
      );

      resetForm();

      await loadData();
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "Ticket-Vorlage konnte nicht gespeichert werden."
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

    const confirmed =
      confirm(
        `Vorlage "${template.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      saveTicketTemplateDeletedActivity(
        template
      );

      await ticketTemplateRepository.delete(
        template.id
      );

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket-Vorlage konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
  }

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

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Ticket-Vorlagen
          </h1>

          <p className="text-zinc-500 mt-2">
            Wiederverwendbare Ticket-Vorlagen aus PostgreSQL verwalten.
          </p>
        </div>

        {canCreate() && (
          <button
            type="button"
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Vorlage erstellen
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Vorlagen werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Vorlagen gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {templates.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "open"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Standard offen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              templates.filter(
                (template) =>
                  template.status === "open"
              ).length
            }
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setPriorityFilter(
              "urgent"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Hoch/Dringend
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {highOrUrgentTemplates.length}
          </h2>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {editingTemplateId
                ? "Vorlage bearbeiten"
                : "Vorlage erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Vorlage wird direkt in PostgreSQL gespeichert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
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
                placeholder="Vorlagentitel"
              />
            </div>

            <div className="md:col-span-2">
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
                placeholder="Beschreibung der Vorlage..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Standard-Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TicketTemplateStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="open">
                  Offen
                </option>

                <option value="in_progress">
                  In Bearbeitung
                </option>

                <option value="waiting">
                  Wartend
                </option>

                <option value="done">
                  Erledigt
                </option>

                <option value="closed">
                  Geschlossen
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Standard-Priorität
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as TicketTemplatePriority
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

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={companyId}
                onChange={(event) => {
                  const nextCompanyId =
                    event.target.value;

                  setCompanyId(
                    nextCompanyId
                  );

                  const firstDepartment =
                    departments.find(
                      (department) =>
                        department.companyId === nextCompanyId
                    );

                  setDepartmentId(
                    firstDepartment?.id ||
                      ""
                  );
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Keine Firma
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>

              <select
                value={departmentId}
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Keine Abteilung
                </option>

                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
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

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingTemplateId
                  ? "Änderungen speichern"
                  : "Vorlage erstellen"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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

            <option value="open">
              Offen
            </option>

            <option value="in_progress">
              In Bearbeitung
            </option>

            <option value="waiting">
              Wartend
            </option>

            <option value="done">
              Erledigt
            </option>

            <option value="closed">
              Geschlossen
            </option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Prioritäten
            </option>

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

        <p className="text-sm text-zinc-500 mt-5">
          {filteredTemplates.length} von {templates.length} Vorlagen gefunden.
        </p>
      </div>

      <div className="space-y-4">
        {filteredTemplates.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine Vorlagen gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Erstelle eine neue Vorlage oder passe die Filter an.
            </p>
          </div>
        )}

        {filteredTemplates.map(
          (template) => (
            <div
              key={template.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(template.status)}`}>
                      {getStatusLabel(
                        template.status
                      )}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(template.priority)}`}>
                      {getPriorityLabel(
                        template.priority
                      )}
                    </span>

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {template.company ||
                        "Intern"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {template.title}
                  </h2>

                  <p className="text-zinc-500 mt-2 line-clamp-2">
                    {template.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>

                  <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                    <span>
                      Kategorie:{" "}
                      {template.category ||
                        "Allgemein"}
                    </span>

                    <span>
                      Zugewiesen:{" "}
                      {template.assignedTo ||
                        "Niemand"}
                    </span>

                    <span>
                      Aktualisiert:{" "}
                      {template.updatedAt}
                    </span>
                  </div>
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
          )
        )}
      </div>
    </div>
  );
}