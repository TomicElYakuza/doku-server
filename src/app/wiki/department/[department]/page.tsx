"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getStoredPages,
} from "../../../../lib/wikiStorage";

export default function DepartmentPage() {
  const params = useParams();

  const department =
    params.department as string;

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const allPages =
      getStoredPages();

    const decodedDepartment =
      decodeURIComponent(
        department
      );

    const filteredPages =
      allPages.filter(
        (page: any) =>
          page.category ===
          decodedDepartment
      );

    setPages(filteredPages);
  }, [department]);

  if (!mounted) {
    return null;
  }

  const decodedDepartment =
    decodeURIComponent(department);

  return (
    <div className="space-y-6">
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
          abteilung
        </span>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          {decodedDepartment}
        </span>
      </div>

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
          Abteilung
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {decodedDepartment}
        </h1>

        <p className="text-zinc-500 mt-3">
          {pages.length} Dokumente gefunden
        </p>
      </div>

      {pages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mb-6">
            🔎
          </div>

          <h2 className="text-2xl font-bold">
            Keine Dokumente gefunden
          </h2>

          <p className="text-zinc-500 mt-3">
            Es gibt aktuell kein Dokument in der Abteilung{" "}
            <span className="font-mono text-zinc-900">
              {decodedDepartment}
            </span>
            .
          </p>

          <Link
            href="/wiki"
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zurück zur Wiki-Übersicht
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {pages.map(
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

              <div className="flex flex-wrap gap-2 mt-4">
                {page.tags?.map(
                  (tag: string) => (
                    <Link
                      key={tag}
                      href={`/wiki/tag/${tag}`}
                      className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      #{tag}
                    </Link>
                  )
                )}
              </div>

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