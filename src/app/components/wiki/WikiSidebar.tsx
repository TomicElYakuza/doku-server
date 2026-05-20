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
} from "../../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../../lib/wikiRepository";

import {
  getFavorites,
} from "../../../lib/favoritesStorage";

import {
  getRecentPages,
} from "../../../lib/recentStorage";

import {
  getTrashPages,
} from "../../../lib/trashStorage";

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

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [recentPages, setRecentPages] =
    useState<string[]>([]);

  const [trashCount, setTrashCount] =
    useState(0);

  useEffect(() => {
    loadData();

    function handleWikiPagesUpdated() {
      loadData();
    }

    function handleFavoritesUpdated() {
      setFavorites(
        getFavorites()
      );
    }

    function handleRecentUpdated() {
      setRecentPages(
        getRecentPages()
      );
    }

    function handleTrashUpdated() {
      setTrashCount(
        getTrashPages().length
      );
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

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

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );

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
    };
  }, []);

  function loadData() {
    setPages(
      wikiRepository.list()
    );

    setFavorites(
      getFavorites()
    );

    setRecentPages(
      getRecentPages()
    );

    setTrashCount(
      getTrashPages().length
    );
  }

  const companyParam =
    searchParams.get("company") || "";

  const departmentParam =
    searchParams.get("department") || "";

  const tagParam =
    searchParams.get("tag") || "";

  const favoritesParam =
    searchParams.get("favorites") === "true";

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

  const recentPageItems =
    recentPages
      .map(
        (slug) =>
          pages.find(
            (page) =>
              getPageSlug(
                page
              ) === slug
          )
      )
      .filter(Boolean)
      .slice(
        0,
        5
      ) as WikiPage[];

  const favoritePageItems =
    favorites
      .map(
        (slug) =>
          pages.find(
            (page) =>
              getPageSlug(
                page
              ) === slug
          )
      )
      .filter(Boolean)
      .slice(
        0,
        5
      ) as WikiPage[];

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
              Favoriten
            </p>

            <p className="text-2xl font-bold mt-1">
              {favorites.length}
            </p>
          </div>
        </div>

        <div className="space-y-1 mt-5">
          <Link
            href="/wiki"
            className={getLinkClass(
              pathname === "/wiki" &&
              !companyParam &&
              !departmentParam &&
              !tagParam &&
              !favoritesParam
            )}
          >
            <span>
              Alle Dokumente
            </span>

            <span className={getBadgeClass(false)}>
              {pages.length}
            </span>
          </Link>

          <Link
            href="/wiki?favorites=true"
            className={getLinkClass(
              favoritesParam
            )}
          >
            <span>
              Favoriten
            </span>

            <span className={getBadgeClass(
              favoritesParam
            )}
            >
              {favorites.length}
            </span>
          </Link>

          <Link
            href="/wiki/trash"
            className={getLinkClass(
              pathname === "/wiki/trash"
            )}
          >
            <span>
              Papierkorb
            </span>

            <span className={getBadgeClass(
              pathname === "/wiki/trash"
            )}
            >
              {trashCount}
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
          Zuletzt geöffnet
        </h3>

        <div className="space-y-3 mt-4">
          {recentPageItems.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine Seiten geöffnet.
            </p>
          )}

          {recentPageItems.map(
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
          Favoriten
        </h3>

        <div className="space-y-3 mt-4">
          {favoritePageItems.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine Favoriten.
            </p>
          )}

          {favoritePageItems.map(
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