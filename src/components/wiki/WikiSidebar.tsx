"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
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
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void loadData();

    function handleWikiPagesUpdated() {
      void loadData();
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

  async function loadData() {
    try {
      setLoading(
        true
      );

      const nextPages =
        await wikiRepository.list();

      setPages(
        nextPages
      );
    } catch (error) {
      console.error(
        "Wiki-Seiten konnten nicht geladen werden:",
        error
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
                getPageCompany(
                  page
                )
            )
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
                getPageDepartment(
                  page
                )
            )
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
                getPageTags(
                  page
                )
            )
          )
        ),
      [
        pages,
      ]
    );

  const latestPages =
    [
      ...pages,
    ].slice(
      0,
      5
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
              Dokumentation
            </p>
          </div>

          <span className="h-11 w-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
            ◫
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

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Tags
            </p>

            <p className="text-2xl font-bold mt-1">
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
              pathname === "/wiki" &&
              !companyParam &&
              !departmentParam &&
              !tagParam
            )}
          >
            <span>
              Alle Dokumente
            </span>

            <span className={getBadgeClass(false)}>
              {pages.length}
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
            <p className="text-sm text-zinc-500 px-4 py-3">
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
                    getPageCompany(
                      page
                    ) === company
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
            <p className="text-sm text-zinc-500 px-4 py-3">
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
                    getPageDepartment(
                      page
                    ) === department
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
          Zuletzt bearbeitet
        </h3>

        <div className="space-y-3 mt-4">
          {latestPages.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine Seiten vorhanden.
            </p>
          )}

          {latestPages.map(
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
                  className="block rounded-2xl border border-zinc-100 p-4 hover:bg-zinc-50 transition"
                >
                  <p className="font-medium line-clamp-2">
                    {getPageTitle(
                      page
                    )}
                  </p>

                  <p className="text-xs text-zinc-500 mt-2">
                    {getPageCompany(
                      page
                    )} ·{" "}
                    {getPageDepartment(
                      page
                    )}
                  </p>
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
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  #{tag}
                </Link>
              );
            }
          )}
        </div>
      </div>
    </aside>
  );
}