"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  getStoredPages,
} from "../../../../lib/wikiStorage";

export default function CompanyPage() {
  const params =
    useParams();

  const companyParam =
    params.company as string;

  const decodedCompany =
    decodeURIComponent(
      companyParam
    );

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    loadPages();

    function handleWikiPagesUpdated() {
      loadPages();
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, [decodedCompany]);

  function loadPages() {
    const allPages =
      getStoredPages();

    const filteredPages =
      allPages.filter(
        (page: any) =>
          (page.company ||
            "Intern") ===
          decodedCompany
      );

    setPages(filteredPages);
  }

  if (!mounted) {
    return null;
  }

  const departments: string[] = [
    ...new Set(
      pages
        .map(
          (page: any) =>
            page.category
        )
        .filter(Boolean)
    ),
  ];

  const tags: string[] = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

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
          firma
        </span>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          {decodedCompany}
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
          Firma
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {decodedCompany}
        </h1>

        <p className="text-zinc-500 mt-3">
          {pages.length} Dokumente gefunden
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {pages.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {departments.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {tags.length}
          </h2>
        </div>
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
            Es gibt aktuell kein Dokument für die Firma{" "}
            <span className="font-mono text-zinc-900">
              {decodedCompany}
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
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {page.company ||
                      "Intern"}
                  </span>

                  <Link
                    href={`/wiki/department/${encodeURIComponent(
                      page.category
                    )}`}
                    className="text-sm bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                  >
                    {page.category}
                  </Link>
                </div>

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
                  (tag: string) => (
                    <Link
                      key={tag}
                      href={`/wiki/tag/${encodeURIComponent(
                        tag
                      )}`}
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
            </div>
          )
        )}
      </div>
    </div>
  );
}