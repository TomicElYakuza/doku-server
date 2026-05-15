"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { wikiPages } from "../../data/wiki";

import {
  getFavorites,
} from "../../lib/favoritesStorage";

import {
  getRecentPages,
} from "../../lib/recentStorage";

import {
  isAdmin,
} from "../../lib/permissions";

export default function WikiSidebar() {
  const pathname = usePathname();

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

  const [departmentsOpen, setDepartmentsOpen] =
    useState(false);

  const [admin, setAdmin] =
    useState(false);

  function getAllPages() {
    const storedPages = JSON.parse(
      localStorage.getItem("wiki-pages") ||
        "[]"
    );

    return storedPages.length > 0
      ? storedPages
      : wikiPages;
  }

  function loadPages() {
    const allPages = getAllPages();

    setPages(allPages);

    loadRecentPages(allPages);
  }

  function loadFavorites() {
    setFavorites(getFavorites());
  }

  function loadRecentPages(
    allPages = getAllPages()
  ) {
    const recentSlugs =
      getRecentPages();

    const recent = recentSlugs
      .map((slug) =>
        allPages.find(
          (page: any) =>
            page.slug === slug
        )
      )
      .filter(Boolean);

    setRecentPages(recent);
  }

  function loadTrashCount() {
    const trash = JSON.parse(
      localStorage.getItem("wiki-trash") ||
        "[]"
    );

    setTrashCount(trash.length);
  }

  useEffect(() => {
    setMounted(true);

    setAdmin(isAdmin());

    loadPages();

    loadFavorites();

    loadTrashCount();

    window.addEventListener(
      "favoritesUpdated",
      loadFavorites
    );

    window.addEventListener(
      "recentUpdated",
      () => loadRecentPages()
    );

    window.addEventListener(
      "trashUpdated",
      loadTrashCount
    );

    window.addEventListener(
      "wikiPagesUpdated",
      loadPages
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        loadFavorites
      );

      window.removeEventListener(
        "recentUpdated",
        () => loadRecentPages()
      );

      window.removeEventListener(
        "trashUpdated",
        loadTrashCount
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        loadPages
      );
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const departments: string[] = [
    ...new Set(
      pages.map(
        (page: any) =>
          page.category
      )
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

  const favoritePages = pages.filter(
    (page: any) =>
      favorites.includes(page.slug)
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

      {/* RECENT */}
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
            {departments.map(
              (department: string) => (
                <Link
                  key={department}
                  href={`/wiki/department/${department}`}
                  className={`p-3 rounded-xl transition ${
                    pathname ===
                    `/wiki/department/${department}`
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
            {allTags.map((tag: string) => (
              <a
                key={tag}
                href={`/wiki/tag/${tag}`}
                className={`text-sm px-3 py-1 rounded-full transition ${
                  pathname ===
                  `/wiki/tag/${tag}`
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                #{tag}
              </a>
            ))}
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