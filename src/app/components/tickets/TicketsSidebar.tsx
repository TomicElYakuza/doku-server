"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  getTickets,
  getPriorityLabel,
  getStatusLabel,
} from "../../../lib/ticketStorage";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

function SectionTitle({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold app-accent-text uppercase mb-3">
      <span className="text-base leading-none">
        {icon}
      </span>

      <span>
        {title}
      </span>
    </h3>
  );
}

function getListLinkClass(
  active: boolean
) {
  if (active) {
    return "flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 text-white transition";
  }

  return "flex items-center justify-between gap-3 p-3 rounded-xl text-zinc-700 hover:bg-zinc-100 transition";
}

function getTicketLinkClass(
  active: boolean
) {
  if (active) {
    return "block p-3 rounded-xl bg-zinc-900 text-white transition";
  }

  return "block p-3 rounded-xl text-zinc-700 hover:bg-zinc-100 transition";
}

function getStatusHref(
  status: TicketStatus
) {
  return `/tickets?status=${status}`;
}

function getPriorityHref(
  priority: TicketPriority | "high_or_urgent"
) {
  return `/tickets?priority=${priority}`;
}

function getCompanyHref(
  company: string
) {
  return `/tickets?company=${encodeURIComponent(
    company
  )}`;
}

function getDepartmentHref(
  department: string
) {
  return `/tickets?department=${encodeURIComponent(
    department
  )}`;
}

function getTicketCompany(
  ticket: Ticket
) {
  return (
    ticket.company ||
    "Intern"
  );
}

function getTicketDepartment(
  ticket: Ticket
) {
  return (
    ticket.department ||
    "Allgemein"
  );
}

export default function TicketsSidebar() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const activeStatus =
    searchParams.get("status") || "";

  const activePriority =
    searchParams.get("priority") || "";

  const activeCompany =
    searchParams.get("company") || "";

  const activeDepartment =
    searchParams.get("department") || "";

  const [mounted, setMounted] =
    useState(false);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  useEffect(() => {
    setMounted(
      true
    );

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
      getTickets()
    );
  }

  if (!mounted) {
    return null;
  }

  const openCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "open"
    ).length;

  const inProgressCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "in_progress"
    ).length;

  const waitingCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "waiting"
    ).length;

  const doneCount =
    tickets.filter(
      (ticket) =>
        ticket.status === "done"
    ).length;

  const urgentCount =
    tickets.filter(
      (ticket) =>
        ticket.priority === "urgent" ||
        ticket.priority === "high"
    ).length;

  const companies =
    Array.from(
      new Set(
        tickets
          .map(
            (ticket) =>
              getTicketCompany(
                ticket
              )
          )
          .filter(Boolean)
      )
    );

  const departments =
    Array.from(
      new Set(
        tickets
          .map(
            (ticket) =>
              getTicketDepartment(
                ticket
              )
          )
          .filter(Boolean)
      )
    );

  const recentTickets =
    [
      ...tickets,
    ]
      .sort(
        (a, b) =>
          String(b.updatedAt || "")
            .localeCompare(
              String(a.updatedAt || "")
            )
      )
      .slice(
        0,
        5
      );

  return (
    <aside className="w-72 bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6 h-fit">
      <h2 className="text-xl font-bold mb-6">
        Tickets
      </h2>

      {/* ALLE TICKETS */}
      <div className="mb-8">
        <Link
          href="/tickets"
          className={`flex items-center justify-between p-3 rounded-xl transition ${
            pathname === "/tickets" &&
            !activeStatus &&
            !activePriority &&
            !activeCompany &&
            !activeDepartment
              ? "bg-zinc-900 text-white"
              : "hover:bg-zinc-100 text-zinc-700"
          }`}
        >
          <span>
            🎫 Alle Tickets
          </span>

          <span className="text-xs opacity-80">
            {tickets.length}
          </span>
        </Link>
      </div>

      {/* STATUS */}
      <div className="mb-8">
        <SectionTitle
          icon="📌"
          title="Status"
        />

        <div className="flex flex-col gap-1">
          <Link
            href={getStatusHref(
              "open"
            )}
            className={getListLinkClass(
              activeStatus === "open"
            )}
          >
            <span>
              {getStatusLabel(
                "open"
              )}
            </span>

            <span className="text-xs opacity-80">
              {openCount}
            </span>
          </Link>

          <Link
            href={getStatusHref(
              "in_progress"
            )}
            className={getListLinkClass(
              activeStatus === "in_progress"
            )}
          >
            <span>
              {getStatusLabel(
                "in_progress"
              )}
            </span>

            <span className="text-xs opacity-80">
              {inProgressCount}
            </span>
          </Link>

          <Link
            href={getStatusHref(
              "waiting"
            )}
            className={getListLinkClass(
              activeStatus === "waiting"
            )}
          >
            <span>
              {getStatusLabel(
                "waiting"
              )}
            </span>

            <span className="text-xs opacity-80">
              {waitingCount}
            </span>
          </Link>

          <Link
            href={getStatusHref(
              "done"
            )}
            className={getListLinkClass(
              activeStatus === "done"
            )}
          >
            <span>
              {getStatusLabel(
                "done"
              )}
            </span>

            <span className="text-xs opacity-80">
              {doneCount}
            </span>
          </Link>
        </div>
      </div>

      {/* PRIORITÄT */}
      <div className="mb-8">
        <SectionTitle
          icon="🔥"
          title="Priorität"
        />

        <div className="flex flex-col gap-1">
          <Link
            href={getPriorityHref(
              "high_or_urgent"
            )}
            className={getListLinkClass(
              activePriority === "high_or_urgent"
            )}
          >
            <span>
              Hoch / Dringend
            </span>

            <span className="text-xs opacity-80">
              {urgentCount}
            </span>
          </Link>

          <Link
            href={getPriorityHref(
              "urgent"
            )}
            className={getListLinkClass(
              activePriority === "urgent"
            )}
          >
            <span>
              {getPriorityLabel(
                "urgent"
              )}
            </span>

            <span className="text-xs opacity-80">
              {
                tickets.filter(
                  (ticket) =>
                    ticket.priority === "urgent"
                ).length
              }
            </span>
          </Link>

          <Link
            href={getPriorityHref(
              "high"
            )}
            className={getListLinkClass(
              activePriority === "high"
            )}
          >
            <span>
              {getPriorityLabel(
                "high"
              )}
            </span>

            <span className="text-xs opacity-80">
              {
                tickets.filter(
                  (ticket) =>
                    ticket.priority === "high"
                ).length
              }
            </span>
          </Link>

          <Link
            href={getPriorityHref(
              "medium"
            )}
            className={getListLinkClass(
              activePriority === "medium"
            )}
          >
            <span>
              {getPriorityLabel(
                "medium"
              )}
            </span>

            <span className="text-xs opacity-80">
              {
                tickets.filter(
                  (ticket) =>
                    ticket.priority === "medium"
                ).length
              }
            </span>
          </Link>

          <Link
            href={getPriorityHref(
              "low"
            )}
            className={getListLinkClass(
              activePriority === "low"
            )}
          >
            <span>
              {getPriorityLabel(
                "low"
              )}
            </span>

            <span className="text-xs opacity-80">
              {
                tickets.filter(
                  (ticket) =>
                    ticket.priority === "low"
                ).length
              }
            </span>
          </Link>
        </div>
      </div>

      {/* FIRMEN */}
      <div className="mb-8">
        <SectionTitle
          icon="🏢"
          title="Firmen"
        />

        <div className="flex flex-col gap-1">
          {companies.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Firmen
            </p>
          )}

          {companies.map(
            (company) => (
              <Link
                key={company}
                href={getCompanyHref(
                  company
                )}
                className={getListLinkClass(
                  activeCompany === company
                )}
              >
                <span>
                  {company}
                </span>

                <span className="text-xs opacity-80">
                  {
                    tickets.filter(
                      (ticket) =>
                        getTicketCompany(
                          ticket
                        ) === company
                    ).length
                  }
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* ABTEILUNGEN */}
      <div className="mb-8">
        <SectionTitle
          icon="👥"
          title="Abteilungen"
        />

        <div className="flex flex-col gap-1">
          {departments.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Abteilungen
            </p>
          )}

          {departments.map(
            (department) => (
              <Link
                key={department}
                href={getDepartmentHref(
                  department
                )}
                className={getListLinkClass(
                  activeDepartment === department
                )}
              >
                <span>
                  {department}
                </span>

                <span className="text-xs opacity-80">
                  {
                    tickets.filter(
                      (ticket) =>
                        getTicketDepartment(
                          ticket
                        ) === department
                    ).length
                  }
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      {/* ZULETZT AKTUALISIERT */}
      {recentTickets.length > 0 && (
        <div>
          <SectionTitle
            icon="🕒"
            title="Zuletzt aktualisiert"
          />

          <div className="flex flex-col gap-1">
            {recentTickets.map(
              (ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className={getTicketLinkClass(
                    pathname === `/tickets/${ticket.id}`
                  )}
                >
                  <span className="line-clamp-1">
                    {ticket.title}
                  </span>

                  <span className="mt-1 block text-xs text-zinc-400 line-clamp-1">
                    {ticket.updatedAt}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </aside>
  );
}