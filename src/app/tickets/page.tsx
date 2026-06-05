"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  ticketRepository,
} from "../../lib/ticketRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  taxonomyRepository,
} from "../../lib/taxonomyRepository";

import {
  saveTicketCreatedActivity,
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../lib/ticketActivityHelpers";

import {
  useFeatureFlags,
} from "../../hooks/useFeatureFlags";

import {
  usePermissions,
} from "../../hooks/usePermissions";

import AppModal from "../../components/AppModal";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../types/ticket";

import type {
  Company,
  Department,
} from "../../types/company";

import type {
  TaxonomyItem,
} from "../../types/taxonomy";

type ViewMode =
  | "cards"
  | "table";

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

function getTaxonomyPathLabel(
  itemId: string,
  items: TaxonomyItem[]
) {
  return taxonomyRepository.getPathLabel(
    itemId,
    items
  );
}

function getActiveTaxonomyItems(
  items: TaxonomyItem[]
) {
  return items.filter(
    (item) =>
      item.status === "active"
  );
}

function toggleArrayValue(
  values: string[],
  value: string
) {
  if (values.includes(value)) {
    return values.filter(
      (currentValue) =>
        currentValue !== value
    );
  }

  return [
    ...values,
    value,
  ];
}

export default function TicketsPage() {
  const searchParams =
    useSearchParams();

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

  const canManageTickets =
    isAdmin ||
    hasAnyPermission([
      "tickets.manage",
    ]);

  const canCreateTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.create",
    ]);

  const canEditTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.edit",
    ]);

  const canDeleteTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.delete",
    ]);

  const canAssignTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.assign",
    ]);

  const canCloseTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.close",
    ]);

  const urlStatusFilter =
    searchParams.get(
      "status"
    ) ||
    "";

  const urlPriorityFilter =
    searchParams.get(
      "priority"
    ) ||
    "";

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [taxonomyItems, setTaxonomyItems] =
    useState<TaxonomyItem[]>([]);

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

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("table");

  const [hideClosed, setHideClosed] =
    useState(true);

  const [modalOpen, setModalOpen] =
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
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
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

    function handleTaxonomyUpdated() {
      void loadTaxonomy();
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

    window.addEventListener(
      "taxonomyUpdated",
      handleTaxonomyUpdated
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

      window.removeEventListener(
        "taxonomyUpdated",
        handleTaxonomyUpdated
      );
    };
  }, []);

  useEffect(() => {
    setStatusFilter(
      urlStatusFilter
    );

    setPriorityFilter(
      urlPriorityFilter
    );

    if (urlStatusFilter === "closed") {
      setHideClosed(
        false
      );
    }
  }, [
    urlStatusFilter,
    urlPriorityFilter,
  ]);

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

  async function loadTaxonomy() {
    try {
      const nextTaxonomyItems =
        await taxonomyRepository.list();

      setTaxonomyItems(
        Array.isArray(
          nextTaxonomyItems
        )
          ? nextTaxonomyItems
          : []
      );
    } catch (loadError) {
      console.error(
        "Kategorien & Tags konnten nicht geladen werden:",
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
        nextTaxonomyItems,
      ] =
        await Promise.all([
          ticketRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
          taxonomyRepository.list(),
        ]);

      setTickets(
        Array.isArray(
          nextTickets
        )
          ? nextTickets
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

      setTaxonomyItems(
        Array.isArray(
          nextTaxonomyItems
        )
          ? nextTaxonomyItems
          : []
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

  function userCanSeeTicket(
    ticket: Ticket
  ) {
    if (
      isAdmin ||
      canManageTickets
    ) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.departmentId) {
      return ticket.departmentId === user.departmentId;
    }

    if (user.companyId) {
      return ticket.companyId === user.companyId;
    }

    return false;
  }

  const visibleTickets =
    useMemo(
      () =>
        tickets.filter(
          userCanSeeTicket
        ),
      [
        tickets,
        user,
        isAdmin,
        canManageTickets,
      ]
    );

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

  const ticketCategoryOptions =
    useMemo(
      () =>
        getActiveTaxonomyItems(
          taxonomyItems
        )
          .filter(
            (item) =>
              item.target === "ticket" &&
              item.type === "category"
          )
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.name.localeCompare(
                b.name
              )
          ),
      [
        taxonomyItems,
      ]
    );

  const tagOptions =
    useMemo(
      () =>
        getActiveTaxonomyItems(
          taxonomyItems
        )
          .filter(
            (item) =>
              item.type === "tag" &&
              (
                item.target === "global" ||
                item.target === "ticket"
              )
          )
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.name.localeCompare(
                b.name
              )
          ),
      [
        taxonomyItems,
      ]
    );

  const selectedCategoryLabel =
    useMemo(
      () => {
        const selectedCategory =
          ticketCategoryOptions.find(
            (item) =>
              item.id === category
          );

        if (!selectedCategory) {
          return category ||
            "Allgemein";
        }

        return getTaxonomyPathLabel(
          selectedCategory.id,
          taxonomyItems
        ) ||
          selectedCategory.name;
      },
      [
        category,
        ticketCategoryOptions,
        taxonomyItems,
      ]
    );

  const filteredTickets =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return visibleTickets.filter(
          (ticket) => {
            if (
              hideClosed &&
              ticket.status === "closed" &&
              statusFilter !== "closed"
            ) {
              return false;
            }

            const companyName =
              getCompanyName(
                ticket.companyId
              );

            const departmentName =
              getDepartmentName(
                ticket.departmentId
              );

            const ticketTags =
              Array.isArray(
                ticket.tags
              )
                ? ticket.tags.join(
                    " "
                  )
                : "";

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
                ticketTags,
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

            const matchesCategory =
              !categoryFilter ||
              ticket.category === categoryFilter;

            const matchesTag =
              !tagFilter ||
              (
                Array.isArray(
                  ticket.tags
                ) &&
                ticket.tags.includes(
                  tagFilter
                )
              );

            return (
              matchesSearch &&
              matchesStatus &&
              matchesPriority &&
              matchesCompany &&
              matchesDepartment &&
              matchesCategory &&
              matchesTag
            );
          }
        );
      },
      [
        visibleTickets,
        search,
        statusFilter,
        priorityFilter,
        companyFilter,
        departmentFilter,
        categoryFilter,
        tagFilter,
        companies,
        departments,
        hideClosed,
      ]
    );

  const openTickets =
    visibleTickets.filter(
      (ticket) =>
        ticket.status === "open"
    );

  const inProgressTickets =
    visibleTickets.filter(
      (ticket) =>
        ticket.status === "in_progress"
    );

  const highOrUrgentTickets =
    visibleTickets.filter(
      (ticket) =>
        ticket.priority === "high" ||
        ticket.priority === "urgent"
    );

  const closedTickets =
    visibleTickets.filter(
      (ticket) =>
        ticket.status === "closed"
    );

  function resetForm() {
    setEditingTicketId(
      ""
    );

    setTitle(
      ""
    );

    setDescription(
      ""
    );

    setStatus(
      "open"
    );

    setPriority(
      "medium"
    );

    setCategory(
      ticketCategoryOptions[0]?.id ||
        ""
    );

    setCompanyId(
      user?.companyId ||
        ""
    );

    setDepartmentId(
      user?.departmentId ||
        ""
    );

    setAssignedTo(
      ""
    );

    setCreatedBy(
      user?.name ||
        "System"
    );

    setTags(
      []
    );
  }

  function closeModal() {
    setModalOpen(
      false
    );

    resetForm();
  }

  function openCreateForm() {
    if (!canCreateTicket) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    resetForm();

    if (
      isAdmin ||
      canManageTickets
    ) {
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
    }

    setModalOpen(
      true
    );
  }

  function startEditTicket(
    ticket: Ticket
  ) {
    if (!canEditTicket) {
      alert(
        "Du hast keine Berechtigung, Tickets zu bearbeiten."
      );

      return;
    }

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

    const matchingCategory =
      ticketCategoryOptions.find(
        (item) =>
          item.id === ticket.category ||
          item.name === ticket.category ||
          getTaxonomyPathLabel(
            item.id,
            taxonomyItems
          ) === ticket.category
      );

    setCategory(
      matchingCategory?.id ||
        ticket.category ||
        ""
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
        user?.name ||
        "System"
    );

    setTags(
      Array.isArray(
        ticket.tags
      )
        ? ticket.tags
        : []
    );

    setModalOpen(
      true
    );
  }

  function handleCompanyChange(
    nextCompanyId: string
  ) {
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
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canCreateTicket &&
      !editingTicketId
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu erstellen."
      );

      return;
    }

    if (
      !canEditTicket &&
      editingTicketId
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu bearbeiten."
      );

      return;
    }

    if (
      status === "closed" &&
      !canCloseTicket
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu schließen."
      );

      return;
    }

    const currentTicket =
      editingTicketId
        ? tickets.find(
            (ticket) =>
              ticket.id === editingTicketId
          )
        : null;

    if (
      currentTicket &&
      currentTicket.assignedTo !== assignedTo.trim() &&
      !canAssignTicket
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zuzuweisen."
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

      setMessage(
        ""
      );

      setError(
        ""
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
                selectedCategoryLabel,

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
                user?.name ||
                "System",

              tags,
            }
          );

        if (updatedTicket) {
          saveTicketUpdatedActivity(
            updatedTicket
          );
        }

        closeModal();

        await loadData();

        setMessage(
          "Ticket wurde gespeichert."
        );

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
            selectedCategoryLabel,

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
            user?.name ||
            "System",

          tags,
        });

      saveTicketCreatedActivity(
        createdTicket
      );

      closeModal();

      await loadData();

      setMessage(
        "Ticket wurde erstellt."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
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

  async function handleCloseTicket(
    ticket: Ticket
  ) {
    if (!canCloseTicket) {
      alert(
        "Du hast keine Berechtigung, Tickets zu schließen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Ticket #${ticket.id} "${ticket.title}" wirklich schließen?`
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

      const updatedTicket =
        await ticketRepository.update(
          ticket.id,
          {
            status:
              "closed",
          }
        );

      if (updatedTicket) {
        saveTicketUpdatedActivity(
          updatedTicket
        );
      }

      await loadData();

      setMessage(
        "Ticket wurde geschlossen."
      );
    } catch (closeError) {
      console.error(
        closeError
      );

      setError(
        closeError instanceof Error
          ? closeError.message
          : "Ticket konnte nicht geschlossen werden."
      );
    }
  }

  async function handleDeleteTicket(
    ticket: Ticket
  ) {
    if (!canDeleteTicket) {
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
      setMessage(
        ""
      );

      setError(
        ""
      );

      saveTicketDeletedActivity(
        ticket
      );

      await ticketRepository.delete(
        ticket.id
      );

      await loadData();

      setMessage(
        "Ticket wurde gelöscht."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket konnte nicht gelöscht werden."
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

    setPriorityFilter(
      ""
    );

    setCompanyFilter(
      ""
    );

    setDepartmentFilter(
      ""
    );

    setCategoryFilter(
      ""
    );

    setTagFilter(
      ""
    );

    setHideClosed(
      true
    );
  }

  function renderActions(
    ticket: Ticket
  ) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/tickets/${ticket.id}`}
          className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
        >
          Öffnen
        </Link>

        {canEditTicket && (
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

        {ticket.status !== "closed" && canCloseTicket && (
          <button
            type="button"
            onClick={() =>
              void handleCloseTicket(
                ticket
              )
            }
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-500 transition"
          >
            Schließen
          </button>
        )}

        {canDeleteTicket && (
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
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={
          editingTicketId
            ? "Ticket bearbeiten"
            : "Ticket erstellen"
        }
        description="Ticket wird direkt in PostgreSQL gespeichert."
        maxWidth="5xl"
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
              form="ticket-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingTicketId
                  ? "Änderungen speichern"
                  : "Ticket erstellen"}
            </button>
          </div>
        )}
      >
        <form
          id="ticket-form"
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="xl:col-span-2">
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

            <div className="xl:col-span-2">
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

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Kategorie auswählen
                </option>

                {ticketCategoryOptions.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {getTaxonomyPathLabel(
                        item.id,
                        taxonomyItems
                      )}
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
                disabled={!canAssignTicket}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                placeholder="Name oder Team"
              />
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
                disabled={!isAdmin && !canManageTickets}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
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
                disabled={!isAdmin && !canManageTickets}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
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

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 p-4">
                {tagOptions.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Noch keine aktiven Tags im Admin Backend angelegt.
                  </p>
                )}

                {tagOptions.map(
                  (item) => {
                    const active =
                      tags.includes(
                        item.name
                      );

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setTags(
                            (currentTags) =>
                              toggleArrayValue(
                                currentTags,
                                item.name
                              )
                          )
                        }
                        className={`px-4 py-2 rounded-xl text-sm transition ${
                          active
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Support"
        title="Tickets"
        description="Supportfälle und Aufgaben aus PostgreSQL verwalten."
        badges={[
          {
            label:
              `${visibleTickets.length} Tickets`,
          },
          {
            label:
              `${openTickets.length} offen`,
          },
          {
            label:
              `${closedTickets.length} geschlossen`,
          },
        ]}
        actions={(
          <>
            {ticketTemplatesEnabled && canManageTickets && (
              <Link
                href="/tickets/templates"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
              >
                Vorlagen
              </Link>
            )}

            {canCreateTicket && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Ticket erstellen
              </button>
            )}
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Tickets werden geladen...
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
          label="Tickets gesamt"
          value={visibleTickets.length}
          description="Alle sichtbaren Tickets"
          icon="🎫"
          active={
            !statusFilter &&
            !priorityFilter
          }
          onClick={resetFilters}
        />

        <StatCard
          label="Offen"
          value={openTickets.length}
          description="Noch nicht bearbeitet"
          icon="📬"
          tone="blue"
          active={statusFilter === "open"}
          onClick={() =>
            setStatusFilter(
              "open"
            )
          }
        />

        <StatCard
          label="In Bearbeitung"
          value={inProgressTickets.length}
          description="Aktuell in Arbeit"
          icon="⏳"
          tone="orange"
          active={statusFilter === "in_progress"}
          onClick={() =>
            setStatusFilter(
              "in_progress"
            )
          }
        />

        <StatCard
          label="Hoch/Dringend"
          value={highOrUrgentTickets.length}
          description={`${closedTickets.length} geschlossen`}
          icon="🚨"
          tone="red"
          active={priorityFilter === "urgent"}
          onClick={() =>
            setPriorityFilter(
              "urgent"
            )
          }
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach ID, Titel, Beschreibung, Kategorie, Tags, Organisation, Ersteller oder Bearbeiter.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "cards"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
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
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>

            <button
              type="button"
              onClick={() =>
                setHideClosed(
                  (current) =>
                    !current
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                hideClosed
                  ? "bg-green-50 text-green-700"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              {hideClosed
                ? "Geschlossene ausgeblendet"
                : "Geschlossene anzeigen"}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
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
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>

            {ticketCategoryOptions.map(
              (item) => {
                const label =
                  getTaxonomyPathLabel(
                    item.id,
                    taxonomyItems
                  );

                return (
                  <option
                    key={item.id}
                    value={label}
                  >
                    {label}
                  </option>
                );
              }
            )}
          </select>

          <select
            value={tagFilter}
            onChange={(event) =>
              setTagFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Tags
            </option>

            {tagOptions.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.name}
                >
                  {item.name}
                </option>
              )
            )}
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

        <p className="text-sm text-zinc-500">
          {filteredTickets.length} von {visibleTickets.length} Tickets gefunden.
        </p>
      </div>

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

      {viewMode === "cards" && (
        <div className="space-y-4">
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

                      <span>
                        Erstellt von:{" "}
                        {ticket.createdBy ||
                          "System"}
                      </span>
                    </div>
                  </Link>

                  {renderActions(
                    ticket
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {viewMode === "table" && filteredTickets.length > 0 && (
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
                    Organisation
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Erstellt von
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Zugewiesen
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Erstellt
                  </th>

                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map(
                  (ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 align-top font-mono text-zinc-500 whitespace-nowrap">
                        #{ticket.id}
                      </td>

                      <td className="px-5 py-4 align-top min-w-[280px]">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-semibold hover:underline"
                        >
                          {ticket.title}
                        </Link>

                        <p className="text-zinc-500 mt-1 line-clamp-2">
                          {ticket.description ||
                            "Keine Beschreibung vorhanden."}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                          {getStatusLabel(
                            ticket.status
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                          {getPriorityLabel(
                            ticket.priority
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 min-w-48">
                        {ticket.category ||
                          "Allgemein"}

                        {Array.isArray(ticket.tags) && ticket.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {ticket.tags.map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full"
                                >
                                  #{tag}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {getCompanyName(
                          ticket.companyId
                        )}
                        <br />
                        {getDepartmentName(
                          ticket.departmentId
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {ticket.createdBy ||
                          "System"}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {ticket.assignedTo ||
                          "Niemand"}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 whitespace-nowrap">
                        {ticket.createdAt}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end">
                          {renderActions(
                            ticket
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}