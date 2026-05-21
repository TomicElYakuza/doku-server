"use client";

import Link from "next/link";

import {
  useEffect,
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
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../../lib/ticketActivityHelpers";

import TicketComments from "../../../components/tickets/TicketComments";

import TicketFileList from "../../../components/tickets/TicketFileList";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../types/ticket";

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

export default function TicketDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    String(
      params.id ||
        ""
    );

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [status, setStatus] =
    useState<TicketStatus>("open");

  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadTicket();

    function handleTicketsUpdated() {
      void loadTicket();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );
    };
  }, [
    id,
  ]);

  async function loadTicket() {
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

      const nextTicket =
        await ticketRepository.findById(
          id
        );

      setTicket(
        nextTicket
      );

      if (!nextTicket) {
        setError(
          "Ticket wurde nicht gefunden."
        );

        return;
      }

      setStatus(
        nextTicket.status
      );

      setPriority(
        nextTicket.priority
      );
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

  async function handleQuickSave() {
    if (!ticket) {
      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, dieses Ticket zu bearbeiten."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const updatedTicket =
        await ticketRepository.update(
          ticket.id,
          {
            status,

            priority,
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
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
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

  async function handleDelete() {
    if (!ticket) {
      return;
    }

    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, dieses Ticket zu löschen."
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

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Ticket konnte nicht gelöscht werden."
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
      <div className="space-y-6">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>

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

      <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
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
                {ticket.company ||
                  "Intern"}
              </span>

              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {ticket.department ||
                  "Allgemein"}
              </span>
            </div>

            <h1 className="text-4xl font-bold mt-5">
              #{ticket.id} · {ticket.title}
            </h1>

            <p className="text-zinc-500 mt-3 whitespace-pre-wrap">
              {ticket.description ||
                "Keine Beschreibung vorhanden."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {canEdit() && (
              <button
                type="button"
                onClick={() =>
                  void handleQuickSave()
                }
                disabled={saving}
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {saving
                  ? "Speichert..."
                  : "Änderungen speichern"}
              </button>
            )}

            {canDelete() && (
              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
              >
                Löschen
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-8">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Status
            </p>

            {canEdit() ? (
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TicketStatus
                  )
                }
                className="w-full mt-2 border border-zinc-200 rounded-xl px-3 py-2 bg-white"
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
            ) : (
              <p className="font-semibold mt-2">
                {getStatusLabel(
                  ticket.status
                )}
              </p>
            )}
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Priorität
            </p>

            {canEdit() ? (
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as TicketPriority
                  )
                }
                className="w-full mt-2 border border-zinc-200 rounded-xl px-3 py-2 bg-white"
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
            ) : (
              <p className="font-semibold mt-2">
                {getPriorityLabel(
                  ticket.priority
                )}
              </p>
            )}
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Zugewiesen an
            </p>

            <p className="font-semibold mt-2">
              {ticket.assignedTo ||
                "Niemand"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Kategorie
            </p>

            <p className="font-semibold mt-2">
              {ticket.category ||
                "Allgemein"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-8">
          <span>
            Erstellt von:{" "}
            {ticket.createdBy ||
              "System"}
          </span>

          <span>
            Erstellt:{" "}
            {ticket.createdAt}
          </span>

          <span>
            Aktualisiert:{" "}
            {ticket.updatedAt}
          </span>
        </div>

        {ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {ticket.tags.map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              )
            )}
          </div>
        )}
      </article>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <TicketFileList
          ticketId={ticket.id}
          editable={canEdit()}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <TicketComments
          ticketId={ticket.id}
          editable={canEdit()}
        />
      </div>
    </div>
  );
}