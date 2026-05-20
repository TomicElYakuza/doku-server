"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import type {
  WikiPage as StoredWikiPage,
} from "../../lib/wikiRepository";

import {
  fileRepository,
} from "../../lib/fileRepository";

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
  canCreate,
} from "../../lib/permissions";

import {
  getUser,
} from "../../lib/userStorage";

type ViewMode =
  | "cards"
  | "table";

type WikiPageItem =
  StoredWikiPage & {
    slug: string;
    title: string;
    description?: string;
    content?: string;
    company?: string;
    category?: string;
    department?: string;
    author?: string;
    updatedAt?: string;
    createdAt?: string;
    tags?: string[];
  };

type CurrentUser = {
  name?: string;
  email?: string;
  role?: string;
} | null;

type CommentMap = Record<
  string,
  unknown[]
>;

type VersionMap = Record<
  string,
  unknown[]
>;

function normalizeSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPageSlug(
  page: WikiPageItem
) {
  return (
    page.slug ||
    normalizeSlug(
      page.title ||
        "unbenannt"
    )
  );
}

function getPageTitle(
  page: WikiPageItem
) {
  return (
    page.title ||
    "Unbenanntes Dokument"
  );
}

function getPageDescription(
  page: WikiPageItem
) {
  return (
    page.description ||
    page.excerpt ||
    ""
  );
}

function getPageCompany(
  page: WikiPageItem
) {
  return (
    page.company ||
    "Intern"
  );
}

function getPageDepartment(
  page: WikiPageItem
) {
  return (
    page.department ||
    page.category ||
    "Allgemein"
  );
}

function getPageAuthor(
  page: WikiPageItem
) {
  return (
    page.author ||
    "Unbekannt"
  );
}

function getPageUpdatedAt(
  page: WikiPageItem
) {
  return (
    page.updatedAt ||
    page.createdAt ||
    "Unbekannt"
  );
}

function getPageTags(
  page: WikiPageItem
) {
  if (
    Array.isArray(
      page.tags
    )
  ) {
    return page.tags;
  }

  return [];
}

function parseDate(
  value?: string
) {
  if (!value) {
    return 0;
  }

  const parts =
    value.split(
      "."
    );

  if (parts.length >= 3) {
    const day =
      Number(
        parts[0]
      );

    const month =
      Number(
        parts[1]
      ) - 1;

    const year =
      Number(
        parts[2]
      );

    return new Date(
      year,
      month,
      day
    ).getTime();
  }

  return new Date(
    value
  ).getTime();
}

export default function WikiPage() {
  const searchParams =
    useSearchParams();

  const [mounted, setMounted] =
    useState(false);

  const [pages, setPages] =
    useState<WikiPageItem[]>([]);

  const [user, setUser] =
    useState<CurrentUser>(null);

  const [comments, setComments] =
    useState<CommentMap>({});

  const [versions, setVersions] =
    useState<VersionMap>({});

  const [favorites, setFavorites] =
    useState<string[]>([]);

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
    useState<ViewMode>("cards");

  const [onlyMine, setOnlyMine] =
    useState(false);

  const [onlyFavorites, setOnlyFavorites] =
    useState(false);

  useEffect(() => {
    setMounted(
      true
    );

    loadPages();
    loadFavorites();
    loadMetaData();

    setUser(
      getUser()
    );

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
      setUser(
        getUser()
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

  useEffect(() => {
    applyUrlFilters();
  }, [
    searchParams,
  ]);

  function loadPages() {
    setPages(
      wikiRepository.list() as WikiPageItem[]
    );
  }

  function loadFavorites() {
    setFavorites(
      getFavorites()
    );
  }

  function loadMetaData() {
    setComments(
      getComments() as CommentMap
    );

    setVersions(
      getVersions() as VersionMap
    );
  }

  function applyUrlFilters() {
    const view =
      searchParams.get(
        "view"
      ) || "cards";

    setSearch(
      searchParams.get(
        "q"
      ) || ""
    );

    setCompanyFilter(
      searchParams.get(
        "company"
      ) || ""
    );

    setDepartmentFilter(
      searchParams.get(
        "department"
      ) || ""
    );

    setTagFilter(
      searchParams.get(
        "tag"
      ) || ""
    );

    setSortBy(
      searchParams.get(
        "sort"
      ) || "updated-desc"
    );

    setViewMode(
      view === "table"
        ? "table"
        : "cards"
    );

    setOnlyMine(
      searchParams.get(
        "mine"
      ) === "true"
    );

    setOnlyFavorites(
      searchParams.get(
        "favorites"
      ) === "true"
    );
  }

  function applyUrlFiltersFromValues(
    nextSearch: string,
    nextCompany: string,
    nextDepartment: string,
    nextTag: string,
    nextSort: string,
    nextView: ViewMode,
    nextMine: boolean,
    nextFavorites: boolean
  ) {
    setSearch(
      nextSearch
    );

    setCompanyFilter(
      nextCompany
    );

    setDepartmentFilter(
      nextDepartment
    );

    setTagFilter(
      nextTag
    );

    setSortBy(
      nextSort
    );

    setViewMode(
      nextView
    );

    setOnlyMine(
      nextMine
    );

    setOnlyFavorites(
      nextFavorites
    );
  }

  function updateUrlFilters(
    nextSearch: string,
    nextCompany: string,
    nextDepartment: string,
    nextTag: string,
    nextSort: string,
    nextView: ViewMode,
    nextMine: boolean,
    nextFavorites: boolean
  ) {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams();

    if (nextSearch) {
      params.set(
        "q",
        nextSearch
      );
    }

    if (nextCompany) {
      params.set(
        "company",
        nextCompany
      );
    }

    if (nextDepartment) {
      params.set(
        "department",
        nextDepartment
      );
    }

    if (nextTag) {
      params.set(
        "tag",
        nextTag
      );
    }

    if (
      nextSort &&
      nextSort !== "updated-desc"
    ) {
      params.set(
        "sort",
        nextSort
      );
    }

    if (nextView !== "cards") {
      params.set(
        "view",
        nextView
      );
    }

    if (nextMine) {
      params.set(
        "mine",
        "true"
      );
    }

    if (nextFavorites) {
      params.set(
        "favorites",
        "true"
      );
    }

    const query =
      params.toString();

    const nextUrl =
      query
        ? `/wiki?${query}`
        : "/wiki";

    window.history.pushState(
      null,
      "",
      nextUrl
    );

    applyUrlFiltersFromValues(
      nextSearch,
      nextCompany,
      nextDepartment,
      nextTag,
      nextSort,
      nextView,
      nextMine,
      nextFavorites
    );
  }

  function getCommentCount(
    slug: string
  ) {
    return (
      comments[slug]?.length ||
      0
    );
  }

  function getFileCount(
    slug: string
  ) {
    return fileRepository.countFilesForKey(
      slug
    );
  }

  function getVersionCount(
    slug: string
  ) {
    return (
      versions[slug]?.length ||
      0
    );
  }

  function resetFilters() {
    updateUrlFilters(
      "",
      "",
      "",
      "",
      "updated-desc",
      viewMode,
      false,
      false
    );
  }

  if (!mounted) {
    return null;
  }

  const companies =
    Array.from(
      new Set(
        pages
          .map(
            (page) =>
              getPageCompany(
                page
              )
          )
          .filter(Boolean)
      )
    );

  const departments =
    Array.from(
      new Set(
        pages
          .map(
            (page) =>
              getPageDepartment(
                page
              )
          )
          .filter(Boolean)
      )
    );

  const tags =
    Array.from(
      new Set(
        pages.flatMap(
          (page) =>
            getPageTags(
              page
            )
        )
      )
    );

  const versionCount =
    Object.values(
      versions
    ).reduce(
      (acc, current) => {
        if (
          Array.isArray(
            current
          )
        ) {
          return (
            acc +
            current.length
          );
        }

        return acc;
      },
      0
    );

  const filteredPages =
    pages.filter(
      (page) => {
        const query =
          search.toLowerCase();

        const pageSlug =
          getPageSlug(
            page
          );

        const pageTitle =
          getPageTitle(
            page
          );

        const pageDescription =
          getPageDescription(
            page
          );

        const pageCompany =
          getPageCompany(
            page
          );

        const pageDepartment =
          getPageDepartment(
            page
          );

        const pageAuthor =
          getPageAuthor(
            page
          );

        const pageContent =
          String(
            page.content ||
              ""
          );

        const pageTags =
          getPageTags(
            page
          );

        const matchesSearch =
          !query ||
          pageSlug
            .toLowerCase()
            .includes(
              query
            ) ||
          pageTitle
            .toLowerCase()
            .includes(
              query
            ) ||
          pageDescription
            .toLowerCase()
            .includes(
              query
            ) ||
          pageCompany
            .toLowerCase()
            .includes(
              query
            ) ||
          pageDepartment
            .toLowerCase()
            .includes(
              query
            ) ||
          pageContent
            .toLowerCase()
            .includes(
              query
            ) ||
          pageAuthor
            .toLowerCase()
            .includes(
              query
            ) ||
          pageTags.some(
            (tag) =>
              tag
                .toLowerCase()
                .includes(
                  query
                )
          );

        const matchesCompany =
          !companyFilter ||
          pageCompany === companyFilter;

        const matchesDepartment =
          !departmentFilter ||
          pageDepartment === departmentFilter;

        const matchesTag =
          !tagFilter ||
          pageTags.includes(
            tagFilter
          );

        const matchesMine =
          !onlyMine ||
          pageAuthor === user?.name;

        const matchesFavorite =
          !onlyFavorites ||
          favorites.includes(
            pageSlug
          );

        return (
          matchesSearch &&
          matchesCompany &&
          matchesDepartment &&
          matchesTag &&
          matchesMine &&
          matchesFavorite
        );
      }
    );

  const sortedPages =
    [
      ...filteredPages,
    ].sort(
      (a, b) => {
        const titleA =
          getPageTitle(
            a
          );

        const titleB =
          getPageTitle(
            b
          );

        const companyA =
          getPageCompany(
            a
          );

        const companyB =
          getPageCompany(
            b
          );

        const departmentA =
          getPageDepartment(
            a
          );

        const departmentB =
          getPageDepartment(
            b
          );

        if (sortBy === "title-asc") {
          return titleA.localeCompare(
            titleB
          );
        }

        if (sortBy === "title-desc") {
          return titleB.localeCompare(
            titleA
          );
        }

        if (sortBy === "company-asc") {
          return companyA.localeCompare(
            companyB
          );
        }

        if (sortBy === "category-asc") {
          return departmentA.localeCompare(
            departmentB
          );
        }

        if (sortBy === "updated-asc") {
          return (
            parseDate(
              getPageUpdatedAt(
                a
              )
            ) -
            parseDate(
              getPageUpdatedAt(
                b
              )
            )
          );
        }

        return (
          parseDate(
            getPageUpdatedAt(
              b
            )
          ) -
          parseDate(
            getPageUpdatedAt(
              a
            )
          )
        );
      }
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Wiki
          </h1>

          <p className="text-zinc-500 mt-2">
            Unternehmensdokumentation
          </p>
        </div>

        {canCreate() && (
          <Link
            href="/wiki/new"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Neue Seite
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <button
          type="button"
          onClick={() =>
            resetFilters()
          }
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-zinc-50 transition shadow-sm"
        >
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pages.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() => {
            if (companies.length > 0) {
              updateUrlFilters(
                search,
                companies[0],
                departmentFilter,
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-indigo-50 transition shadow-sm"
        >
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() => {
            if (departments.length > 0) {
              updateUrlFilters(
                search,
                companyFilter,
                departments[0],
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-indigo-50 transition shadow-sm"
        >
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departments.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() => {
            if (tags.length > 0) {
              updateUrlFilters(
                search,
                companyFilter,
                departmentFilter,
                tags[0],
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
              );
            }
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 text-left hover:bg-zinc-50 transition shadow-sm"
        >
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tags.length}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Versionen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {versionCount}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Dokumenten, Firmen, Abteilungen, Tags und Inhalten.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() =>
                updateUrlFilters(
                  search,
                  companyFilter,
                  departmentFilter,
                  tagFilter,
                  sortBy,
                  "cards",
                  onlyMine,
                  onlyFavorites
                )
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
              type="button"
              onClick={() =>
                updateUrlFilters(
                  search,
                  companyFilter,
                  departmentFilter,
                  tagFilter,
                  sortBy,
                  "table",
                  onlyMine,
                  onlyFavorites
                )
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

        <div className="flex flex-wrap gap-2 mt-5">
          <button
            type="button"
            onClick={() =>
              updateUrlFilters(
                search,
                companyFilter,
                departmentFilter,
                tagFilter,
                sortBy,
                viewMode,
                !onlyMine,
                onlyFavorites
              )
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
            type="button"
            onClick={() =>
              updateUrlFilters(
                search,
                companyFilter,
                departmentFilter,
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
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
            value={search}
            onChange={(event) =>
              updateUrlFilters(
                event.target.value,
                companyFilter,
                departmentFilter,
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
              )
            }
            placeholder="Suche nach Titel, Inhalt, Firma, Abteilung, Autor oder Tag..."
            className="lg:col-span-2 w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={companyFilter}
            onChange={(event) =>
              updateUrlFilters(
                search,
                event.target.value,
                departmentFilter,
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
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
              updateUrlFilters(
                search,
                companyFilter,
                event.target.value,
                tagFilter,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
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
              updateUrlFilters(
                search,
                companyFilter,
                departmentFilter,
                event.target.value,
                sortBy,
                viewMode,
                onlyMine,
                onlyFavorites
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Tags
            </option>

            {tags.map(
              (tag) => (
                <option
                  key={tag}
                  value={tag}
                >
                  #{tag}
                </option>
              )
            )}
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              updateUrlFilters(
                search,
                companyFilter,
                departmentFilter,
                tagFilter,
                event.target.value,
                viewMode,
                onlyMine,
                onlyFavorites
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

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {sortedPages.length} von{" "}
            {pages.length} Dokumenten gefunden
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {sortedPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Keine Dokumente gefunden.
          </p>
        </div>
      )}

      {viewMode === "cards" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {sortedPages.map(
            (page) => {
              const pageSlug =
                getPageSlug(
                  page
                );

              const pageTitle =
                getPageTitle(
                  page
                );

              const pageDescription =
                getPageDescription(
                  page
                );

              const pageCompany =
                getPageCompany(
                  page
                );

              const pageDepartment =
                getPageDepartment(
                  page
                );

              const pageAuthor =
                getPageAuthor(
                  page
                );

              const pageUpdatedAt =
                getPageUpdatedAt(
                  page
                );

              const pageTags =
                getPageTags(
                  page
                );

              return (
                <Link
                  key={pageSlug}
                  href={`/wiki/${encodeURIComponent(
                    pageSlug
                  )}`}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();

                        updateUrlFilters(
                          search,
                          pageCompany,
                          departmentFilter,
                          tagFilter,
                          sortBy,
                          viewMode,
                          onlyMine,
                          onlyFavorites
                        );
                      }}
                      className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                    >
                      {pageCompany}
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();

                        updateUrlFilters(
                          search,
                          companyFilter,
                          pageDepartment,
                          tagFilter,
                          sortBy,
                          viewMode,
                          onlyMine,
                          onlyFavorites
                        );
                      }}
                      className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                    >
                      {pageDepartment}
                    </button>

                    {favorites.includes(
                      pageSlug
                    ) && (
                      <span className="text-sm bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                        Favorit
                      </span>
                    )}

                    <span className="text-sm bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      Dokument
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-5">
                    {pageTitle}
                  </h2>

                  <p className="text-zinc-500 mt-2 line-clamp-2">
                    {pageDescription}
                  </p>

                  {pageTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {pageTags.map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();

                              updateUrlFilters(
                                search,
                                companyFilter,
                                departmentFilter,
                                tag,
                                sortBy,
                                viewMode,
                                onlyMine,
                                onlyFavorites
                              );
                            }}
                            className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                          >
                            #{tag}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mt-6 text-sm text-zinc-500">
                    <div>
                      <p>
                        Kommentare
                      </p>

                      <p className="font-semibold text-zinc-900 mt-1">
                        {getCommentCount(
                          pageSlug
                        )}
                      </p>
                    </div>

                    <div>
                      <p>
                        Anhänge
                      </p>

                      <p className="font-semibold text-zinc-900 mt-1">
                        {getFileCount(
                          pageSlug
                        )}
                      </p>
                    </div>

                    <div>
                      <p>
                        Versionen
                      </p>

                      <p className="font-semibold text-zinc-900 mt-1">
                        {getVersionCount(
                          pageSlug
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between gap-3 text-sm text-zinc-500 mt-6 pt-4 border-t border-zinc-100">
                    <span>
                      {pageAuthor}
                    </span>

                    <span>
                      {pageUpdatedAt}
                    </span>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Titel
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Firma
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Abteilung
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Tags
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Aktivität
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Autor
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Aktualisiert
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedPages.map(
                  (page) => {
                    const pageSlug =
                      getPageSlug(
                        page
                      );

                    const pageTitle =
                      getPageTitle(
                        page
                      );

                    const pageDescription =
                      getPageDescription(
                        page
                      );

                    const pageCompany =
                      getPageCompany(
                        page
                      );

                    const pageDepartment =
                      getPageDepartment(
                        page
                      );

                    const pageAuthor =
                      getPageAuthor(
                        page
                      );

                    const pageUpdatedAt =
                      getPageUpdatedAt(
                        page
                      );

                    const pageTags =
                      getPageTags(
                        page
                      );

                    return (
                      <tr
                        key={pageSlug}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 min-w-[260px]">
                          <Link
                            href={`/wiki/${encodeURIComponent(
                              pageSlug
                            )}`}
                            className="font-semibold hover:text-zinc-600 transition"
                          >
                            {pageTitle}
                          </Link>

                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                            {pageDescription}
                          </p>

                          {favorites.includes(
                            pageSlug
                          ) && (
                            <span className="inline-flex mt-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                              Favorit
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              updateUrlFilters(
                                search,
                                pageCompany,
                                departmentFilter,
                                tagFilter,
                                sortBy,
                                viewMode,
                                onlyMine,
                                onlyFavorites
                              )
                            }
                            className="hover:underline text-indigo-700"
                          >
                            {pageCompany}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              updateUrlFilters(
                                search,
                                companyFilter,
                                pageDepartment,
                                tagFilter,
                                sortBy,
                                viewMode,
                                onlyMine,
                                onlyFavorites
                              )
                            }
                            className="hover:underline text-indigo-700"
                          >
                            {pageDepartment}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {pageTags.map(
                              (tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    updateUrlFilters(
                                      search,
                                      companyFilter,
                                      departmentFilter,
                                      tag,
                                      sortBy,
                                      viewMode,
                                      onlyMine,
                                      onlyFavorites
                                    )
                                  }
                                  className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                                >
                                  #{tag}
                                </button>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          <span>
                            💬{" "}
                            {getCommentCount(
                              pageSlug
                            )}
                          </span>

                          <span className="ml-3">
                            📎{" "}
                            {getFileCount(
                              pageSlug
                            )}
                          </span>

                          <span className="ml-3">
                            🕘{" "}
                            {getVersionCount(
                              pageSlug
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {pageAuthor}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          {pageUpdatedAt}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}