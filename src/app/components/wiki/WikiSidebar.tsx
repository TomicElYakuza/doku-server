"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  getStoredPages,
} from "../../../lib/wikiStorage";

import {
  getFavorites,
} from "../../../lib/favoritesStorage";

import {
  getRecentPages,
} from "../../../lib/recentStorage";

import {
  getTrashPages,
} from "../../../lib/trashStorage";

import {
  isAdmin,
} from "../../../lib/permissions";

function SectionTitle({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold app-accent-text uppercase mb-3">
      <span className="text-base leading-none">
        {icon}
      </span>

      <span>
        {title}
      </span>
    </h3>
  );
}

export default function WikiSidebar() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const activeCompany =
    searchParams.get("company") || "";

  const activeDepartment =
    searchParams.get("department") || "";

  const activeTag =
    searchParams.get("tag") || "";

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<any[]>([]);

  const [recentPages, setRecentPages] =
    useState<any[]>([]);

  const [trashCount, setTrashCount] =
    useState(0);

  const [tagsOpen, setTagsOpen] =
    useState(false);

  const [admin, setAdmin] =
    useState(false);

  function loadPages() {
    const allPages =
      getStoredPages();

    setPages(
      allPages
    );

    loadRecentPages(
      allPages
    );
  }

  function loadFavorites() {
    setFavorites(
      getFavorites()
    );
  }

  function loadRecentPages(
    allPages: any[] = getStoredPages()
  ) {
    const recentSlugs =
      getRecentPages();

    const recent =
      recentSlugs
        .map(
          (slug: string) =>
            allPages.find(
              (page: any) =>
                page.slug === slug
            )
        )
        .filter(Boolean);

    setRecentPages(
      recent
    );
  }

  function loadTrashCount() {
    setTrashCount(
      getTrashPages().length
    );
  }

  function loadAdminStatus() {
    setAdmin(
      isAdmin()
    );
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

  useEffect(() => {
    setMounted(
      true
    );

    loadAdminStatus();

    loadPages();

    loadFavorites();

    loadTrashCount();

    function handleFavoritesUpdated() {
      loadFavorites();
    }

    function handleRecentUpdated() {
      loadRecentPages();
    }

    function handleTrashUpdated() {
      loadTrashCount();
    }

    function handleWikiPagesUpdated() {
      loadPages();
    }

    function handleUserUpdated() {
      loadAdminStatus();
    }

    window.addEventListener(
      "favoritesUpdated",
      handleFavoritesUpdated
    );

    window.addEventListener(
      "recentUpdated",
      handleRecentUpdated
    );

    window.addEventListener(
      "trashUpdated",
      handleTrashUpdated
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        handleFavoritesUpdated
      );

      window.removeEventListener(
        "recentUpdated",
        handleRecentUpdated
      );

      window.removeEventListener(
        "trashUpdated",
        handleTrashUpdated
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );

      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const companies: string[] =
    Array.from(
      new Set(
        pages
          .map(
            (page: any) =>
              page.company || "Intern"
          )
          .filter(Boolean)
      )
    );

  const departments: string[] =
    Array.from(
      new Set(
        pages
          .map(
            (page: any) =>
              page.category
          )
          .filter(Boolean)
      )
    );

  const allTags: string[] =
    Array.from(
      new Set(
        pages.flatMap(
          (page: any) =>
            page.tags || []
        )
      )
    );

  const favoritePages =
    pages.filter(
      (page: any) =>
        favorites.includes(
          page.slug
        )
    );

  return (
    <aside className="w-72 bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6 h-fit">
      <h2 className="text-xl font-bold mb-6">
        Wiki
      </h2>

      {/* ALLE DOKUMENTE */}
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

      {/* FAVORITEN */}
      {favoritePages.length > 0 && (
        <div className="mb-8">
          <SectionTitle
            icon="⭐"
            title="Favoriten"
          />

          <div className="flex flex-col gap-1">
            {favoritePages.map(
              (page: any) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${encodeURIComponent(
                    page.slug
                  )}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/${page.slug}`
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {page.title}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {/* FIRMEN */}
      <div className="mb-8">
        <SectionTitle
          icon="🏢"
          title="Firmen"
        />

        <div className="flex flex-col gap-1">
          {companies.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Firmen
            </p>
          )}

          {companies.map(
            (company: string) => (
              <Link
                key={company}
                href={wikiCompanyHref(
                  company
                )}
                className={`p-3 rounded-xl transition ${
                  activeCompany === company
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {company}
              </Link>
            )
          )}
        </div>
      </div>

      {/* ABTEILUNGEN */}
      <div className="mb-8">
        <SectionTitle
          icon="👥"
          title="Abteilungen"
        />

        <div className="flex flex-col gap-1">
          {departments.length === 0 && (
            <p className="text-sm text-zinc-400 px-3">
              Keine Abteilungen
            </p>
          )}

          {departments.map(
            (department: string) => (
              <Link
                key={department}
                href={wikiDepartmentHref(
                  department
                )}
                className={`p-3 rounded-xl transition ${
                  activeDepartment === department
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {department}
              </Link>
            )
          )}
        </div>
      </div>

      {/* ZULETZT GEÖFFNET */}
      {recentPages.length > 0 && (
        <div className="mb-8">
          <SectionTitle
            icon="🕒"
            title="Zuletzt geöffnet"
          />

          <div className="flex flex-col gap-1">
            {recentPages.map(
              (page: any) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${encodeURIComponent(
                    page.slug
                  )}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/${page.slug}`
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {page.title}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {/* TAGS */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            setTagsOpen(
              !tagsOpen
            )
          }
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold app-accent-text uppercase">
            <span className="text-base leading-none">
              #
            </span>

            <span>
              Tags
            </span>
          </h3>

          <span className="text-zinc-500">
            {tagsOpen
              ? "−"
              : "+"}
          </span>
        </button>

        {tagsOpen && (
          <div className="flex flex-wrap gap-2">
            {allTags.length === 0 && (
              <p className="text-sm text-zinc-400 px-3">
                Keine Tags
              </p>
            )}

            {allTags.map(
              (tag: string) => (
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
        )}
      </div>

      {/* ADMIN */}
      {admin && (
        <div>
          <SectionTitle
            icon="🛡️"
            title="Admin"
          />

          <Link
            href="/wiki/trash"
            className={`flex items-center justify-between p-3 rounded-xl transition ${
              pathname === "/wiki/trash"
                ? "bg-zinc-900 text-white"
                : "hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <span>
              🗑️ Papierkorb
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                pathname === "/wiki/trash"
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {trashCount}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}