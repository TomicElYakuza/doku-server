"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplates,
  resetTicketTemplates,
  updateTicketTemplate,
} from "../../../lib/ticketTemplateStorage";

import type {
  TicketTemplate,
} from "../../../lib/ticketTemplateStorage";

import type {
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

export default function TicketTemplatesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [search, setSearch] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [showForm, setShowForm] =
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

    loadTemplates();

    function handleTemplatesUpdated() {
      loadTemplates();
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

    setCategoryFilter(
      params.get("category") || ""
    );
  }

  function updateUrlFilters(
    nextSearch: string,
    nextCompany: string,
    nextCategory: string
  ) {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams();

    if (nextSearch) {
      params.set(
        "q",
        nextSearch
      );
    }

    if (nextCompany) {
      params.set(
        "company",
        nextCompany
      );
    }

    if (nextCategory) {
      params.set(
        "category",
        nextCategory
      );
    }

    const query =
      params.toString();

    const nextUrl =
      query
        ? `/tickets/templates?${query}`
        : "/tickets/templates";

    window.history.replaceState(
      null,
      "",
      nextUrl
    );
  }

  function loadTemplates() {
    setTemplates(
      getTicketTemplates()
    );
  }

  function resetForm() {
    setShowForm(false);

    setEditingId("");

    setTitle("");

    setDescription("");

    setCompany("Intern");

    setCategory("Support");

    setAssignedTo("");

    setStatus("open");

    setPriority("medium");
  }

  function resetFilters() {
    setSearch("");

    setCompanyFilter("");

    setCategoryFilter("");

    updateUrlFilters(
      "",
      "",
      ""
    );
  }

  function openCreateForm() {
    resetForm();

    setShowForm(true);
  }

  function startEdit(
    template: TicketTemplate
  ) {
    setEditingId(template.id);

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
      template.assignedTo ||
        ""
    );

    setStatus(
      template.status ||
        "open"
    );

    setPriority(
      template.priority ||
        "medium"
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSave() {
    if (editingId && !canEdit()) {
      alert(
        "Du hast keine Berechtigung, Templates zu bearbeiten."
      );

      return;
    }

    if (!editingId && !canCreate()) {
      alert(
        "Du hast keine Berechtigung, Templates zu erstellen."
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

    const payload = {
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
    };

    const user =
      getUser();

    if (editingId) {
      const updated =
        updateTicketTemplate(
          editingId,
          payload
        );

      if (updated) {
        saveActivity({
          type:
            "ticketTemplateUpdated",

          title:
            updated.title,

          company:
            updated.company ||
            "Intern",

          user:
            user?.name ||
            "Unbekannt",

          createdAt:
            new Date().toLocaleString(),
        });
      }
    } else {
      const created =
        createTicketTemplate(
          payload
        );

      saveActivity({
        type:
          "ticketTemplateCreated",

        title:
          created.title,

        company:
          created.company ||
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

  function handleDelete(
    template: TicketTemplate
  ) {
    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Templates löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Template wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteTicketTemplate(
      template.id
    );

    saveActivity({
      type:
        "ticketTemplateDeleted",

      title:
        template.title,

      company:
        template.company ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });
  }

  function handleResetDefaults() {
    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Templates zurücksetzen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Alle Ticket-Templates auf Standard zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    resetTicketTemplates();

    saveActivity({
      type:
        "ticketTemplateReset",

      title:
        "Ticket-Templates auf Standard zurückgesetzt",

      company:
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    resetForm();
  }

  function getPriorityLabel(
    value: string
  ) {
    if (value === "urgent") {
      return "Dringend";
    }

    if (value === "high") {
      return "Hoch";
    }

    if (value === "medium") {
      return "Mittel";
    }

    return "Niedrig";
  }

  function getStatusLabel(
    value: string
  ) {
    if (value === "open") {
      return "Offen";
    }

    if (value === "in-progress") {
      return "In Bearbeitung";
    }

    if (value === "done") {
      return "Erledigt";
    }

    return "Geschlossen";
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

  if (!mounted) {
    return null;
  }

  const companies: string[] =
    Array.from(
      new Set(
        templates
          .map(
            (template) =>
              template.company ||
              "Intern"
          )
          .filter(Boolean)
      )
    );

  const categories: string[] =
    Array.from(
      new Set(
        templates
          .map(
            (template) =>
              template.category ||
              "Allgemein"
          )
          .filter(Boolean)
      )
    );

  const filteredTemplates =
    templates.filter(
      (template) => {
        const query =
          search.toLowerCase();

        const templateCompany =
          template.company ||
          "Intern";

        const templateCategory =
          template.category ||
          "Allgemein";

        const statusLabel =
          getStatusLabel(
            template.status
          );

        const priorityLabel =
          getPriorityLabel(
            template.priority
          );

        const matchesSearch =
          template.title
            ?.toLowerCase()
            .includes(query) ||
          template.description
            ?.toLowerCase()
            .includes(query) ||
          templateCompany
            ?.toLowerCase()
            .includes(query) ||
          templateCategory
            ?.toLowerCase()
            .includes(query) ||
          template.assignedTo
            ?.toLowerCase()
            .includes(query) ||
          statusLabel
            .toLowerCase()
            .includes(query) ||
          priorityLabel
            .toLowerCase()
            .includes(query);

        const matchesCompany =
          !companyFilter ||
          templateCompany ===
            companyFilter;

        const matchesCategory =
          !categoryFilter ||
          templateCategory ===
            categoryFilter;

        return (
          matchesSearch &&
          matchesCompany &&
          matchesCategory
        );
      }
    );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/tickets"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          tickets
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          templates
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>
      </div>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Ticket-Templates
          </h1>

          <p className="text-zinc-500 mt-2">
            Vorlagen für häufige Supportfälle verwalten
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          {canCreate() && (
            <button
              onClick={openCreateForm}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Neues Template
            </button>
          )}

          {canDelete() && (
            <button
              onClick={handleResetDefaults}
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-red-50 transition"
            >
              Standards wiederherstellen
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Templates gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {templates.length}
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
                categoryFilter
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
            if (categories.length > 0) {
              const firstCategory =
                categories[0];

              setCategoryFilter(
                firstCategory
              );

              updateUrlFilters(
                search,
                companyFilter,
                firstCategory
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Kategorien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {categories.length}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Gefiltert
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {filteredTemplates.length}
          </h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Suche & Filter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
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
                categoryFilter
              );
            }}
            placeholder="Nach Vorlage, Firma, Kategorie, Status oder Priorität suchen..."
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
                categoryFilter
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
            value={categoryFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              setCategoryFilter(value);

              updateUrlFilters(
                search,
                companyFilter,
                value
              );
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>

            {categories.map(
              (categoryName) => (
                <option
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredTemplates.length} von{" "}
            {templates.length} Templates gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Template bearbeiten"
              : "Neues Template erstellen"}
          </h2>

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
                placeholder="z. B. VPN Verbindung funktioniert nicht"
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
                rows={8}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung / Checkliste / Standardablauf"
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
              onClick={handleSave}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingId
                ? "Änderungen speichern"
                : "Template erstellen"}
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

      {/* LIST */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <p className="text-zinc-500">
              Keine Templates gefunden.
            </p>
          </div>
        )}

        {filteredTemplates.map(
          (template) => (
            <div
              key={template.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const templateCompany =
                          template.company ||
                          "Intern";

                        setCompanyFilter(
                          templateCompany
                        );

                        updateUrlFilters(
                          search,
                          templateCompany,
                          categoryFilter
                        );
                      }}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                    >
                      {template.company ||
                        "Intern"}
                    </button>

                    <button
                      onClick={() => {
                        const templateCategory =
                          template.category ||
                          "Allgemein";

                        setCategoryFilter(
                          templateCategory
                        );

                        updateUrlFilters(
                          search,
                          companyFilter,
                          templateCategory
                        );
                      }}
                      className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      {template.category ||
                        "Allgemein"}
                    </button>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                        template.status
                      )}`}
                    >
                      {getStatusLabel(
                        template.status
                      )}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(
                        template.priority
                      )}`}
                    >
                      {getPriorityLabel(
                        template.priority
                      )}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {template.title}
                  </h2>

                  <p className="text-zinc-600 mt-3 whitespace-pre-wrap">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                    <p>
                      Zugewiesen an:{" "}
                      {template.assignedTo ||
                        "Niemand"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end shrink-0">
                  <Link
                    href={`/tickets?template=${encodeURIComponent(
                      template.id
                    )}`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition"
                  >
                    Ticket daraus erstellen
                  </Link>

                  {canEdit() && (
                    <button
                      onClick={() =>
                        startEdit(
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
                      onClick={() =>
                        handleDelete(
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