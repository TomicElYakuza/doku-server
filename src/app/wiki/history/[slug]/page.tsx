import Link from "next/link";

type WikiHistoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WikiHistoryPage({
  params,
}: WikiHistoryPageProps) {
  const {
    slug,
  } =
    await params;

  const decodedSlug =
    decodeURIComponent(
      slug
    );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/wiki/${encodeURIComponent(
            decodedSlug
          )}`}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Wiki-Seite
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h1 className="text-4xl font-bold">
          Versionsverlauf entfernt
        </h1>

        <p className="text-zinc-500 mt-3 leading-relaxed">
          Der alte lokale Versionsverlauf wurde entfernt, weil die Anwendung auf PostgreSQL umgestellt wird.
          Für echte Versionierung bauen wir später eine PostgreSQL-basierte Historie über die Tabelle
          <span className="font-mono"> wiki_versions</span>.
        </p>

        <p className="text-sm text-zinc-400 mt-5">
          Seite: {decodedSlug}
        </p>
      </div>
    </div>
  );
}