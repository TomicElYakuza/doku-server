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

  const categories: string[] = [
    ...new Set(
      pages.map(
        (page: any) => page.category
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

      {/* KATEGORIEN */}
      <div className="space-y-6">
        {categories.map(
          (category: string) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
                {category}
              </h3>

              <div className="flex flex-col gap-1">
                {pages
                  .filter(
                    (page: any) =>
                      page.category ===
                      category
                  )
                  .map((page: any) => (
                    <Link
                      key={page.slug}
                      href={`/wiki/${page.slug}`}
                      className={`p-3 rounded-xl transition ${
                        pathname ===
                        `/wiki/${page.slug}`
                          ? "bg-zinc-900 text-white"
                          : "hover:bg-zinc-100"
                      }`}
                    >
                      {page.title}
                    </Link>
                  ))}
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  );
}