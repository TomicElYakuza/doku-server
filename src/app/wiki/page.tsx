"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getStoredPages,
} from "../../lib/wikiStorage";

import {
  canCreate,
} from "../../lib/permissions";

import {
  getUser,
} from "../../lib/userStorage";

import {
  getVersions,
} from "../../lib/versionStorage";

import {
  getFavorites,
} from "../../lib/favoritesStorage";

import {
  getComments,
} from "../../lib/commentStorage";

import {
  getFiles,
} from "../../lib/fileStorage";

export default function WikiPage() {
  const [search, setSearch] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("updated-desc");

  const [viewMode, setViewMode] =
    useState<"cards" | "table">("cards");

  const [onlyMine, setOnlyMine] =
    useState(false);

  const [onlyFavorites, setOnlyFavorites] =
    useState(false);

  const [pages, setPages] =
    useState<any[]>([]);

  const [user, setUser] =
    useState<any>(null);

  const [mounted, setMounted] =
    useState(false);

  const [comments, setComments] =
    useState<any>({});

  const [files, setFiles] =
    useState<any>({});

  const [versions, setVersions] =
    useState<any>({});

  const [favorites, setFavorites] =
    useState<string[]>([]);

  function loadPages() {
    setPages(getStoredPages());
  }

  function loadFavorites() {
    setFavorites(getFavorites());
  }

  function loadMetaData() {
    setComments(getComments());

    setFiles(getFiles());

    setVersions(getVersions());
  }

  useEffect(() => {
    setMounted(true);

    loadPages();

    setUser(getUser());

    loadFavorites();

    loadMetaData();

    function handleWikiPagesUpdated() {
      loadPages();
    }

    function handleFavoritesUpdated() {
      loadFavorites();
    }

    function handleCommentsUpdated() {
      loadMetaData();
    }

    function handleFilesUpdated() {
      loadMetaData();
    }

    function handleVersionsUpdated() {
      loadMetaData();
    }

    function handleUserUpdated() {
      setUser(getUser());
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
      "commentsUpdated",
      handleCommentsUpdated
    );

    window.addEventListener(
      "filesUpdated",
      handleFilesUpdated
    );

    window.addEventListener(
      "versionsUpdated",
      handleVersionsUpdated
    );

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
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
        "commentsUpdated",
        handleCommentsUpdated
      );

      window.removeEventListener(
        "filesUpdated",
        handleFilesUpdated
      );

      window.removeEventListener(
        "versionsUpdated",
        handleVersionsUpdated
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

  function parseDate(value: string) {
    if (!value) {
      return 0;
    }

    const parts =
      value.split(".");

    if (parts.length >= 3) {
      const day =
        Number(parts[0]);

      const month =
        Number(parts[1]) - 1;

      const year =
        Number(parts[2]);

      return new Date(
        year,
        month,
        day
      ).getTime();
    }

    return new Date(value).getTime();
  }

  function getCommentCount(slug: string) {
    return comments[slug]?.length || 0;
  }

  function getFileCount(slug: string) {
    return files[slug]?.length || 0;
  }

  function getVersionCount(slug: string) {
    return versions[slug]?.length || 0;
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

  const tags: string[] = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

  const versionCount = (
    Object.values(
      versions
    ) as any[]
  ).reduce(
    (
      acc: number,
      current: any
    ) => {
      if (Array.isArray(current)) {
        return acc + current.length;
      }

      return acc;
    },
    0
  );

  const filteredPages =
    pages.filter((page: any) => {
      const query =
        search.toLowerCase();

      const pageCompany =
        page.company || "Intern";

      const matchesSearch =
        page.title
          ?.toLowerCase()
          .includes(query) ||
        page.description
          ?.toLowerCase()
          .includes(query) ||
        pageCompany
          ?.toLowerCase()
          .includes(query) ||
        page.category
          ?.toLowerCase()
          .includes(query) ||
        page.content
          ?.toLowerCase()
          .includes(query) ||
        page.author
          ?.toLowerCase()
          .includes(query) ||
        page.tags?.some(
          (tag: string) =>
            tag
              .toLowerCase()
              .includes(query)
        );

      const matchesCompany =
        !companyFilter ||
        pageCompany ===
          companyFilter;

      const matchesDepartment =
        !departmentFilter ||
        page.category ===
          departmentFilter;

      const matchesTag =
        !tagFilter ||
        page.tags?.includes(
          tagFilter
        );

      const matchesMine =
        !onlyMine ||
        page.author === user?.name;

      const matchesFavorite =
        !onlyFavorites ||
        favorites.includes(
          page.slug
        );

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesTag &&
        matchesMine &&
        matchesFavorite
      );
    });

  const sortedPages = [
    ...filteredPages,
  ].sort((a: any, b: any) => {
    if (sortBy === "title-asc") {
      return a.title.localeCompare(
        b.title
      );
    }

    if (sortBy === "title-desc") {
      return b.title.localeCompare(
        a.title
      );
    }

    if (sortBy === "company-asc") {
      return (a.company || "Intern").localeCompare(
        b.company || "Intern"
      );
    }

    if (sortBy === "category-asc") {
      return a.category.localeCompare(
        b.category
      );
    }

    if (sortBy === "updated-asc") {
      return (
        parseDate(a.updatedAt) -
        parseDate(b.updatedAt)
      );
    }

    return (
      parseDate(b.updatedAt) -
      parseDate(a.updatedAt)
    );
  });

  function resetFilters() {
    setSearch("");

    setCompanyFilter("");

    setDepartmentFilter("");

    setTagFilter("");

    setSortBy("updated-desc");

    setOnlyMine(false);

    setOnlyFavorites(false);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">
            Wiki
          </h1>

          <p className="text-zinc-500 mt-2">
            Unternehmensdokumentation
          </p>
        </div>

        {canCreate() && (
          <div>
            <Link
              href="/wiki/create"
              className="inline-flex bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Neue Seite
            </Link>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {pages.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {companies.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {departments.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {tags.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Versionen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {versionCount}
          </h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            Suche & Filter
          </h2>

          <div className="flex bg-zinc-100 rounded-2xl p-1">
            <button
              onClick={() =>
                setViewMode("cards")
              }
              className={`px-4 py-2 rounded-xl text-sm transition ${
                viewMode === "cards"
                  ? "bg-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Karten
            </button>

            <button
              onClick={() =>
                setViewMode("table")
              }
              className={`px-4 py-2 rounded-xl text-sm transition ${
                viewMode === "table"
                  ? "bg-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        {/* QUICK FILTERS */}
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={() =>
              setOnlyMine(!onlyMine)
            }
            className={`px-4 py-2 rounded-xl text-sm transition ${
              onlyMine
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 hover:bg-zinc-200"
            }`}
          >
            Meine Dokumente
          </button>

          <button
            onClick={() =>
              setOnlyFavorites(
                !onlyFavorites
              )
            }
            className={`px-4 py-2 rounded-xl text-sm transition ${
              onlyFavorites
                ? "bg-yellow-500 text-white"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
            }`}
          >
            Favoriten
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-5">
          <input
            type="text"
            placeholder="Dokumente, Firmen, Abteilungen, Tags, Autoren oder Inhalte suchen..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="lg:col-span-2 w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={companyFilter}
            onChange={(event) =>
              setCompanyFilter(
                event.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map(
              (company) => (
                <option
                  key={company}
                  value={company}
                >
                  {company}
                </option>
              )
            )}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>

          <select
            value={tagFilter}
            onChange={(event) =>
              setTagFilter(
                event.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Tags
            </option>

            {tags.map((tag) => (
              <option
                key={tag}
                value={tag}
              >
                #{tag}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="updated-desc">
              Neueste zuerst
            </option>

            <option value="updated-asc">
              Älteste zuerst
            </option>

            <option value="title-asc">
              Titel A-Z
            </option>

            <option value="title-desc">
              Titel Z-A
            </option>

            <option value="company-asc">
              Firma A-Z
            </option>

            <option value="category-asc">
              Abteilung A-Z
            </option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {sortedPages.length} von{" "}
            {pages.length} Dokumenten gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {sortedPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-zinc-500">
            Keine Dokumente gefunden.
          </p>
        </div>
      )}

      {/* CARDS */}
      {viewMode === "cards" && (
        <div className="grid gap-4">
          {sortedPages.map(
            (page: any) => (
              <div
                key={page.slug}
                className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      {page.company || "Intern"}
                    </span>

                    <Link
                      href={`/wiki/department/${encodeURIComponent(
                        page.category
                      )}`}
                      className="text-sm bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      {page.category}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {favorites.includes(
                      page.slug
                    ) && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        Favorit
                      </span>
                    )}

                    <span className="text-xs bg-zinc-100 px-3 py-1 rounded-full">
                      Dokument
                    </span>
                  </div>
                </div>

                <Link
                  href={`/wiki/${page.slug}`}
                  className="block mt-3"
                >
                  <h2 className="text-xl font-semibold hover:underline">
                    {page.title}
                  </h2>
                </Link>

                <p className="text-zinc-600 mt-2">
                  {page.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {page.tags?.map(
                    (tag: string) => (
                      <Link
                        key={tag}
                        href={`/wiki/tag/${encodeURIComponent(
                          tag
                        )}`}
                        className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                      >
                        #{tag}
                      </Link>
                    )
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Kommentare
                    </p>

                    <p className="font-semibold mt-1">
                      {getCommentCount(
                        page.slug
                      )}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Anhänge
                    </p>

                    <p className="font-semibold mt-1">
                      {getFileCount(
                        page.slug
                      )}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Versionen
                    </p>

                    <p className="font-semibold mt-1">
                      {getVersionCount(
                        page.slug
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                  <p className="text-sm text-zinc-500">
                    {page.author}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {page.updatedAt}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* TABLE */}
      {viewMode === "table" && (
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">
                  Titel
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Firma
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Abteilung
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Tags
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Aktivität
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Autor
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Aktualisiert
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedPages.map(
                (page: any) => (
                  <tr
                    key={page.slug}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/wiki/${page.slug}`}
                        className="font-medium hover:underline"
                      >
                        {page.title}
                      </Link>

                      <p className="text-zinc-500 mt-1">
                        {page.description}
                      </p>

                      {favorites.includes(
                        page.slug
                      ) && (
                        <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Favorit
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {page.company || "Intern"}
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      <Link
                        href={`/wiki/department/${encodeURIComponent(
                          page.category
                        )}`}
                        className="hover:underline"
                      >
                        {page.category}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {page.tags?.map(
                          (
                            tag: string
                          ) => (
                            <Link
                              key={tag}
                              href={`/wiki/tag/${encodeURIComponent(
                                tag
                              )}`}
                              className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                            >
                              #{tag}
                            </Link>
                          )
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      <div className="flex flex-col gap-1">
                        <span>
                          💬{" "}
                          {getCommentCount(
                            page.slug
                          )}
                        </span>

                        <span>
                          📎{" "}
                          {getFileCount(
                            page.slug
                          )}
                        </span>

                        <span>
                          🕓{" "}
                          {getVersionCount(
                            page.slug
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {page.author}
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {page.updatedAt}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}