"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  createTicket,
  deleteTicket,
  getPriorityLabel,
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
  getTicketTemplates,
} from "../../lib/ticketTemplateStorage";

import type {
  TicketTemplate,
} from "../../lib/ticketTemplateStorage";

import {
  getUser,
} from "../../lib/userStorage";

import {
  canCreate,
  canEdit,
  canDelete,
} from "../../lib/permissions";

import {
  saveActivity,
} from "../../lib/activityStorage";

export default function TicketsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [category, setCategory] =
    useState("Support");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [status, setStatus] =
    useState<TicketStatus>("open");

  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  useEffect(() => {
    setMounted(true);

    applyUrlFilters();

    loadTickets();

    loadTemplates();

    function handleTicketsUpdated() {
      loadTickets();
    }

    function handleTicketTemplatesUpdated() {
      loadTemplates();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTicketTemplatesUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );

      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTicketTemplatesUpdated
      );
    };
  }, []);

  function applyUrlFilters() {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    setSearch(
      params.get("q") || ""
    );

    setCompanyFilter(
      params.get("company") || ""
    );

    setStatusFilter(
      params.get("status") || ""
    );

    setPriorityFilter(
      params.get("priority") || ""
    );
  }

  function updateUrlFilters(
    nextSearch: string,
    nextCompany: string,
    nextStatus: string,
    nextPriority: string
  ) {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams();

    if (nextSearch) {
      params.set("q", nextSearch);
    }

    if (nextCompany) {
      params.set(
        "company",
        nextCompany
      );
    }

    if (nextStatus) {
      params.set(
        "status",
        nextStatus
      );
    }

    if (nextPriority) {
      params.set(
        "priority",
        nextPriority
      );
    }

    const query =
      params.toString();

    const nextUrl =
      query
        ? `/tickets?${query}`
        : "/tickets";

    window.history.replaceState(
      null,
      "",
      nextUrl
    );
  }

  function loadTickets() {
    setTickets(
      getTickets()
    );
  }

  function loadTemplates() {
    setTemplates(
      getTicketTemplates()
    );
  }

  function resetForm() {
    setEditingId("");

    setSelectedTemplateId("");

    setTitle("");

    setDescription("");

    setCompany("Intern");

    setCategory("Support");

    setAssignedTo("");

    setStatus("open");

    setPriority("medium");

    setShowCreateForm(false);
  }

  function resetFilters() {
    setSearch("");

    setCompanyFilter("");

    setStatusFilter("");

    setPriorityFilter("");

    updateUrlFilters(
      "",
      "",
      "",
      ""
    );
  }

  function applyTemplate(
    templateId: string
  ) {
    setSelectedTemplateId(
      templateId
    );

    const template =
      templates.find(
        (item) =>
          item.id === templateId
      );

    if (!template) {
      return;
    }

    setTitle(template.title);

    setDescription(
      template.description
    );

    setCompany(
      template.company ||
      "Intern"
    );

    setCategory(
      template.category ||
      "Support"
    );

    setAssignedTo(
      template.assignedTo || ""
    );

    setStatus(
      template.status || "open"
    );

    setPriority(
      template.priority ||
      "medium"
    );
  }

  function openCreateForm() {
    resetForm();

    setShowCreateForm(true);
  }

  function handleCreateTicket() {
    if (!canCreate()) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    if (!company.trim()) {
      alert(
        "Bitte eine Firma eingeben."
      );

      return;
    }

    const user =
      getUser();

    const ticket =
      createTicket({
        title:
          title.trim(),

        description:
          description.trim(),

        company:
          company.trim() ||
          "Intern",

        category:
          category.trim() ||
          "Allgemein",

        assignedTo:
          assignedTo.trim(),

        status,

        priority,

        createdBy:
          user?.name ||
          "Unbekannt",
      });

    if (ticket) {
      saveActivity({
        type: "ticketCreated",

        title:
          ticket.title,

        company:
          ticket.company ||
          "Intern",

        user:
          user?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });
    }

    resetForm();
  }

  function startEdit(ticket: Ticket) {
    setEditingId(ticket.id);

    setSelectedTemplateId("");

    setTitle(ticket.title);

    setDescription(
      ticket.description
    );

    setCompany(
      ticket.company || "Intern"
    );

    setCategory(ticket.category);

    setAssignedTo(ticket.assignedTo);

    setStatus(ticket.status);

    setPriority(ticket.priority);

    setShowCreateForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleUpdateTicket() {
    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, Tickets zu bearbeiten."
      );

      return;
    }

    if (!editingId) {
      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    if (!company.trim()) {
      alert(
        "Bitte eine Firma eingeben."
      );

      return;
    }

    const updated =
      updateTicket(editingId, {
        title:
          title.trim(),

        description:
          description.trim(),

        company:
          company.trim() ||
          "Intern",

        category:
          category.trim() ||
          "Allgemein",

        assignedTo:
          assignedTo.trim(),

        status,

        priority,
      });

    if (updated) {
      saveActivity({
        type: "ticketUpdated",

        title:
          updated.title,

        company:
          updated.company ||
          "Intern",

        user:
          getUser()?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });
    }

    resetForm();
  }

  function handleDeleteTicket(
    ticket: Ticket
  ) {
    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Tickets löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Ticket wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteTicket(ticket.id);

    saveActivity({
      type: "ticketDeleted",

      title:
        ticket.title,

      company:
        ticket.company ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });
  }

  function getPriorityClass(
    value: string
  ) {
    if (value === "urgent") {
      return "bg-red-100 text-red-700";
    }

    if (value === "high") {
      return "bg-orange-100 text-orange-700";
    }

    if (value === "medium") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  }

  function getStatusClass(
    value: string
  ) {
    if (value === "open") {
      return "bg-blue-100 text-blue-700";
    }

    if (value === "in-progress") {
      return "bg-purple-100 text-purple-700";
    }

    if (value === "done") {
      return "bg-green-100 text-green-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  const companies: string[] =
    Array.from(
      new Set(
        tickets
          .map(
            (ticket) =>
              ticket.company || "Intern"
          )
          .filter(Boolean)
      )
    );

  const filteredTickets =
    tickets.filter((ticket) => {
      const query =
        search.toLowerCase();

      const ticketCompany =
        ticket.company || "Intern";

      const matchesSearch =
        ticket.title
          ?.toLowerCase()
          .includes(query) ||
        ticket.description
          ?.toLowerCase()
          .includes(query) ||
        ticketCompany
          ?.toLowerCase()
          .includes(query) ||
        ticket.category
          ?.toLowerCase()
          .includes(query) ||
        ticket.createdBy
          ?.toLowerCase()
          .includes(query) ||
        ticket.assignedTo
          ?.toLowerCase()
          .includes(query);

      const matchesCompany =
        !companyFilter ||
        ticketCompany ===
          companyFilter;

      const matchesStatus =
        !statusFilter ||
        ticket.status ===
          statusFilter;

      const matchesPriority =
        !priorityFilter ||
        ticket.priority ===
          priorityFilter;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesStatus &&
        matchesPriority
      );
    });

  const openCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "open"
    ).length;

  const inProgressCount =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        "in-progress"
    ).length;

  const doneCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "done"
    ).length;

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
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
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Neues Ticket
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Tickets gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tickets.length}
          </h2>
        </div>

        <button
          onClick={() => {
            if (companies.length > 0) {
              const firstCompany =
                companies[0];

              setCompanyFilter(
                firstCompany
              );

              updateUrlFilters(
                search,
                firstCompany,
                statusFilter,
                priorityFilter
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>
        </button>

        <button
          onClick={() => {
            setStatusFilter("open");

            updateUrlFilters(
              search,
              companyFilter,
              "open",
              priorityFilter
            );
          }}
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
          onClick={() => {
            setStatusFilter(
              "in-progress"
            );

            updateUrlFilters(
              search,
              companyFilter,
              "in-progress",
              priorityFilter
            );
          }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-purple-50 transition"
        >
          <p className="text-sm text-zinc-500">
            In Bearbeitung
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {inProgressCount}
          </h2>
        </button>

        <button
          onClick={() => {
            setStatusFilter("done");

            updateUrlFilters(
              search,
              companyFilter,
              "done",
              priorityFilter
            );
          }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Erledigt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {doneCount}
          </h2>
        </button>
      </div>

      {/* FORM */}
      {showCreateForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Ticket bearbeiten"
              : "Neues Ticket erstellen"}
          </h2>

          <p className="text-zinc-500 mt-2">
            Du kannst ein Template auswählen oder das Ticket manuell ausfüllen.
          </p>

          {!editingId && (
            <div className="mt-6">
              <label className="block mb-2 font-medium">
                Ticket-Template
              </label>

              <select
                value={selectedTemplateId}
                onChange={(event) =>
                  applyTemplate(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Kein Template verwenden
                </option>

                {templates.map(
                  (template) => (
                    <option
                      key={template.id}
                      value={template.id}
                    >
                      {template.title}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Kurzer Titel des Tickets"
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
                rows={6}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Was ist passiert oder was soll erledigt werden?"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <input
                type="text"
                value={company}
                onChange={(event) =>
                  setCompany(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z. B. Intern, Muster GmbH, Kunde A"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>

              <input
                type="text"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Support, IT, HR..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>

              <input
                type="text"
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name oder leer lassen"
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
                    event.target
                      .value as TicketStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="open">
                  Offen
                </option>

                <option value="in-progress">
                  In Bearbeitung
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
                    event.target
                      .value as TicketPriority
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
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={
                editingId
                  ? handleUpdateTicket
                  : handleCreateTicket
              }
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingId
                ? "Änderungen speichern"
                : "Ticket erstellen"}
            </button>

            <button
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Suche & Filter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              const value =
                event.target.value;

              setSearch(value);

              updateUrlFilters(
                value,
                companyFilter,
                statusFilter,
                priorityFilter
              );
            }}
            placeholder="Tickets, Firmen, Kategorien oder Personen suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={companyFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              setCompanyFilter(value);

              updateUrlFilters(
                search,
                value,
                statusFilter,
                priorityFilter
              );
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map(
              (companyName) => (
                <option
                  key={companyName}
                  value={companyName}
                >
                  {companyName}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              setStatusFilter(value);

              updateUrlFilters(
                search,
                companyFilter,
                value,
                priorityFilter
              );
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Status
            </option>

            <option value="open">
              Offen
            </option>

            <option value="in-progress">
              In Bearbeitung
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
            onChange={(event) => {
              const value =
                event.target.value;

              setPriorityFilter(value);

              updateUrlFilters(
                search,
                companyFilter,
                statusFilter,
                value
              );
            }}
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

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredTickets.length} von{" "}
            {tickets.length} Tickets gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* TICKETS */}
      <div className="grid gap-4">
        {filteredTickets.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <p className="text-zinc-500">
              Keine Tickets gefunden.
            </p>
          </div>
        )}

        {filteredTickets.map((ticket) => {
          const ticketCompany =
            ticket.company || "Intern";

          return (
            <div
              key={ticket.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setCompanyFilter(
                          ticketCompany
                        );

                        updateUrlFilters(
                          search,
                          ticketCompany,
                          statusFilter,
                          priorityFilter
                        );
                      }}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                    >
                      {ticketCompany}
                    </button>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {getStatusLabel(
                        ticket.status
                      )}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(
                        ticket.priority
                      )}`}
                    >
                      {getPriorityLabel(
                        ticket.priority
                      )}
                    </span>

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {ticket.category}
                    </span>
                  </div>

                  <Link
                    href={`/tickets/${encodeURIComponent(
                      ticket.id
                    )}`}
                    className="block mt-4"
                  >
                    <h2 className="text-2xl font-bold hover:underline">
                      {ticket.title}
                    </h2>
                  </Link>

                  <p className="text-zinc-600 mt-2 whitespace-pre-wrap">
                    {ticket.description ||
                      "Keine Beschreibung"}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                    <p>
                      Firma:{" "}
                      <span className="text-indigo-700">
                        {ticketCompany}
                      </span>
                    </p>

                    <p>
                      Erstellt von:{" "}
                      {ticket.createdBy}
                    </p>

                    {ticket.assignedTo && (
                      <p>
                        Zugewiesen an:{" "}
                        {ticket.assignedTo}
                      </p>
                    )}

                    <p>
                      Erstellt:{" "}
                      {ticket.createdAt}
                    </p>

                    <p>
                      Aktualisiert:{" "}
                      {ticket.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end shrink-0">
                  <Link
                    href={`/tickets/${encodeURIComponent(
                      ticket.id
                    )}`}
                    className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                  >
                    Öffnen
                  </Link>

                  {canEdit() && (
                    <button
                      onClick={() =>
                        startEdit(ticket)
                      }
                      className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                    >
                      Bearbeiten
                    </button>
                  )}

                  {canDelete() && (
                    <button
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
        })}
      </div>
    </div>
  );
}