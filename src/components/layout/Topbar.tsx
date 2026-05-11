export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <h2 className="font-semibold text-lg">
        Willkommen zurück
      </h2>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-300" />
      </div>
    </header>
  );
}