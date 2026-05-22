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

type WikiSidebarProps = {
  className?: string;
};

function formatTags(
  tags?: string[]
) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(Boolean);
}

function getLinkClass(
  active: boolean
) {
  if (active) {
    return "flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white";
  }

  return "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition";
}

function getBadgeClass(
  active: boolean
) {
  if (active) {
    return "rounded-full bg-white/15 px-2.5 py-1 text-xs text-white";
  }

  return "rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500";
}

export default function WikiSidebar({
  className = "",
}: WikiSidebarProps) {
  const searchParams =
    useSearchParams();

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [loading, setLoading] =
    useState(true);

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

      const nextPages =
        await wikiRepository.list();

      setPages(
        Array.isArray(
          nextPages
        )
          ? nextPages
          : []
      );
    } catch (error) {
      console.error(
        "Wiki-Seiten konnten nicht geladen werden:",
        error
      );

      setPages(
        []
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

  const companies =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages.map(
              (page) =>
                page.company ||
                "Intern"
            )
          )
        )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          ),
      [
        pages,
      ]
    );

  const departments =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages.map(
              (page) =>
                page.department ||
                page.category ||
                "Allgemein"
            )
          )
        )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          ),
      [
        pages,
      ]
    );

  const tags =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages.flatMap(
              (page) =>
                formatTags(
                  page.tags
                )
            )
          )
        )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          ),
      [
        pages,
      ]
    );

  const latestPages =
    useMemo(
      () =>
        pages.slice(
          0,
          5
        ),
      [
        pages,
      ]
    );

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">
              Wiki
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Wissen & Dokumentation
            </p>
          </div>

          <span className="h-11 w-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
            📚
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Seiten
            </p>

            <p className="text-2xl font-bold mt-1">
              {pages.length}
            </p>
          </div>

          <div className="rounded-2xl bg-indigo-50 p-4">
            <p className="text-xs text-indigo-600">
              Tags
            </p>

            <p className="text-2xl font-bold mt-1 text-indigo-700">
              {tags.length}
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-zinc-500 mt-5">
            Wiki wird geladen...
          </p>
        )}

        <div className="space-y-1 mt-5">
          <Link
            href="/wiki"
            className={getLinkClass(
              !companyParam &&
              !departmentParam &&
              !tagParam
            )}
          >
            <span>
              Alle Seiten
            </span>

            <span className={getBadgeClass(
              !companyParam &&
              !departmentParam &&
              !tagParam
            )}>
              {pages.length}
            </span>
          </Link>

          <Link
            href="/wiki/create"
            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition"
          >
            <span>
              Neue Seite
            </span>

            <span>
              ＋
            </span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Firmen
        </h3>

        <div className="space-y-1 mt-4">
          {companies.length === 0 && (
            <p className="text-sm text-zinc-500">
              Keine Firmen vorhanden.
            </p>
          )}

          {companies.map(
            (company) => {
              const active =
                companyParam === company;

              const count =
                pages.filter(
                  (page) =>
                    (page.company ||
                      "Intern") === company
                ).length;

              return (
                <Link
                  key={company}
                  href={`/wiki?company=${encodeURIComponent(
                    company
                  )}`}
                  className={getLinkClass(
                    active
                  )}
                >
                  <span className="truncate">
                    {company}
                  </span>

                  <span className={getBadgeClass(active)}>
                    {count}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Abteilungen
        </h3>

        <div className="space-y-1 mt-4">
          {departments.length === 0 && (
            <p className="text-sm text-zinc-500">
              Keine Abteilungen vorhanden.
            </p>
          )}

          {departments.map(
            (department) => {
              const active =
                departmentParam === department;

              const count =
                pages.filter(
                  (page) =>
                    (page.department ||
                      page.category ||
                      "Allgemein") === department
                ).length;

              return (
                <Link
                  key={department}
                  href={`/wiki?department=${encodeURIComponent(
                    department
                  )}`}
                  className={getLinkClass(
                    active
                  )}
                >
                  <span className="truncate">
                    {department}
                  </span>

                  <span className={getBadgeClass(active)}>
                    {count}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Tags
        </h3>

        <div className="flex flex-wrap gap-2 mt-4">
          {tags.length === 0 && (
            <p className="text-sm text-zinc-500">
              Keine Tags vorhanden.
            </p>
          )}

          {tags.map(
            (tag) => {
              const active =
                tagParam === tag;

              return (
                <Link
                  key={tag}
                  href={`/wiki?tag=${encodeURIComponent(
                    tag
                  )}`}
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  #{tag}
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Letzte Seiten
        </h3>

        <div className="space-y-3 mt-4">
          {latestPages.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine Wiki-Seiten vorhanden.
            </p>
          )}

          {latestPages.map(
            (page) => (
              <Link
                key={page.slug}
                href={`/wiki/${encodeURIComponent(
                  page.slug
                )}`}
                className="block rounded-2xl border border-zinc-100 p-4 hover:bg-zinc-50 transition"
              >
                <p className="font-medium line-clamp-2">
                  {page.title}
                </p>

                <p className="text-xs text-zinc-500 mt-2">
                  {page.company ||
                    "Intern"}
                  {" · "}
                  {page.department ||
                    page.category ||
                    "Allgemein"}
                </p>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}