import Link from "next/link";
import { wikiPages } from "@/data/wiki";

export default function WikiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Wiki
        </h1>

        <p className="text-zinc-500 mt-2">
          Unternehmensdokumentation
        </p>
      </div>

      <div className="grid gap-4">
        {wikiPages.map((page) => (
          <Link
            key={page.slug}
            href={`/wiki/${page.slug}`}
            className="bg-white border rounded-2xl p-6 hover:border-zinc-400 transition"
          >
            <p className="text-sm text-zinc-500">
              {page.category}
            </p>

            <h2 className="text-xl font-semibold mt-2">
              {page.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}