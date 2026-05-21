"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { wikiRepository } from "@/lib/wikiRepository";
import { canCreate } from "@/lib/permissions";
import { getCachedCurrentUser } from "@/lib/currentUserRepository";
import type { WikiPage } from "@/types/wiki";

type ViewMode = "cards" | "table";
type LoadState = "idle" | "loading" | "ready" | "error";

const WIKI_VIEW_MODE_KEY = "doku-server:wiki:view-mode";

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "cards";
  }

  const storedValue = window.localStorage.getItem(WIKI_VIEW_MODE_KEY);

  return storedValue === "cards" || storedValue === "table"
    ? storedValue
    : "cards";
}

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseDate(value?: string) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.getTime();
  }

  return 0;
}

function getPageSlug(page: WikiPage) {
  return String(page.slug || "");
}

function getPageTitle(page: WikiPage) {
  return String(page.title || "Unbenannt");
}

function getPageDescription(page: WikiPage) {
  return String(page.description || page.excerpt || "Keine Beschreibung vorhanden.");
}

function getPageCompany(page: WikiPage) {
  return String(page.company || "Intern");
}

function getPageDepartment(page: WikiPage) {
  return String(page.department || page.category || "Allgemein");
}

function getPageCategory(page: WikiPage) {
  return String(page.category || page.department || "Allgemein");
}

function getPageTags(page: WikiPage) {
  if (Array.isArray(page.tags)) {
    return page.tags.map((tag) => String(tag));
  }

  return [];
}

export default function WikiPageIndex() {
  const searchParams = useSearchParams();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [onlyMine, setOnlyMine] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setViewMode(getInitialViewMode());
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setCompanyFilter(searchParams.get("company") || "");
    setDepartmentFilter(searchParams.get("department") || "");
    setCategoryFilter(searchParams.get("category") || "");
    setTagFilter(searchParams.get("tag") || "");
    setSortBy(searchParams.get("sort") || "updated-desc");
    setOnlyMine(searchParams.get("mine") === "true");

    const nextView = searchParams.get("view");

    if (nextView === "cards" || nextView === "table") {
      setViewMode(nextView);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      try {
        setLoadState("loading");
        setError("");

        const nextPages = await wikiRepository.list();

        if (cancelled) {
          return;
        }

        setPages(Array.isArray(nextPages) ? nextPages : []);
        setLoadState("ready");
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setPages([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Wiki-Seiten konnten nicht geladen werden."
          );
          setLoadState("error");
        }
      }
    }

    function handleWikiPagesUpdated() {
      void loadPages();
    }

    void loadPages();

    window.addEventListener("wikiPagesUpdated", handleWikiPagesUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("wikiPagesUpdated", handleWikiPagesUpdated);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WIKI_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  function updateFilters(nextValues: {
    search?: string;
    company?: string;
    department?: string;
    category?: string;
    tag?: string;
    sort?: string;
    view?: ViewMode;
    mine?: boolean;
  }) {
    const nextSearch = nextValues.search ?? search;
    const nextCompany = nextValues.company ?? companyFilter;
    const nextDepartment = nextValues.department ?? departmentFilter;
    const nextCategory = nextValues.category ?? categoryFilter;
    const nextTag = nextValues.tag ?? tagFilter;
    const nextSort = nextValues.sort ?? sortBy;
    const nextView = nextValues.view ?? viewMode;
    const nextMine = nextValues.mine ?? onlyMine;

    setSearch(nextSearch);
    setCompanyFilter(nextCompany);
    setDepartmentFilter(nextDepartment);
    setCategoryFilter(nextCategory);
    setTagFilter(nextTag);
    setSortBy(nextSort);
    setViewMode(nextView);
    setOnlyMine(nextMine);

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();

    if (nextSearch) {
      params.set("q", nextSearch);
    }

    if (nextCompany) {
      params.set("company", nextCompany);
    }

    if (nextDepartment) {
      params.set("department", nextDepartment);
    }

    if (nextCategory) {
      params.set("category", nextCategory);
    }

    if (nextTag) {
      params.set("tag", nextTag);
    }

    if (nextSort && nextSort !== "updated-desc") {
      params.set("sort", nextSort);
    }

    if (nextView !== "cards") {
      params.set("view", nextView);
    }

    if (nextMine) {
      params.set("mine", "true");
    }

    const query = params.toString();

    window.history.pushState(null, "", query ? `/wiki?${query}` : "/wiki");
  }

  function resetFilters() {
    updateFilters({
      search: "",
      company: "",
      department: "",
      category: "",
      tag: "",
      sort: "updated-desc",
      mine: false,
    });
  }

  const isLoading = loadState === "idle" || loadState === "loading";

  const companies = useMemo(
    () =>
      Array.from(new Set(pages.map((page) => getPageCompany(page)).filter(Boolean))).sort(),
    [pages]
  );

  const departments = useMemo(
    () =>
      Array.from(
        new Set(pages.map((page) => getPageDepartment(page)).filter(Boolean))
      ).sort(),
    [pages]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(pages.map((page) => getPageCategory(page)).filter(Boolean))
      ).sort(),
    [pages]
  );

  const tags = useMemo(
    () => Array.from(new Set(pages.flatMap((page) => getPageTags(page)))).sort(),
    [pages]
  );

  const currentUser = getCachedCurrentUser();

  const filteredPages = useMemo(
    () =>
      pages.filter((page) => {
        const query = normalizeText(search);
        const company = getPageCompany(page);
        const department = getPageDepartment(page);
        const category = getPageCategory(page);
        const pageTags = getPageTags(page);

        const haystack = [
          getPageSlug(page),
          getPageTitle(page),
          getPageDescription(page),
          page.content,
          page.author,
          company,
          department,
          category,
          pageTags.join(" "),
          page.createdAt,
          page.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || haystack.includes(query);
        const matchesCompany = !companyFilter || company === companyFilter;
        const matchesDepartment = !departmentFilter || department === departmentFilter;
        const matchesCategory = !categoryFilter || category === categoryFilter;
        const matchesTag = !tagFilter || pageTags.includes(tagFilter);
        const matchesMine =
          !onlyMine ||
          page.author === currentUser?.name ||
          page.author === currentUser?.email;

        return (
          matchesSearch &&
          matchesCompany &&
          matchesDepartment &&
          matchesCategory &&
          matchesTag &&
          matchesMine
        );
      }),
    [
      pages,
      search,
      companyFilter,
      departmentFilter,
      categoryFilter,
      tagFilter,
      onlyMine,
      currentUser?.name,
      currentUser?.email,
    ]
  );

  const sortedPages = useMemo(
    () =>
      [...filteredPages].sort((a, b) => {
        if (sortBy === "title-asc") {
          return getPageTitle(a).localeCompare(getPageTitle(b));
        }

        if (sortBy === "title-desc") {
          return getPageTitle(b).localeCompare(getPageTitle(a));
        }

        if (sortBy === "company-asc") {
          return getPageCompany(a).localeCompare(getPageCompany(b));
        }

        if (sortBy === "department-asc") {
          return getPageDepartment(a).localeCompare(getPageDepartment(b));
        }

        if (sortBy === "category-asc") {
          return getPageCategory(a).localeCompare(getPageCategory(b));
        }

        if (sortBy === "updated-asc") {
          return parseDate(a.updatedAt) - parseDate(b.updatedAt);
        }

        return parseDate(b.updatedAt) - parseDate(a.updatedAt);
      }),
    [filteredPages, sortBy]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Wissensdatenbank</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Wiki
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Zentrale Dokumentation für Wissen, Prozesse und interne Informationen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Alle anzeigen
            </button>

            {canCreate() && (
              <Link
                href="/wiki/new"
                className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Neue Seite erstellen
              </Link>
            )}
          </div>
        </div>
      </section>

      {loadState === "error" && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-zinc-50"
        >
          <p className="text-sm text-zinc-500">Dokumente</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : pages.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ company: companies[0] || "" })}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-emerald-50"
        >
          <p className="text-sm text-zinc-500">Firmen</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : companies.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ department: departments[0] || "" })}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-indigo-50"
        >
          <p className="text-sm text-zinc-500">Abteilungen</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : departments.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ category: categories[0] || "" })}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-zinc-50"
        >
          <p className="text-sm text-zinc-500">Kategorien</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : categories.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => updateFilters({ tag: tags[0] || "" })}
          className="rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:bg-zinc-50"
        >
          <p className="text-sm text-zinc-500">Tags</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">
            {isLoading ? "…" : tags.length}
          </p>
        </button>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">Suche & Filter</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Filtere Wiki-Seiten nach Text, Firma, Abteilung, Kategorie oder Tag.
            </p>
          </div>

          <div className="flex gap-2 rounded-2xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => updateFilters({ view: "cards" })}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                viewMode === "cards"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={() => updateFilters({ view: "table" })}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                viewMode === "table"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilters({ mine: !onlyMine })}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              onlyMine
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            Meine Dokumente
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-6">
          <input
            type="text"
            value={search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="Suche nach Titel, Inhalt, Autor, Firma, Abteilung oder Tag..."
            className="rounded-2xl border border-zinc-200 px-5 py-4 outline-none focus:border-zinc-500 md:col-span-2"
          />

          <select
            value={companyFilter}
            onChange={(event) => updateFilters({ company: event.target.value })}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Firmen</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => updateFilters({ department: event.target.value })}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Abteilungen</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => updateFilters({ category: event.target.value })}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Kategorien</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(event) => updateFilters({ tag: event.target.value })}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">Alle Tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <select
            value={sortBy}
            onChange={(event) => updateFilters({ sort: event.target.value })}
            className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="updated-desc">Neueste zuerst</option>
            <option value="updated-asc">Älteste zuerst</option>
            <option value="title-asc">Titel A-Z</option>
            <option value="title-desc">Titel Z-A</option>
            <option value="company-asc">Firma A-Z</option>
            <option value="department-asc">Abteilung A-Z</option>
            <option value="category-asc">Kategorie A-Z</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl bg-zinc-100 px-5 py-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
          >
            Filter zurücksetzen
          </button>
        </div>

        <p className="mt-5 text-sm text-zinc-500">
          {isLoading
            ? "Wiki-Seiten werden geladen..."
            : `${sortedPages.length} von ${pages.length} Seiten gefunden.`}
        </p>
      </section>

      {!isLoading && !error && sortedPages.length === 0 && (
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-950">
            Keine Wiki-Seiten gefunden
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Erstelle eine neue Seite oder passe deine Suche an.
          </p>

          {canCreate() && (
            <Link
              href="/wiki/new"
              className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Neue Seite erstellen
            </Link>
          )}
        </section>
      )}

      {viewMode === "cards" && (
        <section className="grid gap-4">
          {sortedPages.map((page) => {
            const slug = getPageSlug(page);
            const pageTags = getPageTags(page);
            const company = getPageCompany(page);
            const department = getPageDepartment(page);
            const category = getPageCategory(page);

            return (
              <article
                key={slug}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateFilters({ company })}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {company}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateFilters({ department })}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 transition hover:bg-indigo-100"
                      >
                        {department}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateFilters({ category })}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 transition hover:bg-zinc-200"
                      >
                        {category}
                      </button>
                    </div>

                    <Link
                      href={`/wiki/${slug}`}
                      className="mt-4 inline-block text-2xl font-bold text-zinc-950 transition hover:text-zinc-600"
                    >
                      {getPageTitle(page)}
                    </Link>

                    <p className="mt-2 text-zinc-500">{getPageDescription(page)}</p>

                    {pageTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pageTags.slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => updateFilters({ tag })}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-6 text-sm text-zinc-500">
                      <p>Autor: {page.author || "Unbekannt"}</p>
                      <p>Erstellt: {formatDateTime(page.createdAt)}</p>
                      <p>Aktualisiert: {formatDateTime(page.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-3">
                    <Link
                      href={`/wiki/${slug}`}
                      className="rounded-xl bg-zinc-950 px-4 py-2 text-sm text-white transition hover:bg-zinc-800"
                    >
                      Öffnen
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {viewMode === "table" && (
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-5 py-4 font-semibold">Titel</th>
                  <th className="px-5 py-4 font-semibold">Firma</th>
                  <th className="px-5 py-4 font-semibold">Abteilung</th>
                  <th className="px-5 py-4 font-semibold">Kategorie</th>
                  <th className="px-5 py-4 font-semibold">Tags</th>
                  <th className="px-5 py-4 font-semibold">Autor</th>
                  <th className="px-5 py-4 font-semibold">Aktualisiert</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedPages.map((page) => {
                  const slug = getPageSlug(page);
                  const company = getPageCompany(page);
                  const department = getPageDepartment(page);
                  const category = getPageCategory(page);
                  const pageTags = getPageTags(page);

                  return (
                    <tr
                      key={slug}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="min-w-[280px] px-5 py-4">
                        <Link
                          href={`/wiki/${slug}`}
                          className="font-semibold text-zinc-950 transition hover:text-zinc-600"
                        >
                          {getPageTitle(page)}
                        </Link>

                        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                          {getPageDescription(page)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        <button
                          type="button"
                          onClick={() => updateFilters({ company })}
                          className="text-emerald-700 hover:underline"
                        >
                          {company}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        <button
                          type="button"
                          onClick={() => updateFilters({ department })}
                          className="text-indigo-700 hover:underline"
                        >
                          {department}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        <button
                          type="button"
                          onClick={() => updateFilters({ category })}
                          className="text-zinc-700 hover:underline"
                        >
                          {category}
                        </button>
                      </td>

                      <td className="min-w-[200px] px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {pageTags.slice(0, 5).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => updateFilters({ tag })}
                              className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-200"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        {page.author || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-zinc-500">
                        {formatDateTime(page.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Link
                            href={`/wiki/${slug}`}
                            className="rounded-xl bg-zinc-950 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                          >
                            Öffnen
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && !error && sortedPages.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-zinc-500">
                      Keine Wiki-Seiten gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}