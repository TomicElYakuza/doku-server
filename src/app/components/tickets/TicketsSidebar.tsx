"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ticketRepository } from "../../../lib/ticketRepository";
import type { Ticket, TicketPriority, TicketStatus } from "../../../types/ticket";

type TicketsSidebarProps = {
  className?: string;
};

type SidebarFilter = {
  label: string;
  href: string;
  count: number;
  active: boolean;
};

const ticketStatuses: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting",
  "done",
  "closed",
];

const ticketPriorities: TicketPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

function getPriorityFilterHref(priority: TicketPriority) {
  return `/tickets?priority=${priority}`;
}

function getStatusFilterHref(status: TicketStatus) {
  if (status === "closed") {
    return "/tickets?status=closed&showClosed=true";
  }

  return `/tickets?status=${status}`;
}

function getBaseLinkClass(active: boolean) {
  if (active) {
    return "flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white";
  }

  return "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition";
}

function getBadgeClass(active: boolean) {
  if (active) {
    return "rounded-full bg-white/15 px-2.5 py-1 text-xs text-white";
  }

  return "rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500";
}

export default function TicketsSidebar({ className = "" }: TicketsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusParam = searchParams.get("status") || "";
  const priorityParam = searchParams.get("priority") || "";
  const showClosedParam = searchParams.get("showClosed") || "";

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        setIsLoading(true);

        const nextTickets = await ticketRepository.list();

        if (!cancelled) {
          setTickets(Array.isArray(nextTickets) ? nextTickets : []);
        }
      } catch (error) {
        console.error("TicketsSidebar konnte Tickets nicht laden:", error);

        if (!cancelled) {
          setTickets([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    function handleTicketsUpdated() {
      void loadTickets();
    }

    void loadTickets();

    window.addEventListener("ticketsUpdated", handleTicketsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("ticketsUpdated", handleTicketsUpdated);
    };
  }, []);

  const activeAll = pathname === "/tickets" && !statusParam && !priorityParam;

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "closed"),
    [tickets]
  );

  const closedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === "closed"),
    [tickets]
  );

  const highOrUrgentTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) => ticket.priority === "high" || ticket.priority === "urgent"
      ),
    [tickets]
  );

  const statusFilters: SidebarFilter[] = useMemo(
    () =>
      ticketStatuses.map((status) => ({
        label: ticketRepository.getStatusLabel(status),
        href: getStatusFilterHref(status),
        count: tickets.filter((ticket) => ticket.status === status).length,
        active:
          status === "closed"
            ? statusParam === "closed" || showClosedParam === "true"
            : statusParam === status,
      })),
    [tickets, statusParam, showClosedParam]
  );

  const priorityFilters: SidebarFilter[] = useMemo(
    () =>
      ticketPriorities.map((priority) => ({
        label: ticketRepository.getPriorityLabel(priority),
        href: getPriorityFilterHref(priority),
        count: tickets.filter((ticket) => ticket.priority === priority).length,
        active: priorityParam === priority,
      })),
    [tickets, priorityParam]
  );

  const latestTickets = useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [tickets]
  );

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Tickets</h2>
            <p className="text-sm text-zinc-500">Übersicht & Filter</p>
          </div>

          <span className="rounded-2xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white">
            ◆
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Offen</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">
              {openTickets.length}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Dringend</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">
              {highOrUrgentTickets.length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Link href="/tickets" className={getBaseLinkClass(activeAll)}>
          <span>Alle Tickets</span>
          <span className={getBadgeClass(activeAll)}>
            {isLoading ? "…" : tickets.length}
          </span>
        </Link>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Status
        </h3>

        <div className="space-y-1">
          {statusFilters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className={getBaseLinkClass(filter.active)}
            >
              <span>{filter.label}</span>
              <span className={getBadgeClass(filter.active)}>
                {isLoading ? "…" : filter.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Priorität
        </h3>

        <div className="space-y-1">
          {priorityFilters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className={getBaseLinkClass(filter.active)}
            >
              <span>{filter.label}</span>
              <span className={getBadgeClass(filter.active)}>
                {isLoading ? "…" : filter.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 px-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Zuletzt aktualisiert
          </h3>
          <span className="text-xs text-zinc-400">{latestTickets.length}</span>
        </div>

        {latestTickets.length === 0 && (
          <p className="px-2 py-3 text-sm text-zinc-500">
            Noch keine Tickets vorhanden.
          </p>
        )}

        <div className="space-y-2">
          {latestTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block rounded-2xl px-3 py-3 transition hover:bg-zinc-50"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span>#{ticket.id}</span>
                <span>{ticketRepository.getStatusLabel(ticket.status)}</span>
              </div>

              <p className="line-clamp-2 text-sm font-medium text-zinc-800">
                {ticket.title}
              </p>

              <p className="mt-1 text-xs text-zinc-400">{ticket.updatedAt}</p>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}