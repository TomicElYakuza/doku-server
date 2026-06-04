"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ticketRepository,
} from "../../../lib/ticketRepository";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import {
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../../lib/ticketActivityHelpers";

import {
  usePermissions,
} from "../../../hooks/usePermissions";

import PageHero from "../../../components/PageHero";

import StatCard from "../../../components/StatCard";

import TicketComments from "../../../components/tickets/TicketComments";

import TicketFileList from "../../../components/tickets/TicketFileList";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../types/ticket";

import type {
  Company,
  Department,
} from "../../../types/company";

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

function formatTags(
  tags?: string[]
) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(Boolean);
}

function getTicketAgeLabel(
  createdAt?: string
) {
  if (!createdAt) {
    return "Unbekannt";
  }

  const createdDate =
    new Date(
      createdAt
    );

  if (
    Number.isNaN(
      createdDate.getTime()
    )
  ) {
    return createdAt;
  }

  const diffMs =
    Date.now() -
    createdDate.getTime();

  const diffDays =
    Math.max(
      0,
      Math.floor(
        diffMs /
        (
          1000 *
          60 *
          60 *
          24
        )
      )
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
  const params =
    useParams();

  const router =
    useRouter();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const id =
    String(
      params.id ||
        ""
    );

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

  const [ticket, setTicket] =
    useState<Ticket | null>(
      null
    );

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

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
    };
  }, [
    id,
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

  async function loadData() {
    if (!id) {
      return;
    }

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
      ] =
        await Promise.all([
          ticketRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      const foundTicket =
        Array.isArray(
          nextTickets
        )
          ? nextTickets.find(
              (item) =>
                String(
                  item.id
                ) === id
            ) ||
            null
          : null;

      setTicket(
        foundTicket
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

      if (!foundTicket) {
        setError(
          "Ticket wurde nicht gefunden."
        );
      }
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ticket konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function getCompanyName(
    companyId?: string
  ) {
    if (!companyId) {
      return ticket?.company ||
        "Intern";
    }

    return (
      companies.find(
        (company) =>
          company.id === companyId
      )?.name ||
      ticket?.company ||
      "Intern"
    );
  }

  function getDepartmentName(
    departmentId?: string
  ) {
    if (!departmentId) {
      return ticket?.department ||
        "Allgemein";
    }

    return (
      departments.find(
        (department) =>
          department.id === departmentId
      )?.name ||
      ticket?.department ||
      "Allgemein"
    );
  }

  function userCanSeeTicket(
    currentTicket: Ticket
  ) {
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

  const tags =
    useMemo(
      () =>
        formatTags(
          ticket?.tags
        ),
      [
        ticket,
      ]
    );

  async function updateTicketStatus(
    nextStatus: TicketStatus
  ) {
    if (!ticket) {
      return;
    }

    if (
      nextStatus === "closed" &&
      !canCloseTicket
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu schließen."
      );

      return;
    }

    if (
      nextStatus !== "closed" &&
      !canEditTicket
    ) {
      alert(
        "Du hast keine Berechtigung, Tickets zu bearbeiten."
      );

      return;
    }

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

      const updatedTicket =
        await ticketRepository.update(
          ticket.id,
          {
            status:
              nextStatus,
          }
        );

      if (updatedTicket) {
        saveTicketUpdatedActivity(
          updatedTicket
        );

        setTicket(
          updatedTicket
        );
      }

      setMessage(
        nextStatus === "closed"
          ? "Ticket wurde geschlossen."
          : "Ticketstatus wurde aktualisiert."
      );

      await loadData();
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ticket konnte nicht aktualisiert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeleteTicket() {
    if (!ticket) {
      return;
    }

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
      setSaving(
        true
      );

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

      router.push(
        "/tickets"
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
    } finally {
      setSaving(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
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
            Ticket nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-2">
            {error ||
              "Dieses Ticket existiert nicht."}
          </p>
        </div>
      </div>
    );
  }

  if (
    !userCanSeeTicket(
      ticket
    )
  ) {
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
            Du hast keine Berechtigung, dieses Ticket zu öffnen.
          </p>
        </div>
      </div>
    );
  }

  const companyName =
    getCompanyName(
      ticket.companyId
    );

  const departmentName =
    getDepartmentName(
      ticket.departmentId
    );

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

      <PageHero
        eyebrow="Ticket"
        title={`#${ticket.id} · ${ticket.title}`}
        description={
          ticket.description ||
          "Keine Beschreibung vorhanden."
        }
        badges={[
          {
            label:
              getStatusLabel(
                ticket.status
              ),
          },
          {
            label:
              getPriorityLabel(
                ticket.priority
              ),
          },
          {
            label:
              companyName,
          },
          {
            label:
              departmentName,
          },
        ]}
        actions={(
          <>
            {canEditTicket && (
              <Link
                href="/tickets"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
              >
                In Übersicht bearbeiten
              </Link>
            )}

            {ticket.status !== "closed" && canCloseTicket && (
              <button
                type="button"
                onClick={() =>
                  void updateTicketStatus(
                    "closed"
                  )
                }
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
              >
                Schließen
              </button>
            )}

            {ticket.status === "closed" && canEditTicket && (
              <button
                type="button"
                onClick={() =>
                  void updateTicketStatus(
                    "open"
                  )
                }
                disabled={saving}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
              >
                Wieder öffnen
              </button>
            )}

            {canDeleteTicket && (
              <button
                type="button"
                onClick={() =>
                  void handleDeleteTicket()
                }
                disabled={saving}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition disabled:opacity-50"
              >
                Löschen
              </button>
            )}
          </>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Status"
          value={getStatusLabel(
            ticket.status
          )}
          description="Aktueller Bearbeitungsstand"
          icon="📌"
          tone={
            ticket.status === "closed"
              ? "green"
              : ticket.status === "in_progress"
                ? "orange"
                : "blue"
          }
        />

        <StatCard
          label="Priorität"
          value={getPriorityLabel(
            ticket.priority
          )}
          description="Einstufung des Tickets"
          icon="🚨"
          tone={
            ticket.priority === "urgent" ||
            ticket.priority === "high"
              ? "red"
              : "indigo"
          }
        />

        <StatCard
          label="Alter"
          value={getTicketAgeLabel(
            ticket.createdAt
          )}
          description={`Erstellt: ${ticket.createdAt || "Unbekannt"}`}
          icon="⏱️"
        />

        <StatCard
          label="Zugewiesen"
          value={
            ticket.assignedTo ||
            "Niemand"
          }
          description="Bearbeiter oder Team"
          icon="👤"
          tone="green"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">
              Ticketdetails
            </h2>

            <p className="text-zinc-500 mt-1">
              Stammdaten und Beschreibung des Tickets.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
              ticket.status
            )}`}>
              {getStatusLabel(
                ticket.status
              )}
            </span>

            <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(
              ticket.priority
            )}`}>
              {getPriorityLabel(
                ticket.priority
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-8">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Firma
            </p>

            <p className="font-semibold mt-1">
              {companyName}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Abteilung
            </p>

            <p className="font-semibold mt-1">
              {departmentName}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Kategorie
            </p>

            <p className="font-semibold mt-1">
              {ticket.category ||
                "Allgemein"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Erstellt von
            </p>

            <p className="font-semibold mt-1">
              {ticket.createdBy ||
                "System"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Erstellt
            </p>

            <p className="font-semibold mt-1">
              {ticket.createdAt ||
                "Unbekannt"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Aktualisiert
            </p>

            <p className="font-semibold mt-1">
              {ticket.updatedAt ||
                "Unbekannt"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold">
            Beschreibung
          </h3>

          <div className="mt-3 whitespace-pre-wrap text-zinc-800 leading-8">
            {ticket.description ||
              "Keine Beschreibung vorhanden."}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold">
              Tags
            </h3>

            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <TicketFileList
          ticketId={ticket.id}
          editable={canEditTicket}
        />
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <TicketComments
          ticketId={ticket.id}
        />
      </section>
    </div>
  );
}