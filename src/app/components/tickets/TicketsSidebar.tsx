"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  ticketRepository,
} from "../../../lib/ticketRepository";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

type TicketsSidebarProps = {
  className?: string;
};

type SidebarFilter = {
  label: string;
  href: string;
  count: number;
  active: boolean;
};

function getPriorityFilterHref(
  priority: TicketPriority
) {
  return `/tickets?priority=${priority}`;
}

function getStatusFilterHref(
  status: TicketStatus
) {
  return `/tickets?status=${status}`;
}

function getBaseLinkClass(
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
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  useEffect(() => {
    loadTickets();

    function handleTicketsUpdated() {
      loadTickets();
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

  function loadTickets() {
    setTickets(
      ticketRepository.list()
    );
  }

  const statusParam =
    searchParams.get("status") || "";

  const priorityParam =
    searchParams.get("priority") || "";

  const showClosedParam =
    searchParams.get("showClosed") || "";

  const activeAll =
    pathname === "/tickets" &&
    !statusParam &&
    !priorityParam;

  const openTickets =
    tickets.filter(
      (ticket) =>
        ticket.status !== "closed"
    );

  const closedTickets =
    tickets.filter(
      (ticket) =>
        ticket.status === "closed"
    );

  const highOrUrgentTickets =
    tickets.filter(
      (ticket) =>
        ticket.priority === "high" ||
        ticket.priority === "urgent"
    );

  const statusFilters: SidebarFilter[] =
    useMemo(
      () => [
        {
          label:
            "Offen",

          href:
            getStatusFilterHref(
              "open"
            ),

          count:
            ticketRepository.countByStatus(
              "open"
            ),

          active:
            statusParam === "open",
        },
        {
          label:
            "In Bearbeitung",

          href:
            getStatusFilterHref(
              "in_progress"
            ),

          count:
            ticketRepository.countByStatus(
              "in_progress"
            ),

          active:
            statusParam === "in_progress",
        },
        {
          label:
            "Wartend",

          href:
            getStatusFilterHref(
              "waiting"
            ),

          count:
            ticketRepository.countByStatus(
              "waiting"
            ),

          active:
            statusParam === "waiting",
        },
        {
          label:
            "Erledigt",

          href:
            getStatusFilterHref(
              "done"
            ),

          count:
            ticketRepository.countByStatus(
              "done"
            ),

          active:
            statusParam === "done",
        },
        {
          label:
            "Geschlossen",

          href:
            "/tickets?status=closed&showClosed=true",

          count:
            closedTickets.length,

          active:
            statusParam === "closed" ||
            showClosedParam === "true",
        },
      ],
      [
        statusParam,
        showClosedParam,
        tickets,
        closedTickets.length,
      ]
    );

  const priorityFilters: SidebarFilter[] =
    useMemo(
      () => [
        {
          label:
            ticketRepository.getPriorityLabel(
              "urgent"
            ),

          href:
            getPriorityFilterHref(
              "urgent"
            ),

          count:
            ticketRepository.countByPriority(
              "urgent"
            ),

          active:
            priorityParam === "urgent",
        },
        {
          label:
            ticketRepository.getPriorityLabel(
              "high"
            ),

          href:
            getPriorityFilterHref(
              "high"
            ),

          count:
            ticketRepository.countByPriority(
              "high"
            ),

          active:
            priorityParam === "high",
        },
        {
          label:
            ticketRepository.getPriorityLabel(
              "medium"
            ),

          href:
            getPriorityFilterHref(
              "medium"
            ),

          count:
            ticketRepository.countByPriority(
              "medium"
            ),

          active:
            priorityParam === "medium",
        },
        {
          label:
            ticketRepository.getPriorityLabel(
              "low"
            ),

          href:
            getPriorityFilterHref(
              "low"
            ),

          count:
            ticketRepository.countByPriority(
              "low"
            ),

          active:
            priorityParam === "low",
        },
      ],
      [
        priorityParam,
        tickets,
      ]
    );

  const latestTickets =
    [
      ...tickets,
    ]
      .sort(
        (a, b) =>
          new Date(
            b.updatedAt
          ).getTime() -
          new Date(
            a.updatedAt
          ).getTime()
      )
      .slice(
        0,
        5
      );

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">
              Tickets
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Übersicht & Filter
            </p>
          </div>

          <span className="h-11 w-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
            ◆
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Offen
            </p>

            <p className="text-2xl font-bold mt-1">
              {openTickets.length}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Dringend
            </p>

            <p className="text-2xl font-bold mt-1">
              {highOrUrgentTickets.length}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/tickets"
            className={getBaseLinkClass(
              activeAll
            )}
          >
            <span>
              Alle Tickets
            </span>

            <span className={getBadgeClass(activeAll)}>
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
            (filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className={getBaseLinkClass(
                  filter.active
                )}
              >
                <span>
                  {filter.label}
                </span>

                <span className={getBadgeClass(filter.active)}>
                  {filter.count}
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Priorität
        </h3>

        <div className="space-y-1 mt-4">
          {priorityFilters.map(
            (filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className={getBaseLinkClass(
                  filter.active
                )}
              >
                <span>
                  {filter.label}
                </span>

                <span className={getBadgeClass(filter.active)}>
                  {filter.count}
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold">
            Zuletzt aktualisiert
          </h3>

          <span className="text-xs text-zinc-400">
            {latestTickets.length}
          </span>
        </div>

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
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-zinc-400">
                    #{ticket.id}
                  </span>

                  <span className={`text-[11px] px-2 py-1 rounded-full ${ticketRepository.getStatusClass(ticket.status)}`}>
                    {ticketRepository.getStatusLabel(
                      ticket.status
                    )}
                  </span>
                </div>

                <p className="font-medium mt-2 line-clamp-2">
                  {ticket.title}
                </p>

                <p className="text-xs text-zinc-500 mt-2">
                  {ticket.updatedAt}
                </p>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}