"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../lib/permissions";

import {
  saveTicketCreatedActivity,
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../lib/ticketActivityHelpers";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../types/ticket";

import type {
  Company,
  Department,
} from "../../types/company";

function getStatusLabel(
  status: TicketStatus | string
) {
  return ticketRepository.getStatusLabel(
    status
  );
}

function getStatusClass(
  status: TicketStatus | string
) {
  return ticketRepository.getStatusClass(
    status
  );
}

function getPriorityLabel(
  priority: TicketPriority | string
) {
  return ticketRepository.getPriorityLabel(
    priority
  );
}

function getPriorityClass(
  priority: TicketPriority | string
) {
  return ticketRepository.getPriorityClass(
    priority
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] =
    useState<Ticket[]>([]);

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

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingTicketId, setEditingTicketId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TicketStatus>("open");

  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  const [category, setCategory] =
    useState("Allgemein");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [createdBy, setCreatedBy] =
    useState("System");

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

    function handleTicketsUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );
    };
  }, []);

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError
      );
    }
  }

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextTickets,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          ticketRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setTickets(
        nextTickets
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
          : "Tickets konnten nicht geladen werden."
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

  const filteredDepartments =
    useMemo(
      () => {
        if (!companyFilter) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === companyFilter
        );
      },
      [
        departments,
        companyFilter,
      ]
    );

  const filteredTickets =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return tickets.filter(
          (ticket) => {
            const companyName =
              getCompanyName(
                ticket.companyId
              );

            const departmentName =
              getDepartmentName(
                ticket.departmentId
              );

            const matchesSearch =
              !query ||
              [
                ticket.id,
                ticket.title,
                ticket.description,
                ticket.status,
                ticket.priority,
                ticket.category,
                ticket.company,
                ticket.department,
                companyName,
                departmentName,
                ticket.assignedTo,
                ticket.createdBy,
                ticket.tags?.join(" "),
                ticket.createdAt,
                ticket.updatedAt,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesStatus =
              !statusFilter ||
              ticket.status === statusFilter;

            const matchesPriority =
              !priorityFilter ||
              ticket.priority === priorityFilter;

            const matchesCompany =
              !companyFilter ||
              ticket.companyId === companyFilter;

            const matchesDepartment =
              !departmentFilter ||
              ticket.departmentId === departmentFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesPriority &&
              matchesCompany &&
              matchesDepartment
            );
          }
        );
      },
      [
        tickets,
        search,
        statusFilter,
        priorityFilter,
        companyFilter,
        departmentFilter,
        companies,
        departments,
      ]
    );

  const openTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "open"
    );

  const inProgressTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "in_progress"
    );

  const highOrUrgentTickets =
    tickets.filter(
      (ticket) =>
        ticket.priority === "high" ||
        ticket.priority === "urgent"
    );

  const closedTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "closed"
    );

  function resetForm() {
    setEditingTicketId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory("Allgemein");
    setCompanyId("");
    setDepartmentId("");
    setAssignedTo("");
    setCreatedBy("System");
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

  function startEditTicket(
    ticket: Ticket
  ) {
    setEditingTicketId(
      ticket.id
    );

    setTitle(
      ticket.title
    );

    setDescription(
      ticket.description
    );

    setStatus(
      ticket.status
    );

    setPriority(
      ticket.priority
    );

    setCategory(
      ticket.category ||
        "Allgemein"
    );

    setCompanyId(
      ticket.companyId ||
        ""
    );

    setDepartmentId(
      ticket.departmentId ||
        ""
    );

    setAssignedTo(
      ticket.assignedTo ||
        ""
    );

    setCreatedBy(
      ticket.createdBy ||
        "System"
    );

    setTags(
      Array.isArray(
        ticket.tags
      )
        ? ticket.tags.join(
            ", "
          )
        : ""
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

    if (!canCreate() && !editingTicketId) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    if (!canEdit() && editingTicketId) {
      alert(
        "Du hast keine Berechtigung, Tickets zu bearbeiten."
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

      if (editingTicketId) {
        const updatedTicket =
          await ticketRepository.update(
            editingTicketId,
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

              createdBy:
                createdBy.trim() ||
                "System",

              tags:
                splitTags(
                  tags
                ),
            }
          );

        if (updatedTicket) {
          saveTicketUpdatedActivity(
            updatedTicket
          );
        }

        resetForm();

        await loadData();

        return;
      }

      const createdTicket =
        await ticketRepository.create({
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

          createdBy:
            createdBy.trim() ||
            "System",

          tags:
            splitTags(
              tags
            ),
        });

      saveTicketCreatedActivity(
        createdTicket
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
          : "Ticket konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeleteTicket(
    ticket: Ticket
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Tickets zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Ticket #${ticket.id} "${ticket.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      saveTicketDeletedActivity(
        ticket
      );

      await ticketRepository.delete(
        ticket.id
      );

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Tickets
          </h1>

          <p className="text-zinc-500 mt-2">
            Supportfälle und Aufgaben aus PostgreSQL verwalten.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/templates"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Vorlagen
          </Link>

          {canCreate() && (
            <button
              type="button"
              onClick={openCreateForm}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Ticket erstellen
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Tickets werden geladen...
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tickets gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tickets.length}
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
            Offen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {openTickets.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "in_progress"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-yellow-50 transition"
        >
          <p className="text-sm text-zinc-500">
            In Bearbeitung
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {inProgressTickets.length}
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
            {highOrUrgentTickets.length}
          </h2>

          <p className="text-sm text-zinc-400 mt-2">
            {closedTickets.length} geschlossen
          </p>
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
              {editingTicketId
                ? "Ticket bearbeiten"
                : "Ticket erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Ticket wird direkt in PostgreSQL gespeichert.
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
                placeholder="Kurzer Titel"
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
                placeholder="Beschreibung des Tickets..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TicketStatus
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
                Priorität
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as TicketPriority
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

            <div>
              <label className="block mb-2 font-medium">
                Erstellt von
              </label>

              <input
                value={createdBy}
                onChange={(event) =>
                  setCreatedBy(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="System"
              />
            </div>

            <div>
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
                : editingTicketId
                  ? "Änderungen speichern"
                  : "Ticket erstellen"}
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
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Organisation, Tags oder Bearbeiter.
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Tickets suchen..."
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

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(
                event.target.value
              );

              setDepartmentFilter(
                ""
              );
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
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

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {filteredDepartments.map(
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

        <p className="text-sm text-zinc-500 mt-5">
          {filteredTickets.length} von {tickets.length} Tickets gefunden.
        </p>
      </div>

      <div className="space-y-4">
        {filteredTickets.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine Tickets gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Erstelle ein neues Ticket oder passe die Filter an.
            </p>
          </div>
        )}

        {filteredTickets.map(
          (ticket) => (
            <div
              key={ticket.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="min-w-0 block flex-1"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                      {getStatusLabel(
                        ticket.status
                      )}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                      {getPriorityLabel(
                        ticket.priority
                      )}
                    </span>

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {getCompanyName(
                        ticket.companyId
                      )}
                    </span>

                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {getDepartmentName(
                        ticket.departmentId
                      )}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    #{ticket.id} · {ticket.title}
                  </h2>

                  <p className="text-zinc-500 mt-2 line-clamp-2">
                    {ticket.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>

                  <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                    <span>
                      Kategorie:{" "}
                      {ticket.category ||
                        "Allgemein"}
                    </span>

                    <span>
                      Zugewiesen:{" "}
                      {ticket.assignedTo ||
                        "Niemand"}
                    </span>

                    <span>
                      Erstellt:{" "}
                      {ticket.createdAt}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                  >
                    Öffnen
                  </Link>

                  {canEdit() && (
                    <button
                      type="button"
                      onClick={() =>
                        startEditTicket(
                          ticket
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
                        void handleDeleteTicket(
                          ticket
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