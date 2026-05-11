"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BookOpen,
  Ticket,
  FolderKanban,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 text-white min-h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10">
        Intranet
      </h1>

      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className={`flex items-center gap-3 p-3 rounded-lg transition ${
            pathname === "/"
              ? "bg-zinc-800"
              : "hover:bg-zinc-800"
          }`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <Link
          href="/wiki"
          className={`flex items-center gap-3 p-3 rounded-lg transition ${
            pathname === "/wiki"
              ? "bg-zinc-800"
              : "hover:bg-zinc-800"
          }`}
        >
          <BookOpen size={20} />
          Wiki
        </Link>

        <Link
          href="/tickets"
          className={`flex items-center gap-3 p-3 rounded-lg transition ${
            pathname === "/tickets"
              ? "bg-zinc-800"
              : "hover:bg-zinc-800"
          }`}
        >
          <Ticket size={20} />
          Tickets
        </Link>

        <Link
          href="/files"
          className={`flex items-center gap-3 p-3 rounded-lg transition ${
            pathname === "/files"
              ? "bg-zinc-800"
              : "hover:bg-zinc-800"
          }`}
        >
          <FolderKanban size={20} />
          Dateien
        </Link>

        <Link
          href="/settings"
          className={`flex items-center gap-3 p-3 rounded-lg transition ${
            pathname === "/settings"
              ? "bg-zinc-800"
              : "hover:bg-zinc-800"
          }`}
        >
          <Settings size={20} />
          Einstellungen
        </Link>
      </nav>
    </aside>
  );
}