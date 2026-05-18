"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  getTickets,
} from "../../lib/ticketStorage";

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: "🏠",
  },
  {
    label: "Wiki",
    href: "/wiki",
    icon: "📚",
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: "🎫",
  },
  {
    label: "Dateien",
    href: "/files",
    icon: "📁",
  },
  {
    label: "Aktivitäten",
    href: "/activity",
    icon: "🕘",
  },
  {
    label: "Einstellungen",
    href: "/settings",
    icon: "⚙️",
  },
];

export default function Sidebar() {
  const pathname =
    usePathname();

  const [mounted, setMounted] =
    useState(false);

  const [openTicketCount, setOpenTicketCount] =
    useState(0);

  useEffect(() => {
    setMounted(true);

    loadTicketCount();

    function handleTicketsUpdated() {
      loadTicketCount();
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

  function loadTicketCount() {
    const tickets =
      getTickets();

    const openTickets =
      tickets.filter(
        (ticket: any) =>
          ticket.status === "open" ||
          ticket.status === "in-progress"
      );

    setOpenTicketCount(
      openTickets.length
    );
  }

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-zinc-950 text-white h-screen p-6 flex flex-col overflow-y-auto">
      {/* LOGO */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold">
          Doku Server
        </h1>

        <p className="text-zinc-400 text-sm mt-1">
          Intranet & Wissensbasis
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition ${
              isActive(item.href)
                ? "bg-white text-zinc-950"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <span>
                {item.icon}
              </span>

              <span className="font-medium">
                {item.label}
              </span>
            </span>

            {mounted &&
              item.href === "/tickets" &&
              openTicketCount > 0 && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isActive(item.href)
                      ? "bg-zinc-950 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {openTicketCount}
                </span>
              )}
          </Link>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto pt-8 text-sm text-zinc-500">
        <p>
          Lokales Demo-System
        </p>

        <p className="mt-1">
          Version 1.0
        </p>
      </div>
    </aside>
  );
}