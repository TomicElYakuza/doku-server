import {
  LayoutDashboard,
  BookOpen,
  Ticket,
  FolderKanban,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-950 text-white h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10">
        Intranet
      </h1>

      <nav className="flex flex-col gap-2">
        <a
          href="#"
          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </a>

        <a
          href="#"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition"
        >
          <BookOpen size={20} />
          Wiki
        </a>

        <a
          href="#"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition"
        >
          <Ticket size={20} />
          Tickets
        </a>

        <a
          href="#"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition"
        >
          <FolderKanban size={20} />
          Dateien
        </a>

        <a
          href="#"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition"
        >
          <Settings size={20} />
          Einstellungen
        </a>
      </nav>
    </aside>
  );
}