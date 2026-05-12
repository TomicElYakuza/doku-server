"use client";

import Link from "next/link";

import { useParams } from "next/navigation";

import { wikiPages } from "../../../../data/wiki";

export default function DepartmentPage() {
  const params = useParams();

  const department =
    params.department as string;

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
    allPages.filter(
      (page: any) =>
        page.category === department
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
          {department}
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

      {/* HEADER */}
      <div>
        <p className="text-zinc-500">
          Abteilung
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {department}
        </h1>

        <p className="text-zinc-500 mt-3">
          {filteredPages.length} Dokumente
        </p>
      </div>

      {/* DOCUMENTS */}
      <div className="grid gap-4">
        {filteredPages.map(
          (page: any) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  {page.category}
                </p>

                <span className="text-xs bg-zinc-100 px-3 py-1 rounded-full">
                  Dokument
                </span>
              </div>

              <h2 className="text-xl font-semibold mt-3">
                {page.title}
              </h2>

              <p className="text-zinc-600 mt-2">
                {page.description}
              </p>

              {/* TAGS */}
              <div className="flex flex-wrap gap-2 mt-4">
                {page.tags?.map(
                  (tag: string) => (
                    <span
                      key={tag}
                      className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>

              {/* META */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                <p className="text-sm text-zinc-500">
                  {page.author}
                </p>

                <p className="text-sm text-zinc-500">
                  {page.updatedAt}
                </p>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}