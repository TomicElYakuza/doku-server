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
import AppModal from "../../components/AppModal";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  companyRepository,
} from "../../lib/companyRepository";
import {
  saveTicketCreatedActivity,
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../lib/ticketActivityHelpers";
import {
  ticketRepository,
} from "../../lib/ticketRepository";
import {
  useAppSettings,
} from "../../hooks/useAppSettings";
import {
  useFeatureFlags,
} from "../../hooks/useFeatureFlags";
import {
  usePermissions,
} from "../../hooks/usePermissions";
import type {
  Company,
  Department,
} from "../../types/company";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../types/ticket";


type ViewMode = "cards" | "table";

type TaxonomyItem = {
  id: string;
  type: "category" | "tag";
  target: string;
  name: string;
  slug?: string;
  path?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

const statusOptions: {
  value: TicketStatus;
  label: string;
}[] = [
  {
    value: "open",
    label: "Offen",
  },
  {
    value: "in_progress",
    label: "In Bearbeitung",
  },
  {
    value: "waiting",
    label: "Wartend",
  },
  {
    value: "done",
    label: "Erledigt",
  },
  {
    value: "closed",
    label: "Geschlossen",
  },
];

const priorityOptions: {
  value: TicketPriority;
  label: string;
}[] = [
  {
    value: "low",
    label: "Niedrig",
  },
  {
    value: "medium",
    label: "Mittel",
  },
  {
    value: "high",
    label: "Hoch",
  },
  {
    value: "urgent",
    label: "Dringend",
  },
];

function getStatusLabel(status: TicketStatus | string) {
  return ticketRepository.getStatusLabel(status);
}

function getStatusClass(status: TicketStatus | string) {
  return ticketRepository.getStatusClass(status);
}

function getPriorityLabel(priority: TicketPriority | string) {
  return ticketRepository.getPriorityLabel(priority);
}

function getPriorityClass(priority: TicketPriority | string) {
  return ticketRepository.getPriorityClass(priority);
}

function formatTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(Boolean);
}

function getTaxonomyLabel(item: TaxonomyItem, allItems: TaxonomyItem[]) {
  if (item.path) {
    return item.path;
  }

  const names: string[] = [];
  let current: TaxonomyItem | undefined = item;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.name);

    if (!current.parentId) {
      break;
    }

    current = allItems.find((candidate) => candidate.id === current?.parentId);
  }

  return names.join(" > ") || item.name;
}

function sortByLabel(
  first: {
    label: string;
  },
  second: {
    label: string;
  },
) {
  return first.label.localeCompare(second.label);
}

function normalizeViewMode(value?: string): ViewMode {
  if (value === "cards") {
    return "cards";
  }

  return "table";
}

export default function TicketsPage() {
  const searchParams = useSearchParams();

  const {
    settings,
  } = useAppSettings();

  const {
    ticketTemplatesEnabled,
  } = useFeatureFlags();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const canManageTickets = isAdmin || hasAnyPermission([
    "tickets.manage",
  ]);
  const canCreateTicket = canManageTickets || hasAnyPermission([
    "tickets.create",
  ]);
  const canEditTicket = canManageTickets || hasAnyPermission([
    "tickets.edit",
  ]);
  const canDeleteTicket = canManageTickets || hasAnyPermission([
    "tickets.delete",
  ]);
  const canAssignTicket = canManageTickets || hasAnyPermission([
    "tickets.assign",
  ]);
  const canCloseTicket = canManageTickets || hasAnyPermission([
    "tickets.close",
  ]);

  const urlStatusFilter = searchParams.get("status") || "";
  const urlPriorityFilter = searchParams.get("priority") || "";
  const urlCategoryFilter = searchParams.get("category") || "";
  const urlTagFilter = searchParams.get("tag") || "";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TaxonomyItem[]>([]);
  const [ticketTags, setTicketTags] = useState<TaxonomyItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [hideClosed, setHideClosed] = useState(true);
  const [settingsApplied, setSettingsApplied] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [company, setCompany] = useState("Intern");
  const [department, setDepartment] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [createdBy, setCreatedBy] = useState("System");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

    window.addEventListener("ticketsUpdated", handleTicketsUpdated);
    window.addEventListener("companiesUpdated", handleCompaniesUpdated);
    window.addEventListener("departmentsUpdated", handleDepartmentsUpdated);

    return () => {
      window.removeEventListener("ticketsUpdated", handleTicketsUpdated);
      window.removeEventListener("companiesUpdated", handleCompaniesUpdated);
      window.removeEventListener("departmentsUpdated", handleDepartmentsUpdated);
    };
  }, []);

  useEffect(() => {
    if (settingsApplied) {
      return;
    }

    setViewMode(normalizeViewMode(settings.defaultTicketView));
    setHideClosed(settings.hideClosedTicketsByDefault !== false);
    setSettingsApplied(true);
  }, [
    settings,
    settingsApplied,
  ]);

  useEffect(() => {
    setStatusFilter(urlStatusFilter);
    setPriorityFilter(urlPriorityFilter);
    setCategoryFilter(urlCategoryFilter);
    setTagFilter(urlTagFilter);

    if (urlStatusFilter === "closed") {
      setHideClosed(false);
    }
  }, [
    urlStatusFilter,
    urlPriorityFilter,
    urlCategoryFilter,
    urlTagFilter,
  ]);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      fetch("/api/taxonomy?target=ticket&type=category"),
      fetch("/api/taxonomy?target=global&type=tag"),
      fetch("/api/taxonomy?target=ticket&type=tag"),
    ]);

    const nextTicketCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [index, result] of requests.entries()) {
      if (result.status !== "fulfilled" || !result.value.ok) {
        continue;
      }

      const data = await result.value.json();
      const items = Array.isArray(data) ? data : [];

      if (index === 0) {
        nextTicketCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setTicketCategories(
      nextTicketCategories.filter((item) => item.isActive !== false),
    );

    const uniqueTags = Array.from(
      new Map(
        nextTags
          .filter((item) => item.isActive !== false)
          .map((item) => [
            item.name,
            item,
          ]),
      ).values(),
    );

    setTicketTags(uniqueTags);
  }

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error("Organisation konnte nicht geladen werden:", loadError);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextTickets,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        ticketRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        loadTaxonomyItems(),
      ]);

      setTickets(Array.isArray(nextTickets) ? nextTickets : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Tickets konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(nextCompanyId?: string) {
    if (!nextCompanyId) {
      return "Intern";
    }

    return (
      companies.find((nextCompany) => nextCompany.id === nextCompanyId)?.name ||
      "Intern"
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return "";
    }

    return (
      departments.find((nextDepartment) => nextDepartment.id === nextDepartmentId)?.name ||
      ""
    );
  }

  function userCanSeeTicket(ticket: Ticket) {
    if (isAdmin || canManageTickets) {
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

  const visibleTickets = useMemo(
    () => tickets.filter(userCanSeeTicket),
    [
      tickets,
      user,
      isAdmin,
      canManageTickets,
    ],
  );

  const categoryOptions = useMemo(
    () =>
      ticketCategories
        .map((item) => ({
          id: item.id,
          value: getTaxonomyLabel(item, ticketCategories),
          label: getTaxonomyLabel(item, ticketCategories),
        }))
        .sort(sortByLabel),
    [
      ticketCategories,
    ],
  );

  const tagOptions = useMemo(
    () =>
      ticketTags
        .map((item) => ({
          id: item.id,
          value: item.name,
          label: item.name,
        }))
        .sort(sortByLabel),
    [
      ticketTags,
    ],
  );

  const departmentOptions = useMemo(
    () => {
      if (!companyId) {
        return departments;
      }

      return departments.filter(
        (nextDepartment) => nextDepartment.companyId === companyId,
      );
    },
    [
      departments,
      companyId,
    ],
  );

  const filteredDepartments = useMemo(
    () => {
      if (!companyFilter) {
        return departments;
      }

      return departments.filter(
        (nextDepartment) => nextDepartment.companyId === companyFilter,
      );
    },
    [
      departments,
      companyFilter,
    ],
  );

  const filteredTickets = useMemo(
    () => {
      const query = search.trim().toLowerCase();

      return visibleTickets.filter((ticket) => {
        if (
          hideClosed &&
          ticket.status === "closed" &&
          statusFilter !== "closed"
        ) {
          return false;
        }

        const companyName = ticket.company || getCompanyName(ticket.companyId);
        const departmentName = ticket.department || getDepartmentName(ticket.departmentId);
        const ticketCategory = ticket.category || "";
        const ticketTags = formatTags(ticket.tags);

        const matchesSearch =
          !query ||
          [
            ticket.id,
            ticket.title,
            ticket.description,
            ticket.status,
            ticket.priority,
            ticketCategory,
            ticket.company,
            ticket.department,
            companyName,
            departmentName,
            ticket.assignedTo,
            ticket.createdBy,
            ticketTags.join(" "),
            ticket.createdAt,
            ticket.updatedAt,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);

        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesCategory = !categoryFilter || ticketCategory === categoryFilter;
        const matchesTag = !tagFilter || ticketTags.includes(tagFilter);
        const matchesCompany = !companyFilter || ticket.companyId === companyFilter;
        const matchesDepartment = !departmentFilter || ticket.departmentId === departmentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesCategory &&
          matchesTag &&
          matchesCompany &&
          matchesDepartment
        );
      });
    },
    [
      visibleTickets,
      search,
      statusFilter,
      priorityFilter,
      categoryFilter,
      tagFilter,
      companyFilter,
      departmentFilter,
      companies,
      departments,
      hideClosed,
    ],
  );

  const openTickets = visibleTickets.filter((ticket) => ticket.status === "open");
  const inProgressTickets = visibleTickets.filter((ticket) => ticket.status === "in_progress");
  const highOrUrgentTickets = visibleTickets.filter(
    (ticket) =>
      ticket.priority === "high" ||
      ticket.priority === "urgent",
  );
  const closedTickets = visibleTickets.filter((ticket) => ticket.status === "closed");

  function resetForm() {
    const firstCategory = categoryOptions[0]?.value || "";

    setEditingTicketId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory(firstCategory);
    setCompanyId(user?.companyId || "");
    setDepartmentId(user?.departmentId || "");
    setCompany(user?.company || "Intern");
    setDepartment(user?.department || "");
    setAssignedTo("");
    setCreatedBy(user?.name || "System");
    setSelectedTags([]);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function openCreateForm() {
    if (!canCreateTicket) {
      alert("Du hast keine Berechtigung, Tickets zu erstellen.");
      return;
    }

    resetForm();

    if (isAdmin || canManageTickets) {
      const firstCompany = companies[0];
      const firstDepartment = departments.find(
        (nextDepartment) => nextDepartment.companyId === firstCompany?.id,
      );

      setCompanyId(firstCompany?.id || "");
      setDepartmentId(firstDepartment?.id || "");
      setCompany(firstCompany?.name || "Intern");
      setDepartment(firstDepartment?.name || "");
    }

    setModalOpen(true);
  }

  function startEditTicket(ticket: Ticket) {
    if (!canEditTicket) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    setEditingTicketId(ticket.id);
    setTitle(ticket.title);
    setDescription(ticket.description);
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setCategory(ticket.category || categoryOptions[0]?.value || "");
    setCompanyId(ticket.companyId || "");
    setDepartmentId(ticket.departmentId || "");
    setCompany(ticket.company || getCompanyName(ticket.companyId));
    setDepartment(ticket.department || getDepartmentName(ticket.departmentId));
    setAssignedTo(ticket.assignedTo || "");
    setCreatedBy(ticket.createdBy || user?.name || "System");
    setSelectedTags(formatTags(ticket.tags));
    setModalOpen(true);
  }

  function handleCompanyChange(nextCompanyId: string) {
    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.id === nextCompanyId,
    );
    const firstDepartment = departments.find(
      (nextDepartment) => nextDepartment.companyId === nextCompanyId,
    );

    setCompanyId(nextCompanyId);
    setDepartmentId(firstDepartment?.id || "");
    setCompany(selectedCompany?.name || "Intern");
    setDepartment(firstDepartment?.name || "");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    const selectedDepartment = departments.find(
      (nextDepartment) => nextDepartment.id === nextDepartmentId,
    );

    setDepartmentId(nextDepartmentId);
    setDepartment(selectedDepartment?.name || "");
  }

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter((currentTag) => currentTag !== tag);
      }

      return [
        ...currentTags,
        tag,
      ];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canCreateTicket && !editingTicketId) {
      alert("Du hast keine Berechtigung, Tickets zu erstellen.");
      return;
    }

    if (!canEditTicket && editingTicketId) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    if (status === "closed" && !canCloseTicket) {
      alert("Du hast keine Berechtigung, Tickets zu schlieÃŸen.");
      return;
    }

    const currentTicket = editingTicketId
      ? tickets.find((ticket) => ticket.id === editingTicketId)
      : null;

    if (
      currentTicket &&
      currentTicket.assignedTo !== assignedTo.trim() &&
      !canAssignTicket
    ) {
      alert("Du hast keine Berechtigung, Tickets zuzuweisen.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Kategorie auswÃ¤hlen.");
      return;
    }

    const companyName = company.trim() || getCompanyName(companyId);
    const departmentName = department.trim() || getDepartmentName(departmentId);

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category: category.trim(),
        companyId,
        departmentId,
        company: companyName,
        department: departmentName,
        assignedTo: assignedTo.trim(),
        createdBy: createdBy.trim() || user?.name || "System",
        tags: selectedTags,
      };

      if (editingTicketId) {
        const updatedTicket = await ticketRepository.update(
          editingTicketId,
          payload,
        );

        if (updatedTicket) {
          saveTicketUpdatedActivity(updatedTicket);
        }

        closeModal();
        await loadData();
        setMessage("Ticket wurde gespeichert.");
        return;
      }

      const createdTicket = await ticketRepository.create(payload);

      saveTicketCreatedActivity(createdTicket);
      closeModal();
      await loadData();
      setMessage("Ticket wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ticket konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseTicket(ticket: Ticket) {
    if (!canCloseTicket) {
      alert("Du hast keine Berechtigung, Tickets zu schlieÃŸen.");
      return;
    }

    const confirmed = confirm(
      `Ticket #${ticket.id} "${ticket.title}" wirklich schlieÃŸen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const updatedTicket = await ticketRepository.update(ticket.id, {
        status: "closed",
      });

      if (updatedTicket) {
        saveTicketUpdatedActivity(updatedTicket);
      }

      await loadData();
      setMessage("Ticket wurde geschlossen.");
    } catch (closeError) {
      console.error(closeError);
      setError(
        closeError instanceof Error
          ? closeError.message
          : "Ticket konnte nicht geschlossen werden.",
      );
    }
  }

  async function handleDeleteTicket(ticket: Ticket) {
    if (!canDeleteTicket) {
      alert("Du hast keine Berechtigung, Tickets zu lÃ¶schen.");
      return;
    }

    const confirmed = confirm(
      `Ticket #${ticket.id} "${ticket.title}" wirklich lÃ¶schen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      saveTicketDeletedActivity(ticket);
      await ticketRepository.delete(ticket.id);
      await loadData();
      setMessage("Ticket wurde gelÃ¶scht.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket konnte nicht gelÃ¶scht werden.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setTagFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
    setHideClosed(settings.hideClosedTicketsByDefault !== false);
  }

  function renderActions(ticket: Ticket) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/tickets/${ticket.id}`}
          className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
        >
          Ã–ffnen
        </Link>

        {canEditTicket && (
          <button
            type="button"
            onClick={() => startEditTicket(ticket)}
            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
          >
            Bearbeiten
          </button>
        )}

        {ticket.status !== "closed" && canCloseTicket && (
          <button
            type="button"
            onClick={() => void handleCloseTicket(ticket)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-500 transition"
          >
            SchlieÃŸen
          </button>
        )}

        {canDeleteTicket && (
          <button
            type="button"
            onClick={() => void handleDeleteTicket(ticket)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
          >
            LÃ¶schen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title={editingTicketId ? "Ticket bearbeiten" : "Ticket erstellen"}
        description="Kategorien und Tags kommen aus dem Admin Backend. Freitext-Tags sind deaktiviert."
        maxWidth="5xl"
        onClose={closeModal}
        footer={
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="bg-zinc-100 hover:bg-zinc-200 px-5 py-3 rounded-2xl transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="ticket-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 disabled:bg-zinc-400 transition"
            >
              {saving
                ? "Speichert..."
                : editingTicketId
                  ? "Ã„nderungen speichern"
                  : "Ticket erstellen"}
            </button>
          </div>
        }
      >
        <form
          id="ticket-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-medium">
              Titel
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Kurzer Titel"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
              placeholder="Beschreibung des Tickets..."
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TicketStatus)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                PrioritÃ¤t
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketPriority)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {priorityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Kategorie auswÃ¤hlen
                </option>
                {categoryOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>
              <input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
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
                onChange={(event) => handleCompanyChange(event.target.value)}
                disabled={!isAdmin && !canManageTickets}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Intern
                </option>
                {companies.map((nextCompany) => (
                  <option
                    key={nextCompany.id}
                    value={nextCompany.id}
                  >
                    {nextCompany.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>
              <select
                value={departmentId}
                onChange={(event) => handleDepartmentChange(event.target.value)}
                disabled={!isAdmin && !canManageTickets}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Nicht zugeordnet
                </option>
                {departmentOptions.map((nextDepartment) => (
                  <option
                    key={nextDepartment.id}
                    value={nextDepartment.id}
                  >
                    {nextDepartment.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Erstellt von
              </label>
              <input
                value={createdBy}
                onChange={(event) => setCreatedBy(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="System"
              />
            </div>
          </div>

          <div>
            <label className="block mb-3 font-medium">
              Tags
            </label>

            {tagOptions.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-500">
                Noch keine globalen Ticket-Tags im Admin Backend vorhanden.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((option) => {
                  const active = selectedTags.includes(option.value);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleTag(option.value)}
                      className={`px-4 py-2 rounded-xl border transition ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      #{option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Support"
        title="Tickets"
        description="SupportfÃ¤lle und Aufgaben aus PostgreSQL verwalten."
        badges={[
          {
            label: `${visibleTickets.length} Tickets`,
          },
          {
            label: `${openTickets.length} offen`,
          },
          {
            label: `${closedTickets.length} geschlossen`,
          },
        ]}
        actions={
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
        }
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
          icon="ðŸŽ«"
          active={!statusFilter && !priorityFilter && !categoryFilter && !tagFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Offen"
          value={openTickets.length}
          description="Noch nicht bearbeitet"
          icon="ðŸ“Œ"
          tone="blue"
          active={statusFilter === "open"}
          onClick={() => setStatusFilter("open")}
        />
        <StatCard
          label="In Bearbeitung"
          value={inProgressTickets.length}
          description="Aktuell in Arbeit"
          icon="â³"
          tone="orange"
          active={statusFilter === "in_progress"}
          onClick={() => setStatusFilter("in_progress")}
        />
        <StatCard
          label="Hoch/Dringend"
          value={highOrUrgentTickets.length}
          description={`${closedTickets.length} geschlossen`}
          icon="âš¡"
          tone="red"
          active={priorityFilter === "urgent"}
          onClick={() => setPriorityFilter("urgent")}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Organisation, Kategorie, Tags oder Bearbeiter.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
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
              onClick={() => setViewMode("table")}
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
              onClick={() => setHideClosed((current) => !current)}
              className={`px-4 py-2 rounded-xl transition ${
                hideClosed
                  ? "bg-green-50 text-green-700"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              {hideClosed ? "Geschlossene ausgeblendet" : "Geschlossene anzeigen"}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              ZurÃ¼cksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Tickets suchen..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle PrioritÃ¤ten
            </option>
            {priorityOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>
            {categoryOptions.map((option) => (
              <option
                key={option.id}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Tags
            </option>
            {tagOptions.map((option) => (
              <option
                key={option.id}
                value={option.value}
              >
                #{option.label}
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(event.target.value);
              setDepartmentFilter("");
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>
            {companies.map((nextCompany) => (
              <option
                key={nextCompany.id}
                value={nextCompany.id}
              >
                {nextCompany.name}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>
            {filteredDepartments.map((nextDepartment) => (
              <option
                key={nextDepartment.id}
                value={nextDepartment.id}
              >
                {nextDepartment.name}
              </option>
            ))}
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

      {viewMode === "cards" && filteredTickets.length > 0 && (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const ticketTags = formatTags(ticket.tags);
            const companyName = ticket.company || getCompanyName(ticket.companyId);
            const departmentName = ticket.department || getDepartmentName(ticket.departmentId);

            return (
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
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {companyName}
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {departmentName}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      #{ticket.id} Â· {ticket.title}
                    </h2>

                    <p className="text-zinc-500 mt-2 line-clamp-2">
                      {ticket.description || "Keine Beschreibung vorhanden."}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-5">
                      {ticketTags.length === 0 && (
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                          Keine Tags
                        </span>
                      )}

                      {ticketTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                      <span>
                        Kategorie: {ticket.category || "Nicht gesetzt"}
                      </span>
                      <span>
                        Zugewiesen: {ticket.assignedTo || "Niemand"}
                      </span>
                      <span>
                        Erstellt von: {ticket.createdBy || "System"}
                      </span>
                      <span>
                        Erstellt: {ticket.createdAt}
                      </span>
                    </div>
                  </Link>

                  {renderActions(ticket)}
                </div>
              </div>
            );
          })}
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
                    PrioritÃ¤t
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
                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => {
                  const companyName = ticket.company || getCompanyName(ticket.companyId);
                  const departmentName = ticket.department || getDepartmentName(ticket.departmentId);

                  return (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 align-top font-semibold whitespace-nowrap">
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
                          {ticket.description || "Keine Beschreibung vorhanden."}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 min-w-[220px]">
                        {ticket.category || "Nicht gesetzt"}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {companyName}
                        <br />
                        {departmentName}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 whitespace-nowrap">
                        {ticket.createdBy || "System"}
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 whitespace-nowrap">
                        {ticket.assignedTo || "Niemand"}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end">
                          {renderActions(ticket)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


