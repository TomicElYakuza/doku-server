"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import TicketComments from "../../../components/tickets/TicketComments";
import TicketFileList from "../../../components/tickets/TicketFileList";
import {
  companyRepository,
} from "../../../lib/companyRepository";
import {
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../../lib/ticketActivityHelpers";
import {
  ticketRepository,
} from "../../../lib/ticketRepository";
import {
  usePermissions,
} from "../../../hooks/usePermissions";
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../types/ticket";

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

type SelectOption = {
  id: string;
  value: string;
  label: string;
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

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

function getTaxonomyLabel(
  item: TaxonomyItem,
  allItems: TaxonomyItem[],
) {
  if (item.path) {
    return item.path;
  }

  const names: string[] = [];
  let current: TaxonomyItem | undefined = item;
  const visited = new Set<string>();

  while (
    current &&
    !visited.has(current.id)
  ) {
    visited.add(current.id);
    names.unshift(current.name);

    if (!current.parentId) {
      break;
    }

    current = allItems.find(
      (candidate) => candidate.id === current?.parentId,
    );
  }

  return names.join(" > ") || item.name;
}

function sortByLabel(
  first: SelectOption,
  second: SelectOption,
) {
  return first.label.localeCompare(second.label);
}

function getTicketAgeLabel(createdAt?: string) {
  if (!createdAt) {
    return "Unbekannt";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return createdAt;
  }

  const diffMs = Date.now() - createdDate.getTime();
  const diffDays = Math.max(
    0,
    Math.floor(diffMs / (1000 * 60 * 60 * 24)),
  );

  if (diffDays === 0) {
    return "Heute";
  }

  if (diffDays === 1) {
    return "1 Tag";
  }

  return `${diffDays} Tage`;
}

function getSafeCategory(category?: string) {
  return String(category || "").trim() || "Nicht zugeordnet";
}

function getSafeCompany(company?: string) {
  return String(company || "").trim() || "Intern";
}

function getSafeDepartment(department?: string) {
  return String(department || "").trim() || "Keine Abteilung";
}

function getStatusTone(status: TicketStatus | string) {
  if (status === "closed" || status === "done") {
    return "green" as const;
  }

  if (status === "waiting") {
    return "orange" as const;
  }

  if (status === "in_progress") {
    return "blue" as const;
  }

  return "indigo" as const;
}

function getPriorityTone(priority: TicketPriority | string) {
  if (priority === "urgent") {
    return "red" as const;
  }

  if (priority === "high") {
    return "orange" as const;
  }

  if (priority === "medium") {
    return "blue" as const;
  }

  return "green" as const;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const id = String(params.id || "");

  const canManageTickets =
    isAdmin ||
    hasAnyPermission([
      "tickets.manage",
    ]);

  const canViewTickets =
    canManageTickets ||
    hasAnyPermission([
      "tickets.view",
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

  const canCloseTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.close",
    ]);

  const canCommentTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.comment",
      "tickets.edit",
    ]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TaxonomyItem[]>([]);
  const [ticketTags, setTicketTags] = useState<TaxonomyItem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);

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

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated,
    );
    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );
    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated,
      );
      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );
      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );
    };
  }, [
    id,
  ]);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      fetch("/api/taxonomy?target=ticket&type=category"),
      fetch("/api/taxonomy?target=global&type=tag"),
      fetch("/api/taxonomy?target=ticket&type=tag"),
    ]);

    const nextTicketCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [
      index,
      result,
    ] of requests.entries()) {
      if (
        result.status !== "fulfilled" ||
        !result.value.ok
      ) {
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
      nextTicketCategories.filter(
        (item) => item.isActive !== false,
      ),
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
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    if (!id) {
      setLoading(false);
      setError("Keine Ticket-ID vorhanden.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        nextTicket,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        ticketRepository.findById(id),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        loadTaxonomyItems(),
      ]);

      setTicket(nextTicket);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);

      if (!nextTicket) {
        setError("Ticket wurde nicht gefunden.");
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ticket konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(nextCompanyId?: string) {
    if (!nextCompanyId) {
      return getSafeCompany(ticket?.company);
    }

    return (
      companies.find((nextCompany) => nextCompany.id === nextCompanyId)?.name ||
      getSafeCompany(ticket?.company)
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return getSafeDepartment(ticket?.department);
    }

    return (
      departments.find((nextDepartment) => nextDepartment.id === nextDepartmentId)?.name ||
      getSafeDepartment(ticket?.department)
    );
  }

  function userCanSeeTicket(currentTicket: Ticket) {
    if (
      isAdmin ||
      canManageTickets
    ) {
      return true;
    }

    if (
      !user ||
      !canViewTickets
    ) {
      return false;
    }

    if (user.departmentId) {
      return currentTicket.departmentId === user.departmentId;
    }

    if (user.companyId) {
      return currentTicket.companyId === user.companyId;
    }

    return true;
  }

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

  const filteredDepartments = useMemo(() => {
    if (!companyId) {
      return departments;
    }

    return departments.filter(
      (nextDepartment) => nextDepartment.companyId === companyId,
    );
  }, [
    departments,
    companyId,
  ]);

  const tags = useMemo(
    () => formatTags(ticket?.tags),
    [
      ticket,
    ],
  );

  function openEditModal() {
    if (!ticket) {
      return;
    }

    if (!canEditTicket) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    setTitle(ticket.title || "");
    setDescription(ticket.description || "");
    setStatus(ticket.status || "open");
    setPriority(ticket.priority || "medium");
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

  function closeModal() {
    setModalOpen(false);
  }

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter(
          (currentTag) => currentTag !== tag,
        );
      }

      return [
        ...currentTags,
        tag,
      ];
    });
  }

  function handleCompanyChange(nextCompanyId: string) {
    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.id === nextCompanyId,
    );

    setCompanyId(nextCompanyId);
    setDepartmentId("");
    setCompany(selectedCompany?.name || "Intern");
    setDepartment("");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    const selectedDepartment = departments.find(
      (nextDepartment) => nextDepartment.id === nextDepartmentId,
    );

    setDepartmentId(nextDepartmentId);
    setDepartment(selectedDepartment?.name || "");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!ticket) {
      return;
    }

    if (!canEditTicket) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Kategorie auswählen.");
      return;
    }

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
        company: company.trim() || getCompanyName(companyId),
        department: department.trim() || getDepartmentName(departmentId),
        assignedTo: assignedTo.trim(),
        createdBy:
          createdBy.trim() ||
          ticket.createdBy ||
          user?.name ||
          "System",
        tags: selectedTags,
      };

      const updatedTicket = await ticketRepository.update(
        ticket.id,
        payload,
      );

      if (updatedTicket) {
        saveTicketUpdatedActivity(updatedTicket);
        setTicket(updatedTicket);
      }

      closeModal();
      await loadData();

      setMessage("Ticket wurde gespeichert.");
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

  async function updateTicketStatus(nextStatus: TicketStatus) {
    if (!ticket) {
      return;
    }

    if (
      nextStatus === "closed" &&
      !canCloseTicket
    ) {
      alert("Du hast keine Berechtigung, Tickets zu schließen.");
      return;
    }

    if (
      nextStatus !== "closed" &&
      !canEditTicket
    ) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updatedTicket = await ticketRepository.update(
        ticket.id,
        {
          status: nextStatus,
        },
      );

      if (updatedTicket) {
        saveTicketUpdatedActivity(updatedTicket);
        setTicket(updatedTicket);
      }

      setMessage(
        nextStatus === "closed"
          ? "Ticket wurde geschlossen."
          : "Ticketstatus wurde aktualisiert.",
      );

      await loadData();
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ticket konnte nicht aktualisiert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTicket() {
    if (!ticket) {
      return;
    }

    if (!canDeleteTicket) {
      alert("Du hast keine Berechtigung, Tickets zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Ticket #${ticket.id} "${ticket.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      saveTicketDeletedActivity(ticket);
      await ticketRepository.delete(ticket.id);

      router.push("/tickets");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket konnte nicht gelöscht werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>

          <h1 className="text-2xl font-black mt-6">
            Ticket wird geladen
          </h1>

          <p className="text-zinc-500 mt-2">
            Das Ticket wird aus PostgreSQL geladen.
          </p>
        </div>
      </div>
    );
  }

  if (
    error ||
    !ticket
  ) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Ticket"
          title="Ticket nicht gefunden"
          description={error || "Dieses Ticket existiert nicht oder wurde entfernt."}
          badges={[
            {
              label: id || "Keine ID",
            },
            {
              label: "Nicht verfügbar",
            },
          ]}
          actions={
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Zurück zu Tickets
            </Link>
          }
        />

        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Ticket nicht verfügbar
          </h2>
          <p className="text-red-600 mt-2">
            {error || "Dieses Ticket konnte nicht geladen werden."}
          </p>
        </div>
      </div>
    );
  }

  if (!userCanSeeTicket(ticket)) {
    return (
      <AccessDeniedCard
        title="Ticket nicht verfügbar"
        description="Du hast keine Berechtigung, dieses Ticket zu sehen."
        backHref="/tickets"
        backLabel="Zurück zu Tickets"
      />
    );
  }

  const companyName = getCompanyName(ticket.companyId);
  const departmentName = getDepartmentName(ticket.departmentId);
  const ticketCategory = getSafeCategory(ticket.category);

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title="Ticket bearbeiten"
        description="Stammdaten, Taxonomie, Status, Priorität und Zuordnung bearbeiten."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="ticket-edit-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </>
        }
      >
        <form
          id="ticket-edit-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Ticketdaten
              </h3>
              <p className="text-zinc-500 mt-1">
                Titel, Kategorie, Status und Priorität.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="xl:col-span-2">
                <label className="block mb-2 font-medium">
                  Titel
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Ticket-Titel"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Kategorie auswählen
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
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TicketStatus)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
                  Priorität
                </label>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as TicketPriority)
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
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
                  Zugewiesen an
                </label>
                <input
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Name oder Team"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Organisation
              </h3>
              <p className="text-zinc-500 mt-1">
                Firma und Abteilung steuern Sichtbarkeit und Zuständigkeit.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div>
                <label className="block mb-2 font-medium">
                  Firma
                </label>
                <select
                  value={companyId}
                  onChange={(event) => handleCompanyChange(event.target.value)}
                  disabled={!isAdmin && !canManageTickets}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
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
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <option value="">
                    Keine Abteilung
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

              <div>
                <label className="block mb-2 font-medium">
                  Erstellt von
                </label>
                <input
                  value={createdBy}
                  onChange={(event) => setCreatedBy(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="System"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Beschreibung & Tags
              </h3>
              <p className="text-zinc-500 mt-1">
                Inhalt und vordefinierte Tags für bessere Filterbarkeit.
              </p>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-y"
                placeholder="Beschreibung des Tickets..."
              />
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
                            ? "app-accent-bg text-white border-transparent app-brand-shadow"
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
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow={`Ticket #${ticket.id}`}
        title={ticket.title}
        description={ticket.description || "Keine Beschreibung vorhanden."}
        badges={[
          {
            label: getStatusLabel(ticket.status),
          },
          {
            label: getPriorityLabel(ticket.priority),
          },
          {
            label: ticketCategory,
          },
          {
            label: companyName,
          },
        ]}
        actions={
          <>
            <Link
              href="/tickets"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Zurück zu Tickets
            </Link>

            {canEditTicket && (
              <button
                type="button"
                onClick={openEditModal}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                Bearbeiten
              </button>
            )}

            {ticket.status !== "closed" && canCloseTicket && (
              <button
                type="button"
                onClick={() => void updateTicketStatus("closed")}
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-bold"
              >
                Schließen
              </button>
            )}

            {ticket.status === "closed" && canEditTicket && (
              <button
                type="button"
                onClick={() => void updateTicketStatus("open")}
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-bold"
              >
                Wieder öffnen
              </button>
            )}

            {canDeleteTicket && (
              <button
                type="button"
                onClick={() => void handleDeleteTicket()}
                disabled={saving}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition disabled:opacity-50 font-bold"
              >
                Löschen
              </button>
            )}
          </>
        }
      />

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
          label="Status"
          value={getStatusLabel(ticket.status)}
          description="Aktueller Bearbeitungsstatus"
          icon="â—"
          tone={getStatusTone(ticket.status)}
        />

        <StatCard
          label="Priorität"
          value={getPriorityLabel(ticket.priority)}
          description="Wichtigkeit des Tickets"
          icon="⚡"
          tone={getPriorityTone(ticket.priority)}
        />

        <StatCard
          label="Alter"
          value={getTicketAgeLabel(ticket.createdAt)}
          description="Seit Erstellung"
          icon="â±"
          tone="purple"
        />

        <StatCard
          label="Tags"
          value={tags.length}
          description="Vordefinierte Tags"
          icon="#âƒ£"
          tone="indigo"
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          <article className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Ticketdetails
                  </h2>
                  <p className="text-zinc-500 mt-1">
                    Stammdaten, Beschreibung und Zuordnung des Tickets.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-sm px-3 py-2 rounded-xl border font-bold ${getStatusClass(
                      ticket.status,
                    )}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>

                  <span
                    className={`text-sm px-3 py-2 rounded-xl border font-bold ${getPriorityClass(
                      ticket.priority,
                    )}`}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Firma
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {companyName}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Abteilung
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {departmentName}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Kategorie
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {ticketCategory}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Zugewiesen an
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {ticket.assignedTo || "Nicht zugewiesen"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Erstellt von
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {ticket.createdBy || "System"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-5">
                  <p className="text-sm text-zinc-400">
                    Aktualisiert
                  </p>
                  <p className="font-black mt-1 line-clamp-1">
                    {ticket.updatedAt || "Unbekannt"}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-100">
                <h3 className="text-xl font-black">
                  Beschreibung
                </h3>

                <p className="text-zinc-700 mt-4 whitespace-pre-wrap leading-8 text-lg">
                  {ticket.description || "Keine Beschreibung vorhanden."}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-100">
                <h3 className="text-xl font-black">
                  Tags
                </h3>

                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.length === 0 && (
                    <span className="text-sm bg-zinc-100 text-zinc-500 px-3 py-2 rounded-xl">
                      Keine Tags
                    </span>
                  )}

                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tickets?tag=${encodeURIComponent(tag)}`}
                      className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <TicketComments
            ticketId={ticket.id}
            editable={canCommentTicket}
          />

          <TicketFileList
            ticketId={ticket.id}
            editable={canEditTicket}
          />
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Schnellaktionen
              </h2>
              <p className="text-zinc-500 mt-1">
                Ticket bearbeiten, schließen oder ähnliche Tickets öffnen.
              </p>

              <div className="space-y-3 mt-6">
                {canEditTicket && (
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="w-full flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                  >
                    <span>Ticket bearbeiten</span>
                    <span>→</span>
                  </button>
                )}

                {ticket.status !== "closed" && canCloseTicket && (
                  <button
                    type="button"
                    onClick={() => void updateTicketStatus("closed")}
                    disabled={saving}
                    className="w-full flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition disabled:opacity-50 font-bold"
                  >
                    <span>Ticket schließen</span>
                    <span>→</span>
                  </button>
                )}

                {ticket.status === "closed" && canEditTicket && (
                  <button
                    type="button"
                    onClick={() => void updateTicketStatus("open")}
                    disabled={saving}
                    className="w-full flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition disabled:opacity-50 font-bold"
                  >
                    <span>Ticket wieder öffnen</span>
                    <span>→</span>
                  </button>
                )}

                <Link
                  href={`/tickets?category=${encodeURIComponent(ticketCategory)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Kategorie öffnen</span>
                  <span>→</span>
                </Link>

                <Link
                  href={`/tickets?company=${encodeURIComponent(companyName)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Firma öffnen</span>
                  <span>→</span>
                </Link>

                <Link
                  href={`/tickets?department=${encodeURIComponent(departmentName)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Abteilung öffnen</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Stammdaten
            </h2>
            <p className="text-zinc-500 mt-1">
              Technische und organisatorische Daten.
            </p>

            <div className="space-y-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Ticket-ID
                </p>
                <p className="font-black mt-1">
                  #{ticket.id}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Status
                </p>
                <p className="font-black mt-1">
                  {getStatusLabel(ticket.status)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Priorität
                </p>
                <p className="font-black mt-1">
                  {getPriorityLabel(ticket.priority)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Kategorie
                </p>
                <p className="font-black mt-1">
                  {ticketCategory}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Erstellt
                </p>
                <p className="font-black mt-1">
                  {ticket.createdAt || "Unbekannt"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Aktualisiert
                </p>
                <p className="font-black mt-1">
                  {ticket.updatedAt || "Unbekannt"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

