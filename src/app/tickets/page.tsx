"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { companyRepository } from "../../lib/companyRepository";
import { ticketRepository } from "../../lib/ticketRepository";
import { canCreate, canDelete, canEdit } from "../../lib/permissions";
import type { Company, Department } from "../../types/company";
import type {
  Ticket,
  TicketCreateInput,
  TicketPriority,
  TicketStatus,
} from "../../types/ticket";

type ViewMode = "cards" | "table";
type LoadState = "idle" | "loading" | "ready" | "error";
type PriorityFilter = "" | TicketPriority | "high_or_urgent";

const TICKETS_VIEW_MODE_KEY = "doku-server:tickets:view-mode";
const TICKETS_SHOW_CLOSED_KEY = "doku-server:tickets:show-closed";

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "table";
  }

  const storedValue = window.localStorage.getItem(TICKETS_VIEW_MODE_KEY);

  return storedValue === "cards" || storedValue === "table"
    ? storedValue
    : "table";
}

function getInitialShowClosedTickets() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(TICKETS_SHOW_CLOSED_KEY) === "true";
}

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getCompanyName(companies: Company[], companyId?: string) {
  if (!companyId) {
    return "";
  }

  return companies.find((company) => company.id === companyId)?.name || "";
}

function getDepartmentName(departments: Department[], departmentId?: string) {
  if (!departmentId) {
    return "";
  }

  return (
    departments.find((department) => department.id === departmentId)?.name || ""
  );
}

export default function TicketsPage() {
  const searchParams = useSearchParams();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showClosedTickets, setShowClosedTickets] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [category, setCategory] = useState("Allgemein");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [company, setCompany] = useState("Intern");
  const [department, setDepartment] = useState("Allgemein");
  const [assignedTo, setAssignedTo] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setViewMode(getInitialViewMode());
    setShowClosedTickets(getInitialShowClosedTickets());
  }, []);

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "";
    const nextPriority = searchParams.get("priority") || "";
    const nextCompany = searchParams.get("company") || "";
    const nextDepartment = searchParams.get("department") || "";
    const nextShowClosed = searchParams.get("showClosed");

    setStatusFilter(nextStatus as TicketStatus | "");
    setPriorityFilter(nextPriority as PriorityFilter);
    setCompanyFilter(nextCompany);
    setDepartmentFilter(nextDepartment);

    if (nextShowClosed === "true") {
      setShowClosedTickets(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoadState("loading");

        const [nextTickets, nextCompanies, nextDepartments] =
          await Promise.all([
            ticketRepository.list(),
            companyRepository.listCompanies(),
            companyRepository.listDepartments(),
          ]);

        if (cancelled) {
          return;
        }

        setTickets(Array.isArray(nextTickets) ? nextTickets : []);
        setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
        setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
        setLoadState("ready");
      } catch (error) {
        console.error("Tickets konnten nicht geladen werden:", error);

        if (!cancelled) {
          setTickets([]);
          setCompanies([]);
          setDepartments([]);
          setLoadState("error");
        }
      }
    }

    function handleDataUpdated() {
      void loadData();
    }

    void loadData();

    window.addEventListener("ticketsUpdated", handleDataUpdated);
    window.addEventListener("companiesUpdated", handleDataUpdated);
    window.addEventListener("departmentsUpdated", handleDataUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("ticketsUpdated", handleDataUpdated);
      window.removeEventListener("companiesUpdated", handleDataUpdated);
      window.removeEventListener("departmentsUpdated", handleDataUpdated);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TICKETS_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(
      TICKETS_SHOW_CLOSED_KEY,
      showClosedTickets ? "true" : "false"
    );
  }, [showClosedTickets]);

  const activeCompanies = useMemo(
    () => companies.filter((item) => item.status === "active"),
    [companies]
  );

  const activeDepartments = useMemo(
    () => departments.filter((item) => item.status === "active"),
    [departments]
  );

  const selectableDepartments = useMemo(() => {
    const source = activeDepartments.length > 0 ? activeDepartments : departments;

    if (!companyId) {
      return source;
    }

    return source.filter((item) => item.companyId === companyId);
  }, [activeDepartments, departments, companyId]);

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "open").length,
    [tickets]
  );

  const progressCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "in_progress").length,
    [tickets]
  );

  const waitingCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "waiting").length,
    [tickets]
  );

  const closedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "closed").length,
    [tickets]
  );

  const urgentCount = useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.priority === "urgent" || ticket.priority === "high"
      ).length,
    [tickets]
  );

  const visibleTicketCount = useMemo(
    () =>
      showClosedTickets
        ? tickets.length
        : tickets.filter((ticket) => ticket.status !== "closed").length,
    [tickets, showClosedTickets]
  );

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const query = normalizeText(search);
        const ticketCompany =
          ticket.company || getCompanyName(companies, ticket.companyId);
        const ticketDepartment =
          ticket.department || getDepartmentName(departments, ticket.departmentId);

        const haystack = [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.category,
          ticket.status,
          ticket.priority,
          ticketCompany,
          ticketDepartment,
          ticket.assignedTo,
          ticket.createdBy,
          ticket.tags?.join(" "),
          ticket.createdAt,
          ticket.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || haystack.includes(query);

        const matchesStatus =
          !statusFilter || ticket.status === statusFilter;

        const matchesPriority =
          !priorityFilter ||
          (priorityFilter === "high_or_urgent" &&
            (ticket.priority === "high" || ticket.priority === "urgent")) ||
          ticket.priority === priorityFilter;

        const matchesCompany =
          !companyFilter ||
          ticket.companyId === companyFilter ||
          ticket.company === companyFilter ||
          ticketCompany === getCompanyName(companies, companyFilter);

        const matchesDepartment =
          !departmentFilter ||
          ticket.departmentId === departmentFilter ||
          ticket.department === departmentFilter ||
          ticketDepartment === getDepartmentName(departments, departmentFilter);

        const matchesClosedVisibility =
          showClosedTickets || statusFilter === "closed" || ticket.status !== "closed";

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesCompany &&
          matchesDepartment &&
          matchesClosedVisibility
        );
      }),
    [
      tickets,
      search,
      statusFilter,
      priorityFilter,
      companyFilter,
      departmentFilter,
      showClosedTickets,
      companies,
      departments,
    ]
  );

  const isLoading = loadState === "idle" || loadState === "loading";

  function getTicketCompany(ticket: Ticket) {
    return ticket.company || getCompanyName(companies, ticket.companyId) || "Intern";
  }

  function getTicketDepartment(ticket: Ticket) {
    return (
      ticket.department ||
      getDepartmentName(departments, ticket.departmentId) ||
      "Allgemein"
    );
  }

  function handleCompanyChange(nextCompanyId: string) {
    setCompanyId(nextCompanyId);

    const selectedCompany = companies.find((item) => item.id === nextCompanyId);
    setCompany(selectedCompany?.name || "Intern");

    const nextDepartments = activeDepartments.filter(
      (item) => item.companyId === nextCompanyId
    );

    const firstDepartment = nextDepartments[0];

    setDepartmentId(firstDepartment?.id || "");
    setDepartment(firstDepartment?.name || "Allgemein");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    setDepartmentId(nextDepartmentId);

    const selectedDepartment = departments.find(
      (item) => item.id === nextDepartmentId
    );

    setDepartment(selectedDepartment?.name || "Allgemein");
  }

  function resetForm() {
    const firstCompany = activeCompanies[0] || companies[0];
    const firstDepartment =
      activeDepartments.find((item) => item.companyId === firstCompany?.id) ||
      departments.find((item) => item.companyId === firstCompany?.id) ||
      activeDepartments[0] ||
      departments[0];

    setEditingId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory("Allgemein");
    setCompanyId(firstCompany?.id || "");
    setDepartmentId(firstDepartment?.id || "");
    setCompany(firstCompany?.name || "Intern");
    setDepartment(firstDepartment?.name || "Allgemein");
    setAssignedTo("");
    setCreatedBy("");
    setTags("");
    setShowForm(false);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function startEditTicket(ticket: Ticket) {
    setEditingId(ticket.id);
    setTitle(ticket.title);
    setDescription(ticket.description);
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setCategory(ticket.category);
    setCompanyId(ticket.companyId || "");
    setDepartmentId(ticket.departmentId || "");
    setCompany(ticket.company || "Intern");
    setDepartment(ticket.department || "Allgemein");
    setAssignedTo(ticket.assignedTo || "");
    setCreatedBy(ticket.createdBy || "");
    setTags(ticket.tags?.join(", ") || "");
    setShowForm(true);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  async function reloadTickets() {
    const nextTickets = await ticketRepository.list();
    setTickets(Array.isArray(nextTickets) ? nextTickets : []);
  }

  async function handleSaveTicket() {
    if (!canCreate() && !editingId) {
      alert("Du hast keine Berechtigung, Tickets zu erstellen.");
      return;
    }

    if (!canEdit() && editingId) {
      alert("Du hast keine Berechtigung, Tickets zu bearbeiten.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    const selectedCompanyName =
      getCompanyName(companies, companyId) || company.trim() || "Intern";

    const selectedDepartmentName =
      getDepartmentName(departments, departmentId) ||
      department.trim() ||
      "Allgemein";

    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const ticketData: TicketCreateInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      category: category.trim() || "Allgemein",
      companyId,
      departmentId,
      company: selectedCompanyName,
      department: selectedDepartmentName,
      assignedTo: assignedTo.trim(),
      createdBy: createdBy.trim(),
      tags: tagList,
    };

    try {
      setSaving(true);

      if (editingId) {
        await ticketRepository.update(editingId, ticketData);
      } else {
        await ticketRepository.create(ticketData);
      }

      await reloadTickets();
      resetForm();
    } catch (error) {
      console.error("Ticket konnte nicht gespeichert werden:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Ticket konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTicket(ticket: Ticket) {
    if (!canDelete()) {
      alert("Du hast keine Berechtigung, Tickets zu löschen.");
      return;
    }

    const confirmed = window.confirm(
      `Ticket "${ticket.title}" wirklich löschen?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await ticketRepository.delete(ticket.id);
      await reloadTickets();
    } catch (error) {
      console.error("Ticket konnte nicht gelöscht werden:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Ticket konnte nicht gelöscht werden."
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Ticketsystem</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Tickets
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Supportfälle, Aufgaben und interne Anfragen verwalten.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Alle anzeigen
            </button>

            {canCreate() && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Ticket erstellen
              </button>
            )}
          </div>
        </div>
      </section>

      {loadState === "error" && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Tickets konnten nicht geladen werden. Prüfe API und Datenbank.
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-zinc-50"
        >
          <p className="text-sm text-zinc-500">Gesamt</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : tickets.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("open")}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-blue-50"
        >
          <p className="text-sm text-zinc-500">Offen</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : openCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("in_progress")}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-indigo-50"
        >
          <p className="text-sm text-zinc-500">In Bearbeitung</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : progressCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("waiting")}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-yellow-50"
        >
          <p className="text-sm text-zinc-500">Wartend</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : waitingCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter("high_or_urgent")}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-red-50"
        >
          <p className="text-sm text-zinc-500">Hoch/Dringend</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : urgentCount}
          </p>
        </button>
      </section>

      {showForm && (
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                {editingId ? `Ticket #${editingId} bearbeiten` : "Ticket erstellen"}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Tickets sind für echte Firmen- und Abteilungs-IDs vorbereitet.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm transition hover:bg-zinc-50"
            >
              Schließen
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Titel
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Kurzer Titel"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Kategorie
              </label>
              <input
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="IT, Benutzer, Dokumentation..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TicketStatus)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
              >
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="waiting">Wartend</option>
                <option value="done">Erledigt</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Priorität
              </label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TicketPriority)
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Firma
              </label>
              <select
                value={companyId}
                onChange={(event) => handleCompanyChange(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
              >
                <option value="">Firma auswählen</option>
                {(activeCompanies.length > 0 ? activeCompanies : companies).map(
                  (item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Abteilung
              </label>
              <select
                value={departmentId}
                onChange={(event) => handleDepartmentChange(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
              >
                <option value="">Abteilung auswählen</option>
                {selectableDepartments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Zugewiesen an
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Erstellt von
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(event) => setCreatedBy(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Beschreibung des Tickets..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="kommagetrennt, z. B. drucker, netzwerk"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-medium transition hover:bg-zinc-100"
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={handleSaveTicket}
              disabled={saving}
              className="rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingId
                  ? "Änderungen speichern"
                  : "Ticket erstellen"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Suche & Filter
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Filtere Tickets nach ID, Text, Status, Priorität, Firma und
              Abteilung.
            </p>
          </div>

          <div className="flex gap-2 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                viewMode === "cards"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                viewMode === "table"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suche nach ID, Titel, Beschreibung, Kategorie, Firma, Abteilung oder Tag..."
            className="rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500 md:col-span-2"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TicketStatus | "")
            }
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Status</option>
            <option value="open">Offen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="waiting">Wartend</option>
            <option value="done">Erledigt</option>
            <option value="closed">Geschlossen</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as PriorityFilter)
            }
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Prioritäten</option>
            <option value="high_or_urgent">Hoch/Dringend</option>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="urgent">Dringend</option>
          </select>

          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Firmen</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Abteilungen</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            {isLoading
              ? "Tickets werden geladen..."
              : `${filteredTickets.length} von ${visibleTicketCount} sichtbaren Tickets gefunden`}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowClosedTickets(!showClosedTickets)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                showClosedTickets
                  ? "bg-zinc-950 text-white hover:bg-zinc-800"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {showClosedTickets
                ? "Geschlossene ausblenden"
                : `Geschlossene einblenden (${closedCount})`}
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-200"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </section>

      {viewMode === "cards" && (
        <section className="grid gap-4">
          {!isLoading && filteredTickets.length === 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
              <p className="text-zinc-500">Keine Tickets gefunden.</p>
            </div>
          )}

          {filteredTickets.map((ticket) => {
            const ticketCompany = getTicketCompany(ticket);
            const ticketDepartment = getTicketDepartment(ticket);

            return (
              <article
                key={ticket.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {ticketRepository.getStatusLabel(ticket.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getPriorityClass(
                          ticket.priority
                        )}`}
                      >
                        {ticketRepository.getPriorityLabel(ticket.priority)}
                      </span>

                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
                        {ticket.category}
                      </span>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        {ticketCompany}
                      </span>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                        {ticketDepartment}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="font-mono text-xs text-zinc-400">
                        ID: {ticket.id}
                      </p>

                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="mt-1 inline-block text-2xl font-bold text-zinc-950 transition hover:text-zinc-600"
                      >
                        {ticket.title}
                      </Link>
                    </div>

                    <p className="mt-2 text-zinc-500">
                      {ticket.description || "Keine Beschreibung"}
                    </p>

                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ticket.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-6 text-sm text-zinc-500">
                      <p>Erstellt: {formatDateTime(ticket.createdAt)}</p>
                      <p>Aktualisiert: {formatDateTime(ticket.updatedAt)}</p>
                      {ticket.assignedTo && <p>Zuständig: {ticket.assignedTo}</p>}
                      {ticket.createdBy && <p>Von: {ticket.createdBy}</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-3">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm transition hover:bg-zinc-100"
                    >
                      Öffnen
                    </Link>

                    {canEdit() && (
                      <button
                        type="button"
                        onClick={() => startEditTicket(ticket)}
                        className="rounded-xl bg-zinc-950 px-4 py-2 text-sm text-white transition hover:bg-zinc-800"
                      >
                        Bearbeiten
                      </button>
                    )}

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteTicket(ticket)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-500"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {viewMode === "table" && (
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-5 py-4 font-semibold">ID</th>
                  <th className="px-5 py-4 font-semibold">Ticket</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priorität</th>
                  <th className="px-5 py-4 font-semibold">Kategorie</th>
                  <th className="px-5 py-4 font-semibold">Firma</th>
                  <th className="px-5 py-4 font-semibold">Abteilung</th>
                  <th className="px-5 py-4 font-semibold">Zuständig</th>
                  <th className="px-5 py-4 font-semibold">Aktualisiert</th>
                  <th className="px-5 py-4 text-right font-semibold">Aktionen</th>
                </tr>
              </thead>

              <tbody>
                {!isLoading && filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-zinc-500">
                      Keine Tickets gefunden.
                    </td>
                  </tr>
                )}

                {filteredTickets.map((ticket) => {
                  const ticketCompany = getTicketCompany(ticket);
                  const ticketDepartment = getTicketDepartment(ticket);

                  return (
                    <tr
                      key={ticket.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-zinc-500">
                        {ticket.id}
                      </td>

                      <td className="min-w-[260px] px-5 py-4">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-semibold text-zinc-950 transition hover:text-zinc-600"
                        >
                          {ticket.title}
                        </Link>

                        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                          {ticket.description || "Keine Beschreibung"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {ticketRepository.getStatusLabel(ticket.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${ticketRepository.getPriorityClass(
                            ticket.priority
                          )}`}
                        >
                          {ticketRepository.getPriorityLabel(ticket.priority)}
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
                        {ticket.assignedTo || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-zinc-500">
                        {formatDateTime(ticket.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:bg-zinc-100"
                          >
                            Öffnen
                          </Link>

                          {canEdit() && (
                            <button
                              type="button"
                              onClick={() => startEditTicket(ticket)}
                              className="rounded-xl bg-zinc-950 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                            >
                              Bearbeiten
                            </button>
                          )}

                          {canDelete() && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteTicket(ticket)}
                              className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-500"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}