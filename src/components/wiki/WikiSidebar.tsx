"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  usePathname,
} from "next/navigation";

import {
  getStoredPages,
} from "@/lib/wikiStorage";

import {
  getFavorites,
} from "@/lib/favoritesStorage";

import {
  getRecentPages,
} from "@/lib/recentStorage";

import {
  getTrashPages,
} from "@/lib/trashStorage";

import {
  isAdmin,
} from "@/lib/permissions";

export default function WikiSidebar() {
  const pathname =
    usePathname();

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

  const [companiesOpen, setCompaniesOpen] =
    useState(false);

  const [departmentsOpen, setDepartmentsOpen] =
    useState(false);

  const [admin, setAdmin] =
    useState(false);

  function loadPages() {
    const allPages =
      getStoredPages();

    setPages(allPages);

    loadRecentPages(allPages);
  }

  function loadFavorites() {
    setFavorites(getFavorites());
  }

  function loadRecentPages(
    allPages = getStoredPages()
  ) {
    const recentSlugs =
      getRecentPages();

    const recent =
      recentSlugs
        .map((slug: string) =>
          allPages.find(
            (page: any) =>
              page.slug === slug
          )
        )
        .filter(Boolean);

    setRecentPages(recent);
  }

  function loadTrashCount() {
    setTrashCount(
      getTrashPages().length
    );
  }

  function loadAdminStatus() {
    setAdmin(isAdmin());
  }

  useEffect(() => {
    setMounted(true);

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

  const companies: string[] = [
    ...new Set(
      pages
        .map(
          (page: any) =>
            page.company || "Intern"
        )
        .filter(Boolean)
    ),
  ];

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

  const allTags: string[] = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

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

      {/* FAVORITEN */}
      {favoritePages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-yellow-600 uppercase mb-3">
            Favoriten
          </h3>

          <div className="flex flex-col gap-1">
            {favoritePages.map(
              (page: any) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/${page.slug}`
                      ? "bg-yellow-500 text-white"
                      : "hover:bg-yellow-50"
                  }`}
                >
                  ⭐ {page.title}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {/* ZULETZT GEÖFFNET */}
      {recentPages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-blue-600 uppercase mb-3">
            Zuletzt geöffnet
          </h3>

          <div className="flex flex-col gap-1">
            {recentPages.map(
              (page: any) => (
                <Link
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
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

      {/* FIRMEN */}
      <div className="mb-8">
        <button
          onClick={() =>
            setCompaniesOpen(
              !companiesOpen
            )
          }
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="text-sm font-semibold text-blue-600 uppercase">
            Firmen
          </h3>

          <span className="text-zinc-500">
            {companiesOpen
              ? "−"
              : "+"}
          </span>
        </button>

        {companiesOpen && (
          <div className="flex flex-col gap-2">
            {companies.length === 0 && (
              <p className="text-sm text-zinc-400 px-3">
                Keine Firmen
              </p>
            )}

            {companies.map(
              (company: string) => (
                <Link
                  key={company}
                  href={`/wiki/company/${encodeURIComponent(
                    company
                  )}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/company/${encodeURIComponent(
                      company
                    )}`
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {company}
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {/* ABTEILUNGEN */}
      <div className="mb-8">
        <button
          onClick={() =>
            setDepartmentsOpen(
              !departmentsOpen
            )
          }
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="text-sm font-semibold text-zinc-500 uppercase">
            Abteilungen
          </h3>

          <span className="text-zinc-500">
            {departmentsOpen
              ? "−"
              : "+"}
          </span>
        </button>

        {departmentsOpen && (
          <div className="flex flex-col gap-2">
            {departments.length === 0 && (
              <p className="text-sm text-zinc-400 px-3">
                Keine Abteilungen
              </p>
            )}

            {departments.map(
              (department: string) => (
                <Link
                  key={department}
                  href={`/wiki/department/${encodeURIComponent(
                    department
                  )}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/department/${encodeURIComponent(
                      department
                    )}`
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 hover:bg-zinc-100"
                  }`}
                >
                  {department}
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {/* TAGS */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
            Tags
          </h3>

          <div className="flex flex-wrap gap-2">
            {allTags.map(
              (tag: string) => (
                <Link
                  key={tag}
                  href={`/wiki/tag/${encodeURIComponent(
                    tag
                  )}`}
                  className={`text-sm px-3 py-1 rounded-full transition ${
                    pathname ===
                    `/wiki/tag/${encodeURIComponent(
                      tag
                    )}`
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
      )}

      {/* ADMIN */}
      {admin && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 uppercase mb-3">
            Admin
          </h3>

          <Link
            href="/wiki/trash"
            className={`flex items-center justify-between p-3 rounded-xl transition ${
              pathname === "/wiki/trash"
                ? "bg-red-600 text-white"
                : "hover:bg-red-50 text-red-600"
            }`}
          >
            <span>
              🗑️ Papierkorb
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                pathname === "/wiki/trash"
                  ? "bg-white text-red-600"
                  : "bg-red-100 text-red-600"
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