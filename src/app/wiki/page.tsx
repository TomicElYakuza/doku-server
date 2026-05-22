"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../lib/permissions";

import {
  activityRepository,
} from "../../lib/activityRepository";

import type {
  WikiPage,
} from "../../types/wiki";

import type {
  Company,
  Department,
} from "../../types/company";

type ViewMode =
  | "cards"
  | "table";

function formatTags(
  tags?: string[]
) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(Boolean);
}

function getWikiHref(
  slug: string
) {
  return `/wiki/${encodeURIComponent(
    slug
  )}`;
}

export default function WikiPageList() {
  const searchParams =
    useSearchParams();

  const urlCompanyFilter =
    searchParams.get("company") || "";

  const urlDepartmentFilter =
    searchParams.get("department") || "";

  const urlTagFilter =
    searchParams.get("tag") || "";

  const [pages, setPages] =
    useState<WikiPage[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadData();

    function handleWikiPagesUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );
    };
  }, []);

  useEffect(() => {
    setCompanyFilter(
      urlCompanyFilter
    );

    setDepartmentFilter(
      urlDepartmentFilter
    );

    setTagFilter(
      urlTagFilter
    );
  }, [
    urlCompanyFilter,
    urlDepartmentFilter,
    urlTagFilter,
  ]);

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setCompanies(
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
      );
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError
      );
    }
  }

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextPages,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          wikiRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setPages(
        Array.isArray(
          nextPages
        )
          ? nextPages
          : []
      );

      setCompanies(
        Array.isArray(
          nextCompanies
        )
          ? nextCompanies
          : []
      );

      setDepartments(
        Array.isArray(
          nextDepartments
        )
          ? nextDepartments
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seiten konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const allTags =
    useMemo(
      () =>
        Array.from(
          new Set(
            pages.flatMap(
              (page) =>
                formatTags(
                  page.tags
                )
            )
          )
        ).sort(
          (a, b) =>
            a.localeCompare(
              b
            )
        ),
      [
        pages,
      ]
    );

  const companyOptions =
    useMemo(
      () =>
        Array.from(
          new Set([
            ...companies.map(
              (company) =>
                company.name
            ),
            ...pages.map(
              (page) =>
                page.company ||
                "Intern"
            ),
          ])
        )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          ),
      [
        companies,
        pages,
      ]
    );

  const departmentOptions =
    useMemo(
      () => {
        const values =
          Array.from(
            new Set([
              ...departments.map(
                (department) =>
                  department.name
              ),
              ...pages.map(
                (page) =>
                  page.department ||
                  page.category ||
                  "Allgemein"
              ),
            ])
          )
            .filter(Boolean)
            .sort(
              (a, b) =>
                a.localeCompare(
                  b
                )
            );

        if (!companyFilter) {
          return values;
        }

        const selectedCompany =
          companies.find(
            (company) =>
              company.name === companyFilter
          );

        if (!selectedCompany) {
          return values;
        }

        const filteredByCompany =
          departments
            .filter(
              (department) =>
                department.companyId === selectedCompany.id
            )
            .map(
              (department) =>
                department.name
            );

        return Array.from(
          new Set([
            ...filteredByCompany,
            ...pages
              .filter(
                (page) =>
                  page.company === companyFilter
              )
              .map(
                (page) =>
                  page.department ||
                  page.category ||
                  "Allgemein"
              ),
          ])
        )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          );
      },
      [
        departments,
        companies,
        pages,
        companyFilter,
      ]
    );

  const filteredPages =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return pages.filter(
          (page) => {
            const pageCompany =
              page.company ||
              "Intern";

            const pageDepartment =
              page.department ||
              page.category ||
              "Allgemein";

            const pageTags =
              formatTags(
                page.tags
              );

            const matchesSearch =
              !query ||
              [
                page.title,
                page.slug,
                page.description,
                page.excerpt,
                page.content,
                page.author,
                pageCompany,
                pageDepartment,
                pageTags.join(" "),
                page.createdAt,
                page.updatedAt,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
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

            return (
              matchesSearch &&
              matchesCompany &&
              matchesDepartment &&
              matchesTag
            );
          }
        );
      },
      [
        pages,
        search,
        companyFilter,
        departmentFilter,
        tagFilter,
      ]
    );

  const latestPages =
    useMemo(
      () =>
        [
          ...pages,
        ].slice(
          0,
          5
        ),
      [
        pages,
      ]
    );

  function resetFilters() {
    setSearch("");
    setCompanyFilter("");
    setDepartmentFilter("");
    setTagFilter("");
  }

  async function handleDeletePage(
    page: WikiPage
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Wiki-Seiten zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Wiki-Seite "${page.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await wikiRepository.delete(
        page.slug
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Wiki-Seite gelöscht",

        description:
          `Wiki-Seite "${page.title}" wurde gelöscht.`,

        entityType:
          "wiki",

        entityId:
          page.slug,

        userName:
          "System",

        userEmail:
          "",

        user:
          "System",

        companyId:
          "",

        departmentId:
          "",

        company:
          page.company ||
          "Intern",

        department:
          page.department ||
          page.category ||
          "Allgemein",

        metadata: {
          pageSlug:
            page.slug,

          pageTitle:
            page.title,
        },
      });

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Wiki-Seite konnte nicht gelöscht werden."
      );
    }
  }

  function renderActions(
    page: WikiPage
  ) {
    return (
      <div className="flex flex-wrap gap-3 shrink-0">
        <Link
          href={getWikiHref(
            page.slug
          )}
          className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
        >
          Öffnen
        </Link>

        {canEdit() && (
          <Link
            href={`/wiki/edit/${encodeURIComponent(
              page.slug
            )}`}
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
          >
            Bearbeiten
          </Link>
        )}

        {canDelete() && (
          <button
            type="button"
            onClick={() =>
              void handleDeletePage(
                page
              )
            }
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
          >
            Löschen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Wiki
          </h1>

          <p className="text-zinc-500 mt-2">
            Dokumentation, Wissen und interne Anleitungen aus PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/wiki/trash"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Papierkorb
          </Link>

          {canCreate() && (
            <Link
              href="/wiki/create"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Wiki-Seite erstellen
            </Link>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Wiki-Seiten werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Seiten gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pages.length}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companyOptions.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departmentOptions.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {allTags.length}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Inhalt, Firma, Abteilung oder Tags.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "cards"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode(
                  "table"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Wiki durchsuchen..."
          />

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(
                event.target.value
              );

              setDepartmentFilter(
                ""
              );
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companyOptions.map(
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {departmentOptions.map(
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Tags
            </option>

            {allTags.map(
              (tag) => (
                <option
                  key={tag}
                  value={tag}
                >
                  {tag}
                </option>
              )
            )}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          {filteredPages.length} von {pages.length} Wiki-Seiten gefunden.
        </p>
      </div>

      {filteredPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold">
            Keine Wiki-Seiten gefunden
          </h2>

          <p className="text-zinc-500 mt-2">
            Erstelle eine neue Seite oder passe die Filter an.
          </p>
        </div>
      )}

      {viewMode === "cards" && filteredPages.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredPages.map(
            (page) => {
              const pageDepartment =
                page.department ||
                page.category ||
                "Allgemein";

              const pageCompany =
                page.company ||
                "Intern";

              const pageTags =
                formatTags(
                  page.tags
                );

              return (
                <div
                  key={page.slug}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <Link
                      href={getWikiHref(
                        page.slug
                      )}
                      className="min-w-0 block flex-1"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                          {pageCompany}
                        </span>

                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {pageDepartment}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mt-4">
                        {page.title}
                      </h2>

                      <p className="text-zinc-500 mt-2 line-clamp-3">
                        {page.description ||
                          page.excerpt ||
                          "Keine Beschreibung vorhanden."}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-5">
                        {pageTags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                        <span>
                          Autor:{" "}
                          {page.author ||
                            "System"}
                        </span>

                        <span>
                          Aktualisiert:{" "}
                          {page.updatedAt ||
                            page.createdAt}
                        </span>
                      </div>
                    </Link>

                    {renderActions(
                      page
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {viewMode === "table" && filteredPages.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Seite
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
                    Aktualisiert
                  </th>

                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPages.map(
                  (page) => {
                    const pageDepartment =
                      page.department ||
                      page.category ||
                      "Allgemein";

                    const pageCompany =
                      page.company ||
                      "Intern";

                    const pageTags =
                      formatTags(
                        page.tags
                      );

                    return (
                      <tr
                        key={page.slug}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 align-top min-w-[300px]">
                          <Link
                            href={getWikiHref(
                              page.slug
                            )}
                            className="font-semibold hover:underline"
                          >
                            {page.title}
                          </Link>

                          <p className="text-zinc-500 mt-1 line-clamp-2">
                            {page.description ||
                              page.excerpt ||
                              "Keine Beschreibung vorhanden."}
                          </p>

                          <p className="text-xs text-zinc-400 mt-2">
                            Slug: {page.slug}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-top text-zinc-500">
                          {pageCompany}
                        </td>

                        <td className="px-5 py-4 align-top text-zinc-500">
                          {pageDepartment}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {pageTags.length === 0 && (
                              <span className="text-zinc-400">
                                Keine Tags
                              </span>
                            )}

                            {pageTags.map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full"
                                >
                                  #{tag}
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-zinc-500 whitespace-nowrap">
                          {page.updatedAt ||
                            page.createdAt}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end">
                            {renderActions(
                              page
                            )}
                          </div>
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

      {latestPages.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Letzte Seiten
          </h2>

          <div className="flex flex-wrap gap-3 mt-4">
            {latestPages.map(
              (page) => (
                <Link
                  key={page.slug}
                  href={getWikiHref(
                    page.slug
                  )}
                  className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
                >
                  {page.title}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}