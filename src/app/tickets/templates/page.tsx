"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplatePriorityClass,
  getTicketTemplatePriorityLabel,
  getTicketTemplateStatusClass,
  getTicketTemplateStatusLabel,
  getTicketTemplates,
  updateTicketTemplate,
} from "../../../lib/ticketTemplateStorage";

import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../lib/ticketTemplateStorage";

import {
  createTicket,
} from "../../../lib/ticketStorage";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  getActiveCompanies,
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getDepartments,
} from "../../../lib/companyStorage";

import type {
  Company,
  Department,
} from "../../../lib/companyStorage";

import {
  saveTicketCreatedFromTemplateActivity,
  saveTicketTemplateCreatedActivity,
  saveTicketTemplateDeletedActivity,
  saveTicketTemplateUpdatedActivity,
} from "../../../lib/ticketTemplateActivityHelpers";

import {
  areTicketTemplatesEnabled,
} from "../../../lib/featureFlags";

export default function TicketTemplatesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [templatesEnabled, setTemplatesEnabled] =
    useState(true);

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("Allgemein");

  const [priority, setPriority] =
    useState<TicketTemplatePriority>("medium");

  const [status, setStatus] =
    useState<TicketTemplateStatus>("open");

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

  const [tags, setTags] =
    useState("");

  useEffect(() => {
    setMounted(true);

    loadData();

    setTemplatesEnabled(
      areTicketTemplatesEnabled()
    );

    function handleTemplatesUpdated() {
      loadData();
    }

    function handleCompaniesUpdated() {
      loadData();
    }

    function handleDepartmentsUpdated() {
      loadData();
    }

    function handleSettingsUpdated() {
      setTemplatesEnabled(
        areTicketTemplatesEnabled()
      );
    }

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTemplatesUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTemplatesUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

  function loadData() {
    const nextCompanies =
      getCompanies();

    const nextDepartments =
      getDepartments();

    setTemplates(
      getTicketTemplates()
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
      firstDepartment?.id || ""
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

    setCategory("Allgemein");

    setPriority("medium");

    setStatus("open");

    setCompanyId(
      firstCompany?.id || ""
    );

    setDepartmentId(
      firstDepartment?.id || ""
    );

    setCompany(
      firstCompany?.name || "Intern"
    );

    setDepartment(
      firstDepartment?.name || "Allgemein"
    );

    setAssignedTo("");

    setTags("");

    setShowForm(false);
  }

  function openCreateForm() {
    if (!templatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    resetForm();

    setShowForm(true);
  }

  function startEditTemplate(
    template: TicketTemplate
  ) {
    if (!templatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    setEditingId(
      template.id
    );

    setTitle(
      template.title
    );

    setDescription(
      template.description
    );

    setCategory(
      template.category
    );

    setPriority(
      template.priority
    );

    setStatus(
      template.status
    );

    setCompanyId(
      template.companyId || ""
    );

    setDepartmentId(
      template.departmentId || ""
    );

    setCompany(
      template.company || "Intern"
    );

    setDepartment(
      template.department || "Allgemein"
    );

    setAssignedTo(
      template.assignedTo || ""
    );

    setTags(
      template.tags?.join(", ") || ""
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSaveTemplate() {
    if (!templatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canCreate() && !editingId) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu erstellen."
      );

      return;
    }

    if (!canEdit() && editingId) {
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

    const templateData = {
      title:
        title.trim(),

      description:
        description.trim(),

      category:
        category.trim() ||
        "Allgemein",

      priority,

      status,

      companyId,

      departmentId,

      company:
        selectedCompanyName,

      department:
        selectedDepartmentName,

      assignedTo:
        assignedTo.trim(),

      tags:
        tagList,
    };

    if (editingId) {
      const updatedTemplate =
        updateTicketTemplate(
          editingId,
          templateData
        );

      if (updatedTemplate) {
        saveTicketTemplateUpdatedActivity(
          updatedTemplate
        );
      }

      resetForm();

      return;
    }

    const newTemplate =
      createTicketTemplate(
        templateData
      );

    saveTicketTemplateCreatedActivity(
      newTemplate
    );

    resetForm();
  }

  function handleDeleteTemplate(
    template: TicketTemplate
  ) {
    if (!templatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

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

    saveTicketTemplateDeletedActivity(
      template
    );

    deleteTicketTemplate(
      template.id
    );
  }

  function createTicketFromTemplate(
    template: TicketTemplate
  ) {
    if (!templatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canCreate()) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    const newTicket =
      createTicket({
        title:
          template.title,

        description:
          template.description,

        status:
          template.status,

        priority:
          template.priority,

        category:
          template.category,

        companyId:
          template.companyId || "",

        departmentId:
          template.departmentId || "",

        company:
          template.company || "Intern",

        department:
          template.department || "Allgemein",

        assignedTo:
          template.assignedTo || "",

        createdBy:
          "",

        tags:
          template.tags || [],
      });

    saveTicketCreatedFromTemplateActivity(
      template,
      newTicket
    );

    alert(
      "Ticket wurde aus Vorlage erstellt."
    );
  }

  function resetFilters() {
    setSearch("");

    setPriorityFilter("");

    setStatusFilter("");

    setCompanyFilter("");

    setDepartmentFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (!templatesEnabled) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            dashboard
          </Link>

          <span className="text-zinc-400">
            /
          </span>

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
            vorlagen
          </span>
        </div>

        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zu Tickets
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <h1 className="text-4xl font-bold">
            Ticket-Vorlagen deaktiviert
          </h1>

          <p className="text-zinc-500 mt-3">
            Ticket-Vorlagen sind aktuell in den Einstellungen deaktiviert.
          </p>

          <Link
            href="/settings"
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zu den Einstellungen
          </Link>
        </div>
      </div>
    );
  }

  const filteredTemplates =
    templates.filter(
      (template) => {
        const query =
          search.toLowerCase();

        const templateCompany =
          template.company ||
          getCompanyName(
            template.companyId
          ) ||
          "";

        const templateDepartment =
          template.department ||
          getDepartmentName(
            template.departmentId
          ) ||
          "";

        const matchesSearch =
          template.title
            .toLowerCase()
            .includes(query) ||
          template.description
            .toLowerCase()
            .includes(query) ||
          template.category
            .toLowerCase()
            .includes(query) ||
          templateCompany
            .toLowerCase()
            .includes(query) ||
          templateDepartment
            .toLowerCase()
            .includes(query) ||
          template.assignedTo
            ?.toLowerCase()
            .includes(query) ||
          template.tags
            ?.join(" ")
            .toLowerCase()
            .includes(query);

        const matchesPriority =
          !priorityFilter ||
          template.priority ===
            priorityFilter;

        const matchesStatus =
          !statusFilter ||
          template.status ===
            statusFilter;

        const matchesCompany =
          !companyFilter ||
          template.companyId ===
            companyFilter ||
          template.company ===
            getCompanyName(
              companyFilter
            );

        const matchesDepartment =
          !departmentFilter ||
          template.departmentId ===
            departmentFilter ||
          template.department ===
            getDepartmentName(
              departmentFilter
            );

        return (
          matchesSearch &&
          matchesPriority &&
          matchesStatus &&
          matchesCompany &&
          matchesDepartment
        );
      }
    );

  const highPriorityCount =
    templates.filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent"
    ).length;

  const openCount =
    templates.filter(
      (template) =>
        template.status === "open"
    ).length;

  return (
    <div className="space-y-8">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

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
          vorlagen
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
            Ticket-Vorlagen
          </h1>

          <p className="text-zinc-500 mt-2">
            Wiederkehrende Ticket-Typen als Vorlage speichern und daraus Tickets erstellen
          </p>
        </div>

        {canCreate() && (
          <button
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Vorlage erstellen
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() =>
            setStatusFilter("")
          }
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
          onClick={() =>
            setPriorityFilter(
              "high"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-orange-100 transition"
        >
          <p className="text-sm text-zinc-500">
            Hoch/Dringend
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {highPriorityCount}
          </h2>
        </button>

        <Link
          href="/tickets"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tickets
          </p>

          <h2 className="text-2xl font-bold mt-3">
            Öffnen
          </h2>
        </Link>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Vorlage bearbeiten"
              : "Vorlage erstellen"}
          </h2>

          <p className="text-zinc-500 mt-2">
            Vorlagen sind bereits für echte Firmen- und Abteilungs-IDs vorbereitet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
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
                placeholder="Kurzer Titel"
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
                Priorität
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
                type="text"
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
                placeholder="kommagetrennt"
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
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleSaveTemplate}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingId
                ? "Änderungen speichern"
                : "Vorlage erstellen"}
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
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Titel, Beschreibung, Kategorie, Firma, Abteilung oder Tag suchen..."
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white md:col-span-2"
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

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredTemplates.length} von{" "}
            {templates.length} Vorlagen gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* TEMPLATES */}
      <div className="grid gap-4">
        {filteredTemplates.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <p className="text-zinc-500">
              Keine Vorlagen gefunden.
            </p>
          </div>
        )}

        {filteredTemplates.map(
          (template) => {
            const templateCompany =
              template.company ||
              getCompanyName(
                template.companyId
              ) ||
              "Intern";

            const templateDepartment =
              template.department ||
              getDepartmentName(
                template.departmentId
              ) ||
              "Allgemein";

            return (
              <div
                key={template.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getTicketTemplateStatusClass(
                          template.status
                        )}`}
                      >
                        {getTicketTemplateStatusLabel(
                          template.status
                        )}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getTicketTemplatePriorityClass(
                          template.priority
                        )}`}
                      >
                        {getTicketTemplatePriorityLabel(
                          template.priority
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {template.category}
                      </span>

                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                        {templateCompany}
                      </span>

                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {templateDepartment}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {template.title}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {template.description ||
                        "Keine Beschreibung"}
                    </p>

                    {template.tags &&
                      template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {template.tags.map(
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
                        {template.createdAt}
                      </p>

                      <p>
                        Aktualisiert:{" "}
                        {template.updatedAt}
                      </p>

                      {template.assignedTo && (
                        <p>
                          Zuständig:{" "}
                          {template.assignedTo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end shrink-0">
                    {canCreate() && (
                      <button
                        onClick={() =>
                          createTicketFromTemplate(
                            template
                          )
                        }
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Ticket erstellen
                      </button>
                    )}

                    {canEdit() && (
                      <button
                        onClick={() =>
                          startEditTemplate(
                            template
                          )
                        }
                        className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                      >
                        Bearbeiten
                      </button>
                    )}

                    {canDelete() && (
                      <button
                        onClick={() =>
                          handleDeleteTemplate(
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