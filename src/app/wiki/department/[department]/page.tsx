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
  wikiRepository,
} from "../../../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../../../lib/wikiRepository";

function getPageSlug(
  page: WikiPage
) {
  return String(
    page.slug ||
      ""
  );
}

function getPageTitle(
  page: WikiPage
) {
  return String(
    page.title ||
      "Unbenanntes Dokument"
  );
}

function getPageDescription(
  page: WikiPage
) {
  return String(
    page.description ||
      page.excerpt ||
      ""
  );
}

function getPageCompany(
  page: WikiPage
) {
  return String(
    page.company ||
      "Intern"
  );
}

function getPageUpdatedAt(
  page: WikiPage
) {
  return String(
    page.updatedAt ||
      page.createdAt ||
      "Unbekannt"
  );
}

export default function WikiDepartmentPage() {
  const params =
    useParams();

  const department =
    decodeURIComponent(
      params.department as string
    );

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [search, setSearch] =
    useState("");

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
  }, [
    department,
  ]);

  function loadPages() {
    setPages(
      wikiRepository.listByDepartment(
        department
      )
    );
  }

  if (!mounted) {
    return null;
  }

  const filteredPages =
    pages.filter(
      (page) => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return [
          getPageSlug(
            page
          ),
          getPageTitle(
            page
          ),
          getPageDescription(
            page
          ),
          getPageCompany(
            page
          ),
          String(
            page.content ||
              ""
          ),
        ]
          .join(" ")
          .toLowerCase()
          .includes(
            query
          );
      }
    );

  const companies =
    Array.from(
      new Set(
        pages.map(
          (page) =>
            getPageCompany(
              page
            )
        )
      )
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <Link
          href="/wiki"
          className="hover:text-zinc-900 transition"
        >
          Wiki
        </Link>

        <span>/</span>

        <span>
          Abteilung
        </span>

        <span>/</span>

        <span>
          {department}
        </span>
      </div>

      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Wiki-Übersicht
        </Link>
      </div>

      <div>
        <p className="text-sm text-zinc-500">
          Wiki nach Abteilung
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {department}
        </h1>

        <p className="text-zinc-500 mt-2">
          Alle Dokumente dieser Abteilung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pages.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Treffer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {filteredPages.length}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <label className="block text-sm font-medium mb-2">
          In dieser Abteilung suchen
        </label>

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Suche nach Titel, Inhalt oder Firma..."
          className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filteredPages.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <p className="text-zinc-500">
              Keine Dokumente gefunden.
            </p>
          </div>
        )}

        {filteredPages.map(
          (page) => {
            const slug =
              getPageSlug(
                page
              );

            return (
              <Link
                key={slug}
                href={`/wiki/${encodeURIComponent(
                  slug
                )}`}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {getPageCompany(
                      page
                    )}
                  </span>

                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {department}
                  </span>
                </div>

                <h2 className="text-2xl font-bold mt-5">
                  {getPageTitle(
                    page
                  )}
                </h2>

                <p className="text-zinc-500 mt-2 line-clamp-2">
                  {getPageDescription(
                    page
                  )}
                </p>

                <p className="text-sm text-zinc-500 mt-5">
                  Aktualisiert:{" "}
                  {getPageUpdatedAt(
                    page
                  )}
                </p>
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}