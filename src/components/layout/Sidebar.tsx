"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

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
    label: "Ticket-Vorlagen",
    href: "/tickets/templates",
    icon: "🧩",
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

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/tickets") {
      return (
        pathname === "/tickets" ||
        (
          pathname.startsWith(
            "/tickets/"
          ) &&
          !pathname.startsWith(
            "/tickets/templates"
          )
        )
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-zinc-950 text-white h-screen p-6 flex flex-col overflow-y-auto sticky top-0">
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
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
              isActive(item.href)
                ? "bg-white text-zinc-950"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span>
              {item.icon}
            </span>

            <span className="font-medium">
              {item.label}
            </span>
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