import Link from "next/link";

export default function WikiTrashPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Wiki
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h1 className="text-4xl font-bold">
          Papierkorb entfernt
        </h1>

        <p className="text-zinc-500 mt-3 leading-relaxed">
          Der lokale Wiki-Papierkorb wurde entfernt, weil die Anwendung jetzt auf PostgreSQL umgestellt wird.
          Gelöschte Wiki-Seiten werden direkt aus der Datenbank entfernt.
        </p>

        <Link
          href="/wiki"
          className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Wiki öffnen
        </Link>
      </div>
    </div>
  );
}