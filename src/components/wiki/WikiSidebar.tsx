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

import {
  usePermissions,
} from "../../hooks/usePermissions";

import type {
  WikiPage,
} from "../../types/wiki";

export default function WikiSidebar() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const {
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const activeCompany =
    searchParams.get(
      "company"
    ) ||
    "";

  const activeDepartment =
    searchParams.get(
      "department"
    ) ||
    "";

  const activeTag =
    searchParams.get(
      "tag"
    ) ||
    "";

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    setMounted(
      true
    );

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

  function wikiCompanyHref(
    company: string
  ) {
    return `/wiki?company=${encodeURIComponent(
      company
    )}`;
  }

  function wikiDepartmentHref(
    department: string
  ) {
    return `/wiki?department=${encodeURIComponent(
      department
    )}`;
  }

  function wikiTagHref(
    tag: string
  ) {
    return `/wiki?tag=${encodeURIComponent(
      tag
    )}`;
  }

  const companies =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages
              .map(
                (page) =>
                  page.company ||
                  "Intern"
              )
              .filter(Boolean)
          )
        ).sort(
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
            pages
              .map(
                (page) =>
                  page.department ||
                  page.category ||
                  "Allgemein"
              )
              .filter(Boolean)
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b
            )
        ),
      [
        pages,
      ]
    );

  const allTags =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages.flatMap(
              (page) =>
                page.tags ||
                []
            )
          )
        ).sort(
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
        [...pages]
          .sort(
            (a, b) =>
              String(
                b.updatedAt ||
                b.createdAt ||
                ""
              ).localeCompare(
                String(
                  a.updatedAt ||
                  a.createdAt ||
                  ""
                )
              )
          )
          .slice(
            0,
            5
          ),
      [
        pages,
      ]
    );

  const canManageWiki =
    isAdmin ||
    hasAnyPermission([
      "wiki.manage",
      "wiki.delete",
    ]);

  if (!mounted) {
    return null;
  }

  return (
    <aside className="w-72 bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6 h-fit">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold">
            Wiki
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            {loading
              ? "Lädt..."
              : `${pages.length} Seiten`}
          </p>
        </div>

        <Link
          href="/wiki/create"
          className="bg-zinc-900 text-white px-3 py-2 rounded-xl hover:bg-zinc-700 transition text-sm"
        >
          Neu
        </Link>
      </div>

      <div className="mb-8">
        <Link
          href="/wiki"
          className={`block p-3 rounded-xl transition ${
            pathname === "/wiki" &&
            !activeCompany &&
            !activeDepartment &&
            !activeTag
              ? "bg-zinc-900 text-white"
              : "hover:bg-zinc-100"
          }`}
        >
          📚 Alle Dokumente
        </Link>
      </div>

      {latestPages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-blue-600 uppercase mb-3">
            Zuletzt aktualisiert
          </h3>

          <div className="flex flex-col gap-1">
            {latestPages.map(
              (page) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${encodeURIComponent(
                    page.slug
                  )}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/${page.slug}`
                      ? "bg-blue-600 text-white"
                      : "hover:bg-blue-50"
                  }`}
                >
                  🕒 {page.title}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-indigo-700 uppercase mb-3">
          Firmen
        </h3>

        <div className="flex flex-col gap-2">
          {companies.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Firmen
            </p>
          )}

          {companies.map(
            (company) => (
              <Link
                key={company}
                href={wikiCompanyHref(
                  company
                )}
                className={`p-3 rounded-xl transition ${
                  activeCompany === company
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {company}
              </Link>
            )
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-indigo-700 uppercase mb-3">
          Abteilungen
        </h3>

        <div className="flex flex-col gap-2">
          {departments.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Abteilungen
            </p>
          )}

          {departments.map(
            (department) => (
              <Link
                key={department}
                href={wikiDepartmentHref(
                  department
                )}
                className={`p-3 rounded-xl transition ${
                  activeDepartment === department
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {department}
              </Link>
            )
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
          Tags
        </h3>

        <div className="flex flex-wrap gap-2">
          {allTags.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Tags
            </p>
          )}

          {allTags.map(
            (tag) => (
              <Link
                key={tag}
                href={wikiTagHref(
                  tag
                )}
                className={`text-sm px-3 py-1 rounded-full transition ${
                  activeTag === tag
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                #{tag}
              </Link>
            )
          )}
        </div>
      </div>

      {canManageWiki && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 uppercase mb-3">
            Verwaltung
          </h3>

          <Link
            href="/wiki"
            className="block p-3 rounded-xl hover:bg-red-50 text-red-600 transition"
          >
            Wiki verwalten
          </Link>
        </div>
      )}
    </aside>
  );
}