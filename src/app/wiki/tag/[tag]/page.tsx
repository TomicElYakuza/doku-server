"use client";

import Link from "next/link";

import { useParams } from "next/navigation";

import { wikiPages } from "../../../../data/wiki";

export default function TagPage() {
  const params = useParams();

  const tag = params.tag as string;

  const storedPages =
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem("wiki-pages") ||
            "[]"
        )
      : [];

  const allPages =
    storedPages.length > 0
      ? storedPages
      : wikiPages;

  const filteredPages =
    allPages.filter((page: any) =>
      page.tags?.includes(tag)
    );

  return (
    <div className="space-y-6">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/wiki"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          wiki
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          #{tag}
        </span>
      </div>

      {/* BACK BUTTON */}
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div>
        <p className="text-zinc-500">
          Tag
        </p>

        <h1 className="text-4xl font-bold mt-2">
          #{tag}
        </h1>

        <p className="text-zinc-500 mt-3">
          {filteredPages.length} Dokumente gefunden
        </p>
      </div>

      <div className="grid gap-4">
        {filteredPages.map(
          (page: any) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
            >
              <p className="text-sm text-zinc-500">
                {page.category}
              </p>

              <h2 className="text-xl font-semibold mt-2">
                {page.title}
              </h2>

              <p className="text-zinc-600 mt-2">
                {page.description}
              </p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}