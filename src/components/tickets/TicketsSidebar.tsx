"use client";

import Link from "next/link";

import {
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

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../types/ticket";

type TicketsSidebarProps = {
  className?: string;
};

function getLinkClass(
  active: boolean
) {
  if (active) {
    return "flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white";
  }

  return "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition";
}

function getBadgeClass(
  active: boolean
) {
  if (active) {
    return "rounded-full bg-white/15 px-2.5 py-1 text-xs text-white";
  }

  return "rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500";
}

export default function TicketsSidebar({
  className = "",
}: TicketsSidebarProps) {
  const searchParams =
    useSearchParams();

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void loadTickets();

    function handleTicketsUpdated() {
      void loadTickets();
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
  }, []);

  async function loadTickets() {
    try {
      setLoading(
        true
      );

      const nextTickets =
        await ticketRepository.list();

      setTickets(
        Array.isArray(
          nextTickets
        )
          ? nextTickets
          : []
      );
    } catch (error) {
      console.error(
        "Tickets konnten nicht geladen werden:",
        error
      );

      setTickets(
        []
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const statusParam =
    searchParams.get("status") || "";

  const priorityParam =
    searchParams.get("priority") || "";

  const counts =
    useMemo(
      () => {
        return {
          open:
            tickets.filter(
              (ticket) =>
                ticket.status === "open"
            ).length,

          in_progress:
            tickets.filter(
              (ticket) =>
                ticket.status === "in_progress"
            ).length,

          waiting:
            tickets.filter(
              (ticket) =>
                ticket.status === "waiting"
            ).length,

          done:
            tickets.filter(
              (ticket) =>
                ticket.status === "done"
            ).length,

          closed:
            tickets.filter(
              (ticket) =>
                ticket.status === "closed"
            ).length,

          urgent:
            tickets.filter(
              (ticket) =>
                ticket.priority === "urgent"
            ).length,

          high:
            tickets.filter(
              (ticket) =>
                ticket.priority === "high"
            ).length,

          medium:
            tickets.filter(
              (ticket) =>
                ticket.priority === "medium"
            ).length,

          low:
            tickets.filter(
              (ticket) =>
                ticket.priority === "low"
            ).length,
        };
      },
      [
        tickets,
      ]
    );

  const latestTickets =
    useMemo(
      () =>
        tickets.slice(
          0,
          5
        ),
      [
        tickets,
      ]
    );

  const statusFilters: Array<{
    value: TicketStatus;
    label: string;
    count: number;
  }> = [
    {
      value:
        "open",

      label:
        "Offen",

      count:
        counts.open,
    },
    {
      value:
        "in_progress",

      label:
        "In Bearbeitung",

      count:
        counts.in_progress,
    },
    {
      value:
        "waiting",

      label:
        "Wartend",

      count:
        counts.waiting,
    },
    {
      value:
        "done",

      label:
        "Erledigt",

      count:
        counts.done,
    },
    {
      value:
        "closed",

      label:
        "Geschlossen",

      count:
        counts.closed,
    },
  ];

  const priorityFilters: Array<{
    value: TicketPriority;
    label: string;
    count: number;
  }> = [
    {
      value:
        "urgent",

      label:
        "Dringend",

      count:
        counts.urgent,
    },
    {
      value:
        "high",

      label:
        "Hoch",

      count:
        counts.high,
    },
    {
      value:
        "medium",

      label:
        "Mittel",

      count:
        counts.medium,
    },
    {
      value:
        "low",

      label:
        "Niedrig",

      count:
        counts.low,
    },
  ];

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">
              Tickets
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Support & Aufgaben
            </p>
          </div>

          <span className="h-11 w-11 rounded-2xl app-accent-bg text-white flex items-center justify-center">
            🎫
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Gesamt
            </p>

            <p className="text-2xl font-bold mt-1">
              {tickets.length}
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4">
            <p className="text-xs text-red-600">
              Hoch/Dringend
            </p>

            <p className="text-2xl font-bold mt-1 text-red-700">
              {counts.high + counts.urgent}
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-zinc-500 mt-5">
            Tickets werden geladen...
          </p>
        )}

        <div className="space-y-1 mt-5">
          <Link
            href="/tickets"
            className={getLinkClass(
              !statusParam &&
              !priorityParam
            )}
          >
            <span>
              Alle Tickets
            </span>

            <span className={getBadgeClass(
              !statusParam &&
              !priorityParam
            )}>
              {tickets.length}
            </span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Status
        </h3>

        <div className="space-y-1 mt-4">
          {statusFilters.map(
            (filter) => {
              const active =
                statusParam === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={`/tickets?status=${filter.value}`}
                  className={getLinkClass(
                    active
                  )}
                >
                  <span>
                    {filter.label}
                  </span>

                  <span className={getBadgeClass(active)}>
                    {filter.count}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Priorität
        </h3>

        <div className="space-y-1 mt-4">
          {priorityFilters.map(
            (filter) => {
              const active =
                priorityParam === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={`/tickets?priority=${filter.value}`}
                  className={getLinkClass(
                    active
                  )}
                >
                  <span>
                    {filter.label}
                  </span>

                  <span className={getBadgeClass(active)}>
                    {filter.count}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Letzte Tickets
        </h3>

        <div className="space-y-3 mt-4">
          {latestTickets.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine Tickets vorhanden.
            </p>
          )}

          {latestTickets.map(
            (ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block rounded-2xl border border-zinc-100 p-4 hover:bg-zinc-50 transition"
              >
                <p className="font-medium line-clamp-2">
                  #{ticket.id} · {ticket.title}
                </p>

                <p className="text-xs text-zinc-500 mt-2">
                  {ticket.company ||
                    "Intern"}
                  {" · "}
                  {ticket.department ||
                    "Keine Abteilung"}
                </p>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}


