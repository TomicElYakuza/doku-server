"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ticketTemplateRepository,
} from "../../../lib/ticketTemplateRepository";

import {
  ticketRepository,
} from "../../../lib/ticketRepository";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import {
  saveTicketCreatedFromTemplateActivity,
  saveTicketTemplateCreatedActivity,
  saveTicketTemplateDeletedActivity,
  saveTicketTemplateUpdatedActivity,
} from "../../../lib/ticketTemplateActivityHelpers";

import {
  useFeatureFlags,
} from "../../../hooks/useFeatureFlags";

import {
  usePermissions,
} from "../../../hooks/usePermissions";

import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../types/ticketTemplate";

import type {
  Company,
  Department,
} from "../../../types/company";

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

export default function TicketTemplatesPage() {
  const {
    ticketTemplatesEnabled,
  } =
    useFeatureFlags();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageTemplates =
    isAdmin ||
    hasAnyPermission([
      "tickets.templates.manage",
      "tickets.manage",
    ]);

  const canViewTemplates =
    canManageTemplates ||
    hasAnyPermission([
      "tickets.templates.view",
    ]);

  const canCreateTemplate =
    canManageTemplates ||
    hasAnyPermission([
      "tickets.templates.create",
    ]);

  const canEditTemplate =
    canManageTemplates ||
    hasAnyPermission([
      "tickets.templates.edit",
    ]);

  const canDeleteTemplate =
    canManageTemplates ||
    hasAnyPermission([
      "tickets.templates.delete",
    ]);

  const canCreateTicket =
    isAdmin ||
    hasAnyPermission([
      "tickets.create",
      "tickets.manage",
    ]);

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

    function handleTemplatesUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
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
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
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
        Array.isArray(
          nextTemplates
        )
          ? nextTemplates
          : []
      );

      setCompanies(
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
      );

      if (
        !companyId &&
        nextCompanies[0]
      ) {
        setCompanyId(
          nextCompanies[0].id
        );
      }

      const firstDepartment =
        nextDepartments.find(
          (department) =>
            department.companyId ===
            (
              companyId ||
              nextCompanies[0]?.id
            )
        ) ||
        nextDepartments[0];

      if (
        !departmentId &&
        firstDepartment
      ) {
        setDepartmentId(
          firstDepartment.id
        );
      }
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

  function getCompanyName(
    nextCompanyId?: string
  ) {
    if (!nextCompanyId) {
      return "Intern";
    }

    return (
      companies.find(
        (item) =>
          item.id === nextCompanyId
      )?.name ||
      "Intern"
    );
  }

  function getDepartmentName(
    nextDepartmentId?: string
  ) {
    if (!nextDepartmentId) {
      return "Allgemein";
    }

    return (
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      )?.name ||
      "Allgemein"
    );
  }

  const activeCompanies =
    useMemo(
      () =>
        companies.filter(
          (company) =>
            company.status === "active"
        ),
      [
        companies,
      ]
    );

  const activeDepartments =
    useMemo(
      () =>
        departments.filter(
          (department) =>
            department.status === "active"
        ),
      [
        departments,
      ]
    );

  const selectableDepartments =
    useMemo(
      () => {
        const source =
          activeDepartments.length > 0
            ? activeDepartments
            : departments;

        if (!companyId) {
          return source;
        }

        return source.filter(
          (department) =>
            department.companyId === companyId
        );
      },
      [
        activeDepartments,
        departments,
        companyId,
      ]
    );

  const filteredDepartmentOptions =
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

  function handleCompanyChange(
    nextCompanyId: string
  ) {
    setCompanyId(
      nextCompanyId
    );

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === nextCompanyId &&
          department.status === "active"
      ) ||
      departments.find(
        (department) =>
          department.companyId === nextCompanyId
      );

    setDepartmentId(
      firstDepartment?.id ||
        ""
    );
  }

  function resetForm() {
    const firstCompany =
      activeCompanies[0] ||
      companies[0];

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id &&
          department.status === "active"
      ) ||
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id
      ) ||
      departments[0];

    setEditingId(
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
      "open"
    );

    setCompanyId(
      isAdmin || canManageTemplates
        ? firstCompany?.id ||
          ""
        : user?.companyId ||
          ""
    );

    setDepartmentId(
      isAdmin || canManageTemplates
        ? firstDepartment?.id ||
          ""
        : user?.departmentId ||
          ""
    );

    setAssignedTo(
      ""
    );

    setTags(
      ""
    );

    setShowForm(
      false
    );
  }

  function openCreateForm() {
    if (!ticketTemplatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canCreateTemplate) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu erstellen."
      );

      return;
    }

    resetForm();

    setShowForm(
      true
    );
  }

  function startEditTemplate(
    template: TicketTemplate
  ) {
    if (!ticketTemplatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canEditTemplate) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu bearbeiten."
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
      Array.isArray(
        template.tags
      )
        ? template.tags.join(
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

  function userCanSeeTemplate(
    template: TicketTemplate
  ) {
    if (isAdmin || canManageTemplates) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.departmentId) {
      return template.departmentId === user.departmentId;
    }

    if (user.companyId) {
      return template.companyId === user.companyId;
    }

    return false;
  }

  const visibleTemplates =
    useMemo(
      () =>
        templates.filter(
          userCanSeeTemplate
        ),
      [
        templates,
        user,
        isAdmin,
        canManageTemplates,
      ]
    );

  const filteredTemplates =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return visibleTemplates.filter(
          (template) => {
            const templateCompany =
              template.company ||
              getCompanyName(
                template.companyId
              );

            const templateDepartment =
              template.department ||
              getDepartmentName(
                template.departmentId
              );

            const matchesSearch =
              !query ||
              [
                template.id,
                template.title,
                template.description,
                template.category,
                template.status,
                template.priority,
                templateCompany,
                templateDepartment,
                template.assignedTo,
                template.tags?.join(" "),
                template.createdAt,
                template.updatedAt,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesPriority =
              !priorityFilter ||
              template.priority === priorityFilter;

            const matchesStatus =
              !statusFilter ||
              template.status === statusFilter;

            const matchesCompany =
              !companyFilter ||
              template.companyId === companyFilter;

            const matchesDepartment =
              !departmentFilter ||
              template.departmentId === departmentFilter;

            return (
              matchesSearch &&
              matchesPriority &&
              matchesStatus &&
              matchesCompany &&
              matchesDepartment
            );
          }
        );
      },
      [
        visibleTemplates,
        search,
        priorityFilter,
        statusFilter,
        companyFilter,
        departmentFilter,
        companies,
        departments,
      ]
    );

  const highPriorityCount =
    visibleTemplates.filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent"
    ).length;

  const openCount =
    visibleTemplates.filter(
      (template) =>
        template.status === "open"
    ).length;

  async function handleSaveTemplate() {
    if (!ticketTemplatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (
      !canCreateTemplate &&
      !editingId
    ) {
      alert(
        "Du hast keine Berechtigung, Vorlagen zu erstellen."
      );

      return;
    }

    if (
      !canEditTemplate &&
      editingId
    ) {
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
      );

    const selectedDepartmentName =
      getDepartmentName(
        departmentId
      );

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
        splitTags(
          tags
        ),
    };

    try {
      setSaving(
        true
      );

      if (editingId) {
        const updatedTemplate =
          await ticketTemplateRepository.update(
            editingId,
            templateData
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
        await ticketTemplateRepository.create(
          templateData
        );

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
    if (!ticketTemplatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canDeleteTemplate) {
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
          : "Vorlage konnte nicht gelöscht werden."
      );
    }
  }

  async function createTicketFromTemplate(
    template: TicketTemplate
  ) {
    if (!ticketTemplatesEnabled) {
      alert(
        "Ticket-Vorlagen sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canCreateTicket) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    try {
      const createdTicket =
        await ticketRepository.create({
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
            template.companyId ||
            "",

          departmentId:
            template.departmentId ||
            "",

          company:
            template.company ||
            "Intern",

          department:
            template.department ||
            "Allgemein",

          assignedTo:
            template.assignedTo ||
            "",

          createdBy:
            user?.name ||
            "System",

          tags:
            template.tags ||
            [],
        });

      saveTicketCreatedFromTemplateActivity(
        template,
        createdTicket
      );

      alert(
        "Ticket wurde aus Vorlage erstellt."
      );
    } catch (createError) {
      console.error(
        createError
      );

      alert(
        createError instanceof Error
          ? createError.message
          : "Ticket konnte nicht erstellt werden."
      );
    }
  }

  function resetFilters() {
    setSearch(
      ""
    );

    setPriorityFilter(
      ""
    );

    setStatusFilter(
      ""
    );

    setCompanyFilter(
      ""
    );

    setDepartmentFilter(
      ""
    );
  }

  function handleStatusChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setStatus(
      event.target.value as TicketTemplateStatus
    );
  }

  function handlePriorityChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setPriority(
      event.target.value as TicketTemplatePriority
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

  if (!canViewTemplates) {
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
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-2">
            Du hast keine Berechtigung, Ticket-Vorlagen zu sehen.
          </p>
        </div>
      </div>
    );
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
            Wiederkehrende Ticket-Typen als Vorlage speichern und daraus Tickets erstellen.
          </p>
        </div>

        {canCreateTemplate && (
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
            Ticket-Vorlagen werden geladen...
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
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Vorlagen gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {visibleTemplates.length}
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

          <h2 className="text-4xl font-bold mt-3">
            Öffnen
          </h2>
        </Link>
      </div>

      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Vorlage bearbeiten"
              : "Vorlage erstellen"}
          </h2>

          <p className="text-zinc-500 mt-1">
            Vorlagen sind für echte Firmen- und Abteilungs-IDs vorbereitet.
          </p>

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
                onChange={handleStatusChange}
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
                onChange={handlePriorityChange}
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
                disabled={!isAdmin && !canManageTemplates}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Firma auswählen
                </option>

                {(activeCompanies.length > 0
                  ? activeCompanies
                  : companies
                ).map(
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
                  setDepartmentId(
                    event.target.value
                  )
                }
                disabled={!isAdmin && !canManageTemplates}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Abteilung auswählen
                </option>

                {selectableDepartments.map(
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
              type="button"
              onClick={() =>
                void handleSaveTemplate()
              }
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingId
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
        </div>
      )}

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

            {filteredDepartmentOptions.map(
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
            {filteredTemplates.length} von {visibleTemplates.length} Vorlagen gefunden
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

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
              );

            const templateDepartment =
              template.department ||
              getDepartmentName(
                template.departmentId
              );

            return (
              <div
                key={template.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
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
                    {canCreateTicket && (
                      <button
                        type="button"
                        onClick={() =>
                          void createTicketFromTemplate(
                            template
                          )
                        }
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Ticket erstellen
                      </button>
                    )}

                    {canEditTemplate && (
                      <button
                        type="button"
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

                    {canDeleteTemplate && (
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