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
  first: {
    label: string;
  },
  second: {
    label: string;
  },
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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const id = String(params.id || "");

  const canManageTickets = isAdmin || hasAnyPermission([
    "tickets.manage",
  ]);
  const canViewTickets = canManageTickets || hasAnyPermission([
    "tickets.view",
  ]);
  const canEditTicket = canManageTickets || hasAnyPermission([
    "tickets.edit",
  ]);
  const canDeleteTicket = canManageTickets || hasAnyPermission([
    "tickets.delete",
  ]);
  const canCloseTicket = canManageTickets || hasAnyPermission([
    "tickets.close",
  ]);
  const canCommentTicket = canManageTickets || hasAnyPermission([
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
  const [department, setDepartment] = useState("Allgemein");
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
    if (!id) {
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
      return ticket?.company || "Intern";
    }

    return (
      companies.find((nextCompany) => nextCompany.id === nextCompanyId)?.name ||
      ticket?.company ||
      "Intern"
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return ticket?.department || "Allgemein";
    }

    return (
      departments.find((nextDepartment) => nextDepartment.id === nextDepartmentId)?.name ||
      ticket?.department ||
      "Allgemein"
    );
  }

  function userCanSeeTicket(currentTicket: Ticket) {
    if (isAdmin || canManageTickets) {
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
    setDepartment("Allgemein");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    const selectedDepartment = departments.find(
      (nextDepartment) => nextDepartment.id === nextDepartmentId,
    );

    setDepartmentId(nextDepartmentId);
    setDepartment(selectedDepartment?.name || "Allgemein");
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
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <p className="text-zinc-500">
          Ticket wird geladen...
        </p>
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
          eyebrow="Tickets"
          title="Ticket nicht gefunden"
          description={error || "Dieses Ticket existiert nicht."}
          actions={
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
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
        <PageHero
          eyebrow="Tickets"
          title="Keine Berechtigung"
          description="Du hast keine Berechtigung, dieses Ticket zu öffnen."
          actions={
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
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
  const ticketCategory = ticket.category || "Keine Kategorie";

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        title="Ticket bearbeiten"
        description="Kategorie und Tags kommen aus dem Admin Backend."
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
              form="ticket-detail-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 disabled:bg-zinc-400 transition"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        }
      >
        <form
          id="ticket-detail-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
                Priorität
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
                Zugewiesen an
              </label>
              <input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name oder Team"
              />
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
                  Allgemein
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

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y"
                placeholder="Beschreibung des Tickets..."
              />
            </div>

            <div className="xl:col-span-2">
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
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zu Tickets
            </Link>

            {canEditTicket && (
              <button
                type="button"
                onClick={openEditModal}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Bearbeiten
              </button>
            )}

            {ticket.status !== "closed" && canCloseTicket && (
              <button
                type="button"
                onClick={() => void updateTicketStatus("closed")}
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
              >
                Schließen
              </button>
            )}

            {ticket.status === "closed" && canEditTicket && (
              <button
                type="button"
                onClick={() => void updateTicketStatus("open")}
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
              >
                Wieder öffnen
              </button>
            )}

            {canDeleteTicket && (
              <button
                type="button"
                onClick={() => void handleDeleteTicket()}
                disabled={saving}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition disabled:opacity-50"
              >
                Löschen
              </button>
            )}
          </div>
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
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Ticketdetails
                </h2>
                <p className="text-zinc-500 mt-1">
                  Stammdaten und Beschreibung des Tickets.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-sm px-3 py-2 rounded-xl ${getStatusClass(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
                <span className={`text-sm px-3 py-2 rounded-xl ${getPriorityClass(ticket.priority)}`}>
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Firma
                </p>
                <p className="font-semibold mt-1">
                  {companyName}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Abteilung
                </p>
                <p className="font-semibold mt-1">
                  {departmentName}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Kategorie
                </p>
                <p className="font-semibold mt-1">
                  {ticketCategory}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Zugewiesen an
                </p>
                <p className="font-semibold mt-1">
                  {ticket.assignedTo || "Nicht zugewiesen"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Erstellt von
                </p>
                <p className="font-semibold mt-1">
                  {ticket.createdBy || "System"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Aktualisiert
                </p>
                <p className="font-semibold mt-1">
                  {ticket.updatedAt || "Unbekannt"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold">
                Beschreibung
              </h3>
              <p className="text-zinc-700 mt-3 whitespace-pre-wrap leading-7">
                {ticket.description || "Keine Beschreibung vorhanden."}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold">
                Tags
              </h3>

              <div className="flex flex-wrap gap-2 mt-3">
                {tags.length === 0 && (
                  <span className="text-sm bg-zinc-100 text-zinc-500 px-3 py-2 rounded-xl">
                    Keine Tags
                  </span>
                )}

                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tickets?tag=${encodeURIComponent(tag)}`}
                    className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-200 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>

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
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Schnellaktionen
            </h2>

            <div className="space-y-3 mt-5">
              {canEditTicket && (
                <button
                  type="button"
                  onClick={openEditModal}
                  className="w-full text-left bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
                >
                  Ticket bearbeiten
                </button>
              )}

              {ticket.status !== "closed" && canCloseTicket && (
                <button
                  type="button"
                  onClick={() => void updateTicketStatus("closed")}
                  disabled={saving}
                  className="w-full text-left bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition disabled:opacity-50"
                >
                  Ticket schließen
                </button>
              )}

              {ticket.status === "closed" && canEditTicket && (
                <button
                  type="button"
                  onClick={() => void updateTicketStatus("open")}
                  disabled={saving}
                  className="w-full text-left bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition disabled:opacity-50"
                >
                  Ticket wieder öffnen
                </button>
              )}

              <Link
                href={`/tickets?category=${encodeURIComponent(ticketCategory)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Gleiche Kategorie öffnen
              </Link>

              <Link
                href={`/tickets?company=${encodeURIComponent(companyName)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Gleiche Firma öffnen
              </Link>

              <Link
                href={`/tickets?department=${encodeURIComponent(departmentName)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Gleiche Abteilung öffnen
              </Link>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Stammdaten
            </h2>

            <div className="space-y-4 mt-5 text-sm">
              <div>
                <p className="text-zinc-400">
                  Ticket-ID
                </p>
                <p className="font-medium text-zinc-800">
                  #{ticket.id}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Status
                </p>
                <p className="font-medium text-zinc-800">
                  {getStatusLabel(ticket.status)}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Priorität
                </p>
                <p className="font-medium text-zinc-800">
                  {getPriorityLabel(ticket.priority)}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Kategorie
                </p>
                <p className="font-medium text-zinc-800">
                  {ticketCategory}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Erstellt
                </p>
                <p className="font-medium text-zinc-800">
                  {ticket.createdAt || "Unbekannt"}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Aktualisiert
                </p>
                <p className="font-medium text-zinc-800">
                  {ticket.updatedAt || "Unbekannt"}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}