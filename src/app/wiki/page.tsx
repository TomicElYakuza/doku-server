"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../types/wiki";

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
      "Unbenannt"
  );
}

function getPageDescription(
  page: WikiPage
) {
  return String(
    page.description ||
      page.excerpt ||
      "Keine Beschreibung vorhanden."
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

function getPageDepartment(
  page: WikiPage
) {
  return String(
    page.department ||
      page.category ||
      "Allgemein"
  );
}

function getPageTags(
  page: WikiPage
) {
  if (
    Array.isArray(
      page.tags
    )
  ) {
    return page.tags.map(
      (tag) =>
        String(
          tag
        )
    );
  }

  return [];
}

export default function WikiPageIndex() {
  const searchParams =
    useSearchParams();

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadPages();

    function handleWikiPagesUpdated() {
      void loadPages();
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
  }, []);

  async function loadPages() {
    try {
      setLoading(
        true
      );

      setError("");

      const nextPages =
        await wikiRepository.list();

      setPages(
        nextPages
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seiten konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const companyParam =
    searchParams.get("company") || "";

  const departmentParam =
    searchParams.get("department") || "";

  const tagParam =
    searchParams.get("tag") || "";

  const filteredPages =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return pages.filter(
          (page) => {
            const company =
              getPageCompany(
                page
              );

            const department =
              getPageDepartment(
                page
              );

            const tags =
              getPageTags(
                page
              );

            const matchesCompany =
              !companyParam ||
              company === companyParam;

            const matchesDepartment =
              !departmentParam ||
              department === departmentParam;

            const matchesTag =
              !tagParam ||
              tags.includes(
                tagParam
              );

            const matchesSearch =
              !query ||
              [
                getPageTitle(
                  page
                ),
                getPageDescription(
                  page
                ),
                page.content,
                company,
                department,
                tags.join(" "),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            return (
              matchesCompany &&
              matchesDepartment &&
              matchesTag &&
              matchesSearch
            );
          }
        );
      },
      [
        pages,
        search,
        companyParam,
        departmentParam,
        tagParam,
      ]
    );

  const activeFilterLabel =
    companyParam ||
    departmentParam ||
    tagParam ||
    "";

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Wiki
          </h1>

          <p className="text-zinc-500 mt-2">
            Zentrale Dokumentation für Wissen, Prozesse und interne Informationen.
          </p>

          {activeFilterLabel && (
            <p className="text-sm text-zinc-500 mt-3">
              Aktiver Filter:{" "}
              <span className="font-medium text-zinc-900">
                {activeFilterLabel}
              </span>
            </p>
          )}
        </div>

        <Link
          href="/wiki/create"
          className="inline-flex items-center justify-center bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Neue Seite erstellen
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Wiki durchsuchen..."
          />

          {(search || activeFilterLabel) && (
            <Link
              href="/wiki"
              onClick={() =>
                setSearch("")
              }
              className="inline-flex items-center justify-center bg-zinc-100 px-5 py-4 rounded-2xl hover:bg-zinc-200 transition"
            >
              Filter zurücksetzen
            </Link>
          )}
        </div>

        <p className="text-sm text-zinc-500 mt-4">
          {filteredPages.length} von {pages.length} Seiten gefunden.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Wiki-Seiten werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && filteredPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold">
            Keine Wiki-Seiten gefunden
          </h2>

          <p className="text-zinc-500 mt-2">
            Erstelle eine neue Seite oder passe deine Suche an.
          </p>

          <Link
            href="/wiki/create"
            className="inline-flex mt-5 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Neue Seite erstellen
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filteredPages.map(
          (page) => {
            const slug =
              getPageSlug(
                page
              );

            const tags =
              getPageTags(
                page
              );

            return (
              <Link
                key={slug}
                href={`/wiki/${encodeURIComponent(
                  slug
                )}`}
                className="block bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    {getPageCompany(
                      page
                    )}
                  </span>

                  <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                    {getPageDepartment(
                      page
                    )}
                  </span>
                </div>

                <h2 className="text-2xl font-bold mt-4 line-clamp-2">
                  {getPageTitle(
                    page
                  )}
                </h2>

                <p className="text-zinc-500 mt-3 line-clamp-3">
                  {getPageDescription(
                    page
                  )}
                </p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-5">
                    {tags.slice(
                      0,
                      5
                    ).map(
                      (tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      )
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-6">
                  <span>
                    Autor:{" "}
                    {page.author ||
                      "Unbekannt"}
                  </span>

                  <span>
                    Aktualisiert:{" "}
                    {page.updatedAt}
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}