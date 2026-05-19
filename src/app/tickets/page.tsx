"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  createTicket,
  deleteTicket,
  getPriorityClass,
  getPriorityLabel,
  getStatusClass,
  getStatusLabel,
  getTickets,
  updateTicket,
} from "../../lib/ticketStorage";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../lib/ticketStorage";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../lib/permissions";

import {
  getActiveCompanies,
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getDepartments,
} from "../../lib/companyStorage";

import type {
  Company,
  Department,
} from "../../lib/companyStorage";

import {
  saveTicketCreatedActivity,
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../lib/ticketActivityHelpers";

import {
  readTicketFiles,
  saveTicketFiles,
} from "../../lib/ticketFileHelpers";

import type {
  PendingTicketFile,
} from "../../lib/ticketFileHelpers";

type ViewMode =
  | "cards"
  | "table";

type PriorityFilter =
  | ""
  | TicketPriority
  | "high_or_urgent";

export default function TicketsPage() {
  const searchParams =
    useSearchParams();

  const [mounted, setMounted] =
    useState(false);

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
    useState<PriorityFilter>("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [showClosedTickets, setShowClosedTickets] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
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

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("Allgemein");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [createdBy, setCreatedBy] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [pendingFiles, setPendingFiles] =
    useState<PendingTicketFile[]>([]);

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleTicketsUpdated() {
      loadData();
    }

    function handleCompaniesUpdated() {
      loadData();
    }

    function handleDepartmentsUpdated() {
      loadData();
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

  useEffect(() => {
    setStatusFilter(
      searchParams.get("status") ||
        ""
    );

    setPriorityFilter(
      (
        searchParams.get("priority") ||
        ""
      ) as PriorityFilter
    );

    setCompanyFilter(
      searchParams.get("company") ||
        ""
    );

    setDepartmentFilter(
      searchParams.get("department") ||
        ""
    );
  }, [
    searchParams,
  ]);

  function loadData() {
    const nextCompanies =
      getCompanies();

    const nextDepartments =
      getDepartments();

    setTickets(
      getTickets()
    );

    setCompanies(
      nextCompanies
    );

    setDepartments(
      nextDepartments
    );

    if (
      !companyId &&
      nextCompanies.length > 0
    ) {
      setCompanyId(
        nextCompanies[0].id
      );

      setCompany(
        nextCompanies[0].name
      );
    }

    if (
      !departmentId &&
      nextDepartments.length > 0
    ) {
      setDepartmentId(
        nextDepartments[0].id
      );

      setDepartment(
        nextDepartments[0].name
      );
    }
  }

  function getCompanyName(
    nextCompanyId?: string
  ) {
    if (!nextCompanyId) {
      return "";
    }

    return (
      companies.find(
        (item) =>
          item.id === nextCompanyId
      )?.name || ""
    );
  }

  function getDepartmentName(
    nextDepartmentId?: string
  ) {
    if (!nextDepartmentId) {
      return "";
    }

    return (
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      )?.name || ""
    );
  }

  function getSelectableDepartments() {
    if (!companyId) {
      return getActiveDepartments();
    }

    return getActiveDepartmentsByCompanyId(
      companyId
    );
  }

  function handleCompanyChange(
    nextCompanyId: string
  ) {
    setCompanyId(
      nextCompanyId
    );

    const selectedCompany =
      companies.find(
        (item) =>
          item.id === nextCompanyId
      );

    setCompany(
      selectedCompany?.name ||
        "Intern"
    );

    const nextDepartments =
      getActiveDepartmentsByCompanyId(
        nextCompanyId
      );

    const firstDepartment =
      nextDepartments[0];

    setDepartmentId(
      firstDepartment?.id ||
        ""
    );

    setDepartment(
      firstDepartment?.name ||
        "Allgemein"
    );
  }

  function handleDepartmentChange(
    nextDepartmentId: string
  ) {
    setDepartmentId(
      nextDepartmentId
    );

    const selectedDepartment =
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      );

    setDepartment(
      selectedDepartment?.name ||
        "Allgemein"
    );
  }

  function resetForm() {
    const activeCompanies =
      getActiveCompanies();

    const firstCompany =
      activeCompanies[0];

    const activeDepartments =
      firstCompany
        ? getActiveDepartmentsByCompanyId(
            firstCompany.id
          )
        : getActiveDepartments();

    const firstDepartment =
      activeDepartments[0];

    setEditingId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory("Allgemein");
    setCompanyId(
      firstCompany?.id ||
        ""
    );
    setDepartmentId(
      firstDepartment?.id ||
        ""
    );
    setCompany(
      firstCompany?.name ||
        "Intern"
    );
    setDepartment(
      firstDepartment?.name ||
        "Allgemein"
    );
    setAssignedTo("");
    setCreatedBy("");
    setTags("");
    setPendingFiles([]);
    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();

    setShowForm(true);
  }

  function startEditTicket(
    ticket: Ticket
  ) {
    setEditingId(
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
      ticket.category
    );

    setCompanyId(
      ticket.companyId ||
        ""
    );

    setDepartmentId(
      ticket.departmentId ||
        ""
    );

    setCompany(
      ticket.company ||
        "Intern"
    );

    setDepartment(
      ticket.department ||
        "Allgemein"
    );

    setAssignedTo(
      ticket.assignedTo ||
        ""
    );

    setCreatedBy(
      ticket.createdBy ||
        ""
    );

    setTags(
      ticket.tags?.join(", ") ||
        ""
    );

    setPendingFiles([]);

    setShowForm(true);
  }

  async function handleTicketFilesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      await readTicketFiles(
        event.target.files
      );

    setPendingFiles(
      (currentFiles) => [
        ...currentFiles,
        ...files,
      ]
    );

    event.target.value =
      "";
  }

  function removePendingFile(
    index: number
  ) {
    setPendingFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_file, fileIndex) =>
            fileIndex !== index
        )
    );
  }

  function handleSaveTicket() {
    if (
      !canCreate() &&
      !editingId
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    if (
      !canEdit() &&
      editingId
    ) {
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

    const selectedCompanyName =
      getCompanyName(
        companyId
      ) ||
      company.trim() ||
      "Intern";

    const selectedDepartmentName =
      getDepartmentName(
        departmentId
      ) ||
      department.trim() ||
      "Allgemein";

    const tagList =
      tags
        .split(",")
        .map(
          (tag) =>
            tag.trim()
        )
        .filter(Boolean);

    const ticketData = {
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
        selectedCompanyName,

      department:
        selectedDepartmentName,

      assignedTo:
        assignedTo.trim(),

      createdBy:
        createdBy.trim(),

      tags:
        tagList,
    };

    if (editingId) {
      const updatedTicket =
        updateTicket(
          editingId,
          ticketData
        );

      if (updatedTicket) {
        if (pendingFiles.length > 0) {
          saveTicketFiles(
            updatedTicket.id,
            pendingFiles
          );
        }

        saveTicketUpdatedActivity(
          updatedTicket
        );
      }

      resetForm();

      return;
    }

    const newTicket =
      createTicket(
        ticketData
      );

    if (pendingFiles.length > 0) {
      saveTicketFiles(
        newTicket.id,
        pendingFiles
      );
    }

    saveTicketCreatedActivity(
      newTicket
    );

    resetForm();
  }

  function handleDeleteTicket(
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
        `Ticket "${ticket.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    saveTicketDeletedActivity(
      ticket
    );

    deleteTicket(
      ticket.id
    );
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function applyHighOrUrgentFilter() {
    setPriorityFilter(
      "high_or_urgent"
    );
  }

  function getTicketCompany(
    ticket: Ticket
  ) {
    return (
      ticket.company ||
      getCompanyName(
        ticket.companyId
      ) ||
      "Intern"
    );
  }

  function getTicketDepartment(
    ticket: Ticket
  ) {
    return (
      ticket.department ||
      getDepartmentName(
        ticket.departmentId
      ) ||
      "Allgemein"
    );
  }

  if (!mounted) {
    return null;
  }

  const filteredTickets =
    tickets.filter(
      (ticket) => {
        const query =
          search.toLowerCase();

        const ticketCompany =
          getTicketCompany(
            ticket
          );

        const ticketDepartment =
          getTicketDepartment(
            ticket
          );

        const ticketId =
          String(
            ticket.id || ""
          );

        const matchesSearch =
          ticketId
            .toLowerCase()
            .includes(query) ||
          ticket.title
            .toLowerCase()
            .includes(query) ||
          ticket.description
            .toLowerCase()
            .includes(query) ||
          ticket.category
            .toLowerCase()
            .includes(query) ||
          ticketCompany
            .toLowerCase()
            .includes(query) ||
          ticketDepartment
            .toLowerCase()
            .includes(query) ||
          ticket.assignedTo
            ?.toLowerCase()
            .includes(query) ||
          ticket.createdBy
            ?.toLowerCase()
            .includes(query) ||
          ticket.tags
            ?.join(" ")
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          !statusFilter ||
          ticket.status === statusFilter;

        const matchesPriority =
          !priorityFilter ||
          (
            priorityFilter === "high_or_urgent" &&
            (
              ticket.priority === "high" ||
              ticket.priority === "urgent"
            )
          ) ||
          ticket.priority === priorityFilter;

        const matchesCompany =
          !companyFilter ||
          ticket.companyId === companyFilter ||
          ticket.company === companyFilter ||
          ticket.company === getCompanyName(
            companyFilter
          );

        const matchesDepartment =
          !departmentFilter ||
          ticket.departmentId === departmentFilter ||
          ticket.department === departmentFilter ||
          ticket.department === getDepartmentName(
            departmentFilter
          );

        const matchesClosedVisibility =
          showClosedTickets ||
          statusFilter === "closed" ||
          ticket.status !== "closed";

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesCompany &&
          matchesDepartment &&
          matchesClosedVisibility
        );
      }
    );

  const visibleTicketCount =
    showClosedTickets
      ? tickets.length
      : tickets.filter(
          (ticket) =>
            ticket.status !== "closed"
        ).length;

  const openCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "open"
    ).length;

  const progressCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "in_progress"
    ).length;

  const waitingCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "waiting"
    ).length;

  const urgentCount =
    tickets.filter(
      (ticket) =>
        ticket.priority === "urgent" ||
        ticket.priority === "high"
    ).length;

  const closedCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "closed"
    ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Tickets
          </h1>

          <p className="text-zinc-500 mt-2">
            Supportfälle, Aufgaben und interne Anfragen verwalten
          </p>
        </div>

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <button
          type="button"
          onClick={() =>
            setStatusFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Gesamt
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
            {openCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "in_progress"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            In Bearbeitung
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {progressCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setStatusFilter(
              "waiting"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-yellow-100 transition"
        >
          <p className="text-sm text-zinc-500">
            Wartend
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {waitingCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={applyHighOrUrgentFilter}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Hoch/Dringend
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {urgentCount}
          </h2>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  {editingId
                    ? `Ticket #${editingId} bearbeiten`
                    : "Ticket erstellen"}
                </h2>

                <p className="text-zinc-500 mt-2">
                  Tickets sind bereits für echte Firmen- und Abteilungs-IDs vorbereitet.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="h-11 w-11 rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
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
                  placeholder="Kurzer Titel"
                />
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
                  placeholder="IT, Benutzer, Dokumentation..."
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
                  Firma
                </label>

                <select
                  value={companyId}
                  onChange={(event) =>
                    handleCompanyChange(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Firma auswählen
                  </option>

                  {getActiveCompanies().map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
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
                    handleDepartmentChange(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                >
                  <option value="">
                    Abteilung auswählen
                  </option>

                  {getSelectableDepartments().map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
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
                  placeholder="Name"
                />
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
                  placeholder="Name"
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

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">
                  Tags
                </label>

                <input
                  type="text"
                  value={tags}
                  onChange={(event) =>
                    setTags(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="kommagetrennt, z. B. drucker, netzwerk"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">
                  Dateien & Anhänge
                </label>

                <input
                  type="file"
                  multiple
                  onChange={handleTicketFilesChange}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                />

                <p className="text-sm text-zinc-500 mt-2">
                  Dateien und Anhänge werden beim Speichern dem Ticket zugeordnet.
                </p>

                {pendingFiles.length > 0 && (
                  <div className="grid gap-2 mt-4">
                    {pendingFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {file.name}
                            </p>

                            <p className="text-xs text-zinc-500">
                              {Math.round(
                                file.size / 1024
                              )} KB
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removePendingFile(
                                index
                              )
                            }
                            className="text-sm bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
                          >
                            Entfernen
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-zinc-200">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleSaveTicket}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                {editingId
                  ? "Änderungen speichern"
                  : "Ticket erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere Tickets nach ID, Text, Status, Priorität, Firma und Abteilung.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "cards"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "table"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Suche nach ID, Titel, Beschreibung, Kategorie, Firma, Abteilung oder Tag..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                event.target.value as PriorityFilter
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Prioritäten
            </option>

            <option value="high_or_urgent">
              Hoch/Dringend
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
            onChange={(event) =>
              setCompanyFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
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

            {departments.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredTickets.length} von{" "}
            {visibleTicketCount} sichtbaren Tickets gefunden
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowClosedTickets(
                  !showClosedTickets
                )
              }
              className={`text-sm px-4 py-2 rounded-xl transition ${
                showClosedTickets
                  ? "bg-zinc-900 text-white hover:bg-zinc-700"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              {showClosedTickets
                ? "Geschlossene ausblenden"
                : `Geschlossene einblenden (${closedCount})`}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {viewMode === "cards" && (
        <div className="grid gap-4">
          {filteredTickets.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Tickets gefunden.
              </p>
            </div>
          )}

          {filteredTickets.map(
            (ticket) => {
              const ticketCompany =
                getTicketCompany(
                  ticket
                );

              const ticketDepartment =
                getTicketDepartment(
                  ticket
                );

              return (
                <div
                  key={ticket.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
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
                          {ticket.category}
                        </span>

                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                          {ticketCompany}
                        </span>

                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {ticketDepartment}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-mono text-zinc-400">
                          ID: {ticket.id}
                        </p>

                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="inline-block text-2xl font-bold mt-1 hover:text-zinc-600 transition"
                        >
                          {ticket.title}
                        </Link>
                      </div>

                      <p className="text-zinc-500 mt-2">
                        {ticket.description ||
                          "Keine Beschreibung"}
                      </p>

                      {ticket.tags &&
                        ticket.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {ticket.tags.map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full"
                                >
                                  #{tag}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                        <p>
                          Erstellt:{" "}
                          {ticket.createdAt}
                        </p>

                        <p>
                          Aktualisiert:{" "}
                          {ticket.updatedAt}
                        </p>

                        {ticket.assignedTo && (
                          <p>
                            Zuständig:{" "}
                            {ticket.assignedTo}
                          </p>
                        )}

                        {ticket.createdBy && (
                          <p>
                            Von:{" "}
                            {ticket.createdBy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end shrink-0">
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
                            handleDeleteTicket(
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
              );
            }
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    ID
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Ticket
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Priorität
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Kategorie
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Firma
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Abteilung
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Zuständig
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Aktualisiert
                  </th>

                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-8 text-zinc-500"
                    >
                      Keine Tickets gefunden.
                    </td>
                  </tr>
                )}

                {filteredTickets.map(
                  (ticket) => {
                    const ticketCompany =
                      getTicketCompany(
                        ticket
                      );

                    const ticketDepartment =
                      getTicketDepartment(
                        ticket
                      );

                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                          {ticket.id}
                        </td>

                        <td className="px-5 py-4 min-w-[260px]">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-semibold hover:text-zinc-600 transition"
                          >
                            {ticket.title}
                          </Link>

                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                            {ticket.description ||
                              "Keine Beschreibung"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                            {getStatusLabel(
                              ticket.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                            {getPriorityLabel(
                              ticket.priority
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {ticket.category}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {ticketCompany}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {ticketDepartment}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {ticket.assignedTo ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          {ticket.updatedAt}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
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
                                className="bg-zinc-900 text-white px-3 py-2 rounded-xl hover:bg-zinc-700 transition"
                              >
                                Bearbeiten
                              </button>
                            )}

                            {canDelete() && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteTicket(
                                    ticket
                                  )
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                              >
                                Löschen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}