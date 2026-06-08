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

function getWikiHref(
  slug: string
) {
  return `/wiki/${encodeURIComponent(
    slug
  )}`;
}

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
          (
            a,
            b
          ) =>
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
                  page.department || "Keine Abteilung"
              )
              .filter(Boolean)
          )
        ).sort(
          (
            a,
            b
          ) =>
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
                Array.isArray(
                  page.tags
                )
                  ? page.tags
                  : []
            )
          )
        ).sort(
          (
            a,
            b
          ) =>
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
        [
          ...pages,
        ]
          .sort(
            (
              a,
              b
            ) =>
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
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
    ]);

  if (!mounted) {
    return null;
  }

  return (
    <aside className="space-y-6">
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Wiki
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              {loading
                ? "Lädt..."
                : `${pages.length} Seiten`}
            </p>
          </div>

          {canManageWiki && (
            <Link
              href="/wiki"
              className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow text-sm"
            >
              Neue Seite
            </Link>
          )}
        </div>

        <Link
          href="/wiki"
          className={`block mt-5 px-4 py-3 rounded-2xl transition ${
            pathname === "/wiki" &&
            !activeCompany &&
            !activeDepartment &&
            !activeTag
              ? "app-accent-bg text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          Alle Dokumente
        </Link>
      </section>

      {latestPages.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Zuletzt aktualisiert
          </h3>

          <div className="space-y-2 mt-4">
            {latestPages.map(
              (page) => (
                <Link
                  key={page.slug}
                  href={getWikiHref(
                    page.slug
                  )}
                  className={`block px-4 py-3 rounded-2xl transition ${
                    pathname ===
                    getWikiHref(
                      page.slug
                    )
                      ? "app-accent-bg text-white"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="font-medium line-clamp-1">
                    {page.title}
                  </span>

                  <span className="block text-xs opacity-60 mt-1">
                    {page.updatedAt ||
                      page.createdAt}
                  </span>
                </Link>
              )
            )}
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Firmen
        </h3>

        <div className="space-y-2 mt-4">
          {companies.length === 0 && (
            <p className="text-sm text-zinc-500">
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
                className={`block px-4 py-3 rounded-2xl transition ${
                  activeCompany === company
                    ? "app-accent-bg text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {company}
              </Link>
            )
          )}
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Abteilungen
        </h3>

        <div className="space-y-2 mt-4">
          {departments.length === 0 && (
            <p className="text-sm text-zinc-500">
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
                className={`block px-4 py-3 rounded-2xl transition ${
                  activeDepartment === department
                    ? "app-accent-bg text-white"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {department}
              </Link>
            )
          )}
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Tags
        </h3>

        <div className="flex flex-wrap gap-2 mt-4">
          {allTags.length === 0 && (
            <p className="text-sm text-zinc-500">
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
                className={`text-xs px-3 py-1 rounded-full transition ${
                  activeTag === tag
                    ? "app-accent-bg text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                #{tag}
              </Link>
            )
          )}
        </div>
      </section>

      {canManageWiki && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Verwaltung
          </h3>

          <Link
            href="/wiki"
            className="block mt-4 app-accent-bg text-white px-4 py-3 rounded-2xl hover:opacity-90 transition"
          >
            Wiki verwalten
          </Link>

          <p className="text-xs text-zinc-500 mt-3">
            Erstellen und Bearbeiten läuft jetzt über die Wiki-Übersicht im Modal.
          </p>
        </section>
      )}
    </aside>
  );
}

