"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getStoredPages,
} from "../../../../lib/wikiStorage";

export default function TagPage() {
  const params = useParams();

  const tagParam =
    params.tag as string;

  const decodedTag =
    decodeURIComponent(tagParam);

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const allPages =
      getStoredPages();

    const filteredPages =
      allPages.filter(
        (page: any) =>
          page.tags?.includes(decodedTag)
      );

    setPages(filteredPages);
  }, [decodedTag]);

  if (!mounted) {
    return null;
  }

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
          tag
        </span>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          #{decodedTag}
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
          Tag Suche
        </p>

        <h1 className="text-4xl font-bold mt-2">
          #{decodedTag}
        </h1>

        <p className="text-zinc-500 mt-3">
          {pages.length} Dokumente gefunden
        </p>
      </div>

      {/* EMPTY */}
      {pages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mb-6">
            🔎
          </div>

          <h2 className="text-2xl font-bold">
            Keine Dokumente gefunden
          </h2>

          <p className="text-zinc-500 mt-3">
            Es gibt aktuell kein Dokument mit dem Tag{" "}
            <span className="font-mono text-zinc-900">
              #{decodedTag}
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

      {/* DOCUMENTS */}
      <div className="grid gap-4">
        {pages.map(
          (page: any) => (
            <div
              key={page.slug}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/wiki/department/${encodeURIComponent(
                    page.category
                  )}`}
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition"
                >
                  {page.category}
                </Link>

                <span className="text-xs bg-zinc-100 px-3 py-1 rounded-full">
                  Dokument
                </span>
              </div>

              <Link
                href={`/wiki/${page.slug}`}
                className="block mt-3"
              >
                <h2 className="text-xl font-semibold hover:underline">
                  {page.title}
                </h2>
              </Link>

              <p className="text-zinc-600 mt-2">
                {page.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {page.tags?.map(
                  (pageTag: string) => (
                    <Link
                      key={pageTag}
                      href={`/wiki/tag/${encodeURIComponent(
                        pageTag
                      )}`}
                      className={`text-xs px-2 py-1 rounded-full transition ${
                        pageTag === decodedTag
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      #{pageTag}
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
            </div>
          )
        )}
      </div>
    </div>
  );
}