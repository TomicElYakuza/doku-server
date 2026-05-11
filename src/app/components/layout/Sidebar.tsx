export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900 text-white h-screen p-4">
      <h1 className="text-2xl font-bold mb-8">
        Intranet
      </h1>

      <nav className="flex flex-col gap-4">
        <a href="#">Dashboard</a>
        <a href="#">Wiki</a>
        <a href="#">Tickets</a>
        <a href="#">Dateien</a>
        <a href="#">Einstellungen</a>
      </nav>
    </aside>
  );
}