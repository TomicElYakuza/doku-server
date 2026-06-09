"use client";

import { adminUserRepository } from "../../../lib/adminUserRepository";

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

import AppModal from "../../../components/AppModal";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import TicketComments from "../../../components/tickets/TicketComments";
import TicketFileList from "../../../components/tickets/TicketFileList";
import {
  usePermissions,
} from "../../../hooks/usePermissions";
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
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../types/ticket";

type TicketAssignableUser = Awaited<ReturnType<typeof adminUserRepository.list>>[number];

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
  if (item.path?.trim()) {
    return item.path.trim();
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

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("de-AT");
  } catch {
    return value;
  }
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
      "tickets.edit",
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

  const canAssignTicket =
    canManageTickets ||
    hasAnyPermission([
      "tickets.assign",
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
  const [users, setUsers] = useState<TicketAssignableUser[]>([]);
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
      if (result.status !== "fulfilled" || !result.value.ok) {
        continue;
      }

      const data = await result.value.json();
      const items: TaxonomyItem[] = Array.isArray(data) ? data : [];

      if (index === 0) {
        nextTicketCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setTicketCategories(
      nextTicketCategories.filter((item) => item.isActive !== false),
    );

    setTicketTags(
      Array.from(
        new Map(
          nextTags
            .filter((item) => item.isActive !== false)
            .map((item) => [
              item.name,
              item,
            ]),
        ).values(),
      ),
    );
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
      void adminUserRepository.list().then((nextUsers: TicketAssignableUser[]) => {
        setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      }).catch((usersError: unknown) => {
        console.error("TicketDetail users konnten nicht geladen werden:", usersError);
      });
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
      void adminUserRepository.list().then((nextUsers: TicketAssignableUser[]) => {
        setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      }).catch((usersError: unknown) => {
        console.error("TicketDetail users konnten nicht geladen werden:", usersError);
      });

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
      return ticket?.company || "Intern";
    }

    return (
      companies.find((nextCompany) => nextCompany.id === nextCompanyId)
        ?.name ||
      ticket?.company ||
      "Intern"
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return ticket?.department || "Keine Abteilung";
    }

    return (
      departments.find(
        (nextDepartment) => nextDepartment.id === nextDepartmentId,
      )?.name ||
      ticket?.department ||
      "Keine Abteilung"
    );
  }

  function userCanSeeTicket(currentTicket: Ticket) {
    if (isAdmin || canManageTickets) {
      return true;
    }

    if (!user || !canViewTickets) {
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
        .map((item) => {
          const label = getTaxonomyLabel(item, ticketCategories);

          return {
            id: item.id,
            value: label,
            label,
          };
        })
        .filter((option) => option.value.trim())
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
        .filter((option) => option.value.trim())
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
        return currentTags.filter((currentTag) => currentTag !== tag);
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

    if (status === "closed" && !canCloseTicket) {
      alert("Du hast keine Berechtigung, Tickets zu schließen.");
      return;
    }

    if (
      ticket.assignedTo !== assignedTo.trim() &&
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
        department: department.trim() || (departmentId ? getDepartmentName(departmentId) : ""),
        assignedTo: assignedTo.trim(),
        createdBy: createdBy.trim() || ticket.createdBy || user?.name || "System",
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

    if (nextStatus === "closed" && !canCloseTicket) {
      alert("Du hast keine Berechtigung, Tickets zu schließen.");
      return;
    }

    if (nextStatus !== "closed" && !canEditTicket) {
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
      <LoadingState
        title="Ticket wird geladen..."
        description="Ticketdaten, Kategorien, Tags und Organisation werden vorbereitet."
      />
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon="🎫"
          title="Ticket nicht gefunden"
          description={error || "Dieses Ticket existiert nicht."}
          action={
            <Link
              href="/tickets"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Zurück zu Tickets
            </Link>
          }
        />
      </div>
    );
  }

  if (!userCanSeeTicket(ticket)) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon="🔒"
          title="Kein Zugriff auf dieses Ticket"
          description="Dieses Ticket ist deiner Firma oder Abteilung nicht zugeordnet."
          action={
            <Link
              href="/tickets"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Zurück zu Tickets
            </Link>
          }
        />
      </div>
    );
  }

  const companyName = getCompanyName(ticket.companyId);
  const departmentName = getDepartmentName(ticket.departmentId);
  const ticketCategory = ticket.category || "Nicht gesetzt";

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title="Ticket bearbeiten"
        description="Ticketdaten, Kategorie, Tags, Status und Organisation aktualisieren."
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 font-bold"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="ticket-detail-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </>
        }
      >
        <form
          id="ticket-detail-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-bold">
              Titel
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="Ticket-Titel"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-bold">
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

                {categoryOptions.length === 0 && (
                  <option value="" disabled>
                    Bitte zuerst eine aktive Ticket-Kategorie im Admin Backend anlegen.
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
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
              <label className="block mb-2 font-bold">
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
              <label className="block mb-2 font-bold">
                Zugewiesen an
              </label>

              <select
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  disabled={!canAssignTicket}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <option value="">Nicht zugewiesen</option>
                  {users.map((nextUser) => (
                    <option key={nextUser.id} value={nextUser.name}>
                      {nextUser.name} · {nextUser.email}
                    </option>
                  ))}
                </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
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
              <label className="block mb-2 font-bold">
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
              <label className="block mb-2 font-bold">
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

          <div>
            <label className="block mb-2 font-bold">
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
            <label className="block mb-3 font-bold">
              Tags
            </label>

            {tagOptions.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-500">
                Noch keine globalen oder Ticket-Tags im Admin Backend vorhanden.
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
                      className={`px-4 py-2 rounded-xl border transition font-bold ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow"
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
            label: `${tags.length} Tags`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
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
          </div>
        }
      />

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">
            {message}
          </p>
        </section>
      )}

      {error && (
        <section className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <p className="text-red-700 font-bold">
            {error}
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Status"
          value={getStatusLabel(ticket.status)}
          description="Aktueller Bearbeitungsstatus"
          icon="🎫"
          tone="blue"
        />

        <StatCard
          label="Priorität"
          value={getPriorityLabel(ticket.priority)}
          description="Wichtigkeit des Tickets"
          icon="⚡"
          tone="orange"
        />

        <StatCard
          label="Alter"
          value={getTicketAgeLabel(ticket.createdAt)}
          description="Seit Erstellung"
          icon="⏱️"
          tone="purple"
        />

        <StatCard
          label="Tags"
          value={tags.length}
          description="Vordefinierte Tags"
          icon="#️⃣"
          tone="indigo"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <section className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 xl:p-8 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Ticketdetails
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Stammdaten und Beschreibung des Tickets.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${getStatusClass(
                      ticket.status,
                    )}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${getPriorityClass(
                      ticket.priority,
                    )}`}
                  >
                    {getPriorityLabel(ticket.priority)}
                  </span>

                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    {ticketCategory}
                  </span>
                </div>
              </div>

              <article className="mt-8">
                <h1 className="text-3xl xl:text-4xl font-black tracking-[-0.05em] text-zinc-950">
                  {ticket.title}
                </h1>

                <div className="whitespace-pre-wrap text-zinc-700 leading-8 text-lg mt-5">
                  {ticket.description || "Keine Beschreibung vorhanden."}
                </div>
              </article>
            </div>
          </section>

          <TicketFileList
            ticketId={ticket.id}
            editable={canEditTicket}
          />

          <TicketComments
            ticketId={ticket.id}
            editable={canCommentTicket}
          />
        </section>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-xl font-black">
                Übersicht
              </h2>

              <div className="space-y-4 mt-5 text-sm">
                <div>
                  <p className="text-zinc-400">
                    Ticket-ID
                  </p>
                  <p className="font-black text-zinc-800">
                    #{ticket.id}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Firma
                  </p>
                  <p className="font-black text-zinc-800">
                    {companyName}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Abteilung
                  </p>
                  <p className="font-black text-zinc-800">
                    {departmentName}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Zugewiesen an
                  </p>
                  <p className="font-black text-zinc-800">
                    {ticket.assignedTo || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Erstellt von
                  </p>
                  <p className="font-black text-zinc-800">
                    {ticket.createdBy || "System"}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Erstellt
                  </p>
                  <p className="font-black text-zinc-800">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-400">
                    Aktualisiert
                  </p>
                  <p className="font-black text-zinc-800">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Tags
            </h2>

            <div className="flex flex-wrap gap-2 mt-5">
              {tags.length === 0 && (
                <span className="text-sm bg-zinc-100 text-zinc-500 px-3 py-2 rounded-xl">
                  Keine Tags
                </span>
              )}

              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tickets?tag=${encodeURIComponent(tag)}`}
                  className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-200 transition font-bold"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Schnellfilter
            </h2>

            <div className="space-y-3 mt-5">
              <Link
                href={`/tickets?status=${encodeURIComponent(ticket.status)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition font-bold"
              >
                Gleicher Status
              </Link>

              <Link
                href={`/tickets?priority=${encodeURIComponent(ticket.priority)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition font-bold"
              >
                Gleiche Priorität
              </Link>

              {ticket.category && (
                <Link
                  href={`/tickets?category=${encodeURIComponent(ticket.category)}`}
                  className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition font-bold"
                >
                  Gleiche Kategorie
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}


