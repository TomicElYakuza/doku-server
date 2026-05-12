"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { wikiPages } from "@/data/wiki";

import {
  getFavorites,
} from "@/lib/favoritesStorage";

import {
  getRecentPages,
} from "@/lib/recentStorage";

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

  const [departmentsOpen, setDepartmentsOpen] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const storedPages = JSON.parse(
      localStorage.getItem("wiki-pages") ||
        "[]"
    );

    const allPages =
      storedPages.length > 0
        ? storedPages
        : wikiPages;

    setPages(allPages);

    const recentSlugs =
      getRecentPages();

    const recent = allPages.filter(
      (page: any) =>
        recentSlugs.includes(page.slug)
    );

    setRecentPages(recent);

    function loadFavorites() {
      setFavorites(getFavorites());
    }

    loadFavorites();

    window.addEventListener(
      "favoritesUpdated",
      loadFavorites
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        loadFavorites
      );
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const departments: string[] = [
    ...new Set(
      pages.map(
        (page: any) => page.category
      )
    ),
  ];

  const allTags = [
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
                  className="p-3 rounded-xl hover:bg-blue-50 transition"
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
                  className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition"
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
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
            Tags
          </h3>

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag: any) => (
              <a
                key={tag}
                href={`/wiki/tag/${tag}`}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm px-3 py-1 rounded-full transition"
              >
                #{tag}
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}