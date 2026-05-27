"use client";

import Link from "next/link";

import {
  FormEvent,
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
  usePermissions,
} from "../../hooks/usePermissions";

import {
  activityRepository,
} from "../../lib/activityRepository";

import AppModal from "../../components/AppModal";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

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

function createSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /ä/g,
      "ae"
    )
    .replace(
      /ö/g,
      "oe"
    )
    .replace(
      /ü/g,
      "ue"
    )
    .replace(
      /ß/g,
      "ss"
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function splitTags(
  value: string
) {
  return value
    .split(",")
    .map(
      (tag) =>
        tag.trim()
    )
    .filter(Boolean);
}

export default function WikiPageList() {
  const searchParams =
    useSearchParams();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageWiki =
    isAdmin ||
    hasAnyPermission([
      "wiki.manage",
    ]);

  const canCreateWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.create",
    ]);

  const canEditWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.edit",
    ]);

  const canDeleteWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.delete",
    ]);

  const urlCompanyFilter =
    searchParams.get(
      "company"
    ) ||
    "";

  const urlDepartmentFilter =
    searchParams.get(
      "department"
    ) ||
    "";

  const urlTagFilter =
    searchParams.get(
      "tag"
    ) ||
    "";

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

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingSlug, setEditingSlug] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [excerpt, setExcerpt] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("Allgemein");

  const [category, setCategory] =
    useState("Allgemein");

  const [author, setAuthor] =
    useState("System");

  const [tags, setTags] =
    useState("");

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
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

  function userCanSeePage(
    page: WikiPage
  ) {
    if (
      isAdmin ||
      canManageWiki
    ) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.department) {
      return (
        page.department === user.department ||
        page.category === user.department
      );
    }

    if (user.company) {
      return page.company === user.company;
    }

    return false;
  }

  const visiblePages =
    useMemo(
      () =>
        pages.filter(
          userCanSeePage
        ),
      [
        pages,
        user,
        isAdmin,
        canManageWiki,
      ]
    );

  const allTags =
    useMemo(
      () =>
        Array.from(
          new Set(
            visiblePages.flatMap(
              (page) =>
                formatTags(
                  page.tags
                )
            )
          )
        ).sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b
            )
        ),
      [
        visiblePages,
      ]
    );

  const companyOptions =
    useMemo(
      () =>
        Array.from(
          new Set([
            ...companies.map(
              (nextCompany) =>
                nextCompany.name
            ),
            ...visiblePages.map(
              (page) =>
                page.company ||
                "Intern"
            ),
          ])
        )
          .filter(Boolean)
          .sort(
            (
              a,
              b
            ) =>
              a.localeCompare(
                b
              )
          ),
      [
        companies,
        visiblePages,
      ]
    );

  const departmentOptions =
    useMemo(
      () => {
        const values =
          Array.from(
            new Set([
              ...departments.map(
                (nextDepartment) =>
                  nextDepartment.name
              ),
              ...visiblePages.map(
                (page) =>
                  page.department ||
                  page.category ||
                  "Allgemein"
              ),
            ])
          )
            .filter(Boolean)
            .sort(
              (
                a,
                b
              ) =>
                a.localeCompare(
                  b
                )
            );

        if (!companyFilter) {
          return values;
        }

        const selectedCompany =
          companies.find(
            (nextCompany) =>
              nextCompany.name === companyFilter
          );

        if (!selectedCompany) {
          return values;
        }

        const filteredByCompany =
          departments
            .filter(
              (nextDepartment) =>
                nextDepartment.companyId === selectedCompany.id
            )
            .map(
              (nextDepartment) =>
                nextDepartment.name
            );

        return Array.from(
          new Set([
            ...filteredByCompany,
            ...visiblePages
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
            (
              a,
              b
            ) =>
              a.localeCompare(
                b
              )
          );
      },
      [
        departments,
        companies,
        visiblePages,
        companyFilter,
      ]
    );

  const formDepartmentOptions =
    useMemo(
      () => {
        if (!company) {
          return departments;
        }

        const selectedCompany =
          companies.find(
            (nextCompany) =>
              nextCompany.name === company
          );

        if (!selectedCompany) {
          return departments;
        }

        return departments.filter(
          (nextDepartment) =>
            nextDepartment.companyId === selectedCompany.id
        );
      },
      [
        departments,
        companies,
        company,
      ]
    );

  const filteredPages =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return visiblePages.filter(
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
        visiblePages,
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
          ...visiblePages,
        ].slice(
          0,
          5
        ),
      [
        visiblePages,
      ]
    );

  function resetForm() {
    setEditingSlug(
      ""
    );

    setTitle(
      ""
    );

    setSlug(
      ""
    );

    setDescription(
      ""
    );

    setExcerpt(
      ""
    );

    setCompany(
      user?.company ||
      companyOptions[0] ||
      "Intern"
    );

    setDepartment(
      user?.department ||
      departmentOptions[0] ||
      "Allgemein"
    );

    setCategory(
      user?.department ||
      departmentOptions[0] ||
      "Allgemein"
    );

    setAuthor(
      user?.name ||
      "System"
    );

    setTags(
      ""
    );

    setContent(
      ""
    );
  }

  function closeModal() {
    setModalOpen(
      false
    );

    resetForm();
  }

  function openCreateForm() {
    if (!canCreateWiki) {
      alert(
        "Du hast keine Berechtigung, Wiki-Seiten zu erstellen."
      );

      return;
    }

    resetForm();

    setModalOpen(
      true
    );
  }

  function startEditPage(
    page: WikiPage
  ) {
    if (!canEditWiki) {
      alert(
        "Du hast keine Berechtigung, Wiki-Seiten zu bearbeiten."
      );

      return;
    }

    const pageDepartment =
      page.department ||
      page.category ||
      "Allgemein";

    setEditingSlug(
      page.slug
    );

    setTitle(
      page.title
    );

    setSlug(
      page.slug
    );

    setDescription(
      page.description ||
      ""
    );

    setExcerpt(
      page.excerpt ||
      ""
    );

    setCompany(
      page.company ||
      "Intern"
    );

    setDepartment(
      pageDepartment
    );

    setCategory(
      page.category ||
      pageDepartment
    );

    setAuthor(
      page.author ||
      "System"
    );

    setTags(
      formatTags(
        page.tags
      ).join(
        ", "
      )
    );

    setContent(
      page.content ||
      ""
    );

    setModalOpen(
      true
    );
  }

  function handleCompanyChange(
    value: string
  ) {
    setCompany(
      value
    );

    const selectedCompany =
      companies.find(
        (nextCompany) =>
          nextCompany.name === value
      );

    const firstDepartment =
      departments.find(
        (nextDepartment) =>
          nextDepartment.companyId === selectedCompany?.id
      );

    if (firstDepartment) {
      setDepartment(
        firstDepartment.name
      );

      setCategory(
        firstDepartment.name
      );
    }
  }

  function resetFilters() {
    setSearch(
      ""
    );

    setCompanyFilter(
      ""
    );

    setDepartmentFilter(
      ""
    );

    setTagFilter(
      ""
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      editingSlug &&
      !canEditWiki
    ) {
      alert(
        "Du hast keine Berechtigung, Wiki-Seiten zu bearbeiten."
      );

      return;
    }

    if (
      !editingSlug &&
      !canCreateWiki
    ) {
      alert(
        "Du hast keine Berechtigung, Wiki-Seiten zu erstellen."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    const nextSlug =
      slug.trim()
        ? createSlug(
            slug
          )
        : createSlug(
            title
          );

    if (!nextSlug) {
      alert(
        "Bitte einen gültigen Slug eingeben."
      );

      return;
    }

    const nextDepartment =
      department.trim() ||
      category.trim() ||
      "Allgemein";

    const payload = {
      slug:
        nextSlug,

      title:
        title.trim(),

      description:
        description.trim(),

      excerpt:
        excerpt.trim() ||
        description.trim(),

      company:
        company.trim() ||
        "Intern",

      category:
        category.trim() ||
        nextDepartment,

      department:
        nextDepartment,

      author:
        author.trim() ||
        user?.name ||
        "System",

      tags:
        splitTags(
          tags
        ),

      content:
        content.trim(),
    };

    try {
      setSaving(
        true
      );

      setMessage(
        ""
      );

      setError(
        ""
      );

      if (editingSlug) {
        const updatedPage =
          await wikiRepository.update(
            editingSlug,
            payload
          );

        if (updatedPage) {
          void activityRepository.create({
            type:
              "updated",

            title:
              "Wiki-Seite aktualisiert",

            description:
              `Wiki-Seite "${payload.title}" wurde aktualisiert.`,

            entityType:
              "wiki",

            entityId:
              payload.slug,

            userName:
              user?.name ||
              "System",

            userEmail:
              user?.email ||
              "",

            user:
              user?.name ||
              "System",

            companyId:
              user?.companyId ||
              "",

            departmentId:
              user?.departmentId ||
              "",

            company:
              payload.company,

            department:
              payload.department,

            metadata: {
              pageSlug:
                payload.slug,

              oldSlug:
                editingSlug,

              pageTitle:
                payload.title,
            },
          });
        }

        closeModal();

        await loadData();

        setMessage(
          "Wiki-Seite wurde gespeichert."
        );

        return;
      }

      const createdPage =
        await wikiRepository.create(
          payload
        );

      void activityRepository.create({
        type:
          "created",

        title:
          "Wiki-Seite erstellt",

        description:
          `Wiki-Seite "${createdPage.title}" wurde erstellt.`,

        entityType:
          "wiki",

        entityId:
          createdPage.slug,

        userName:
          user?.name ||
          "System",

        userEmail:
          user?.email ||
          "",

        user:
          user?.name ||
          "System",

        companyId:
          user?.companyId ||
          "",

        departmentId:
          user?.departmentId ||
          "",

        company:
          createdPage.company ||
          "Intern",

        department:
          createdPage.department ||
          createdPage.category ||
          "Allgemein",

        metadata: {
          pageSlug:
            createdPage.slug,

          pageTitle:
            createdPage.title,
        },
      });

      closeModal();

      await loadData();

      setMessage(
        "Wiki-Seite wurde erstellt."
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Wiki-Seite konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeletePage(
    page: WikiPage
  ) {
    if (!canDeleteWiki) {
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
      setMessage(
        ""
      );

      setError(
        ""
      );

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
          user?.name ||
          "System",

        userEmail:
          user?.email ||
          "",

        user:
          user?.name ||
          "System",

        companyId:
          user?.companyId ||
          "",

        departmentId:
          user?.departmentId ||
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

      setMessage(
        "Wiki-Seite wurde gelöscht."
      );
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
      <div className="flex flex-wrap gap-3">
        <Link
          href={getWikiHref(
            page.slug
          )}
          className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
        >
          Öffnen
        </Link>

        {canEditWiki && (
          <button
            type="button"
            onClick={() =>
              startEditPage(
                page
              )
            }
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
          >
            Bearbeiten
          </button>
        )}

        {canDeleteWiki && (
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
      <AppModal
        open={modalOpen}
        title={
          editingSlug
            ? "Wiki-Seite bearbeiten"
            : "Wiki-Seite erstellen"
        }
        description="Wiki-Seiten werden direkt in PostgreSQL gespeichert."
        maxWidth="5xl"
        onClose={closeModal}
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="wiki-page-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingSlug
                  ? "Wiki-Seite speichern"
                  : "Wiki-Seite erstellen"}
            </button>
          </div>
        )}
      >
        <form
          id="wiki-page-form"
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="space-y-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                value={title}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setTitle(
                    value
                  );

                  if (
                    !editingSlug &&
                    !slug
                  ) {
                    setSlug(
                      createSlug(
                        value
                      )
                    );
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Titel der Wiki-Seite"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>

              <input
                value={slug}
                onChange={(event) =>
                  setSlug(
                    createSlug(
                      event.target.value
                    )
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="wiki-seite"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={company}
                onChange={(event) =>
                  handleCompanyChange(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {companyOptions.length === 0 && (
                  <option value="Intern">
                    Intern
                  </option>
                )}

                {companyOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>

              <select
                value={department}
                onChange={(event) => {
                  setDepartment(
                    event.target.value
                  );

                  setCategory(
                    event.target.value
                  );
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {formDepartmentOptions.length === 0 && (
                  <option value={department || "Allgemein"}>
                    {department || "Allgemein"}
                  </option>
                )}

                {formDepartmentOptions.map(
                  (option) => (
                    <option
                      key={option.id}
                      value={option.name}
                    >
                      {option.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Allgemein"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Autor
              </label>

              <input
                value={author}
                onChange={(event) =>
                  setAuthor(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="System"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Kurze Beschreibung..."
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Auszug
              </label>

              <textarea
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(
                    event.target.value
                  )
                }
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Optionaler Kurztext..."
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <input
                value={tags}
                onChange={(event) =>
                  setTags(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="it, onboarding, prozess"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Inhalt
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                rows={14}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y"
                placeholder="Inhalt der Wiki-Seite..."
              />
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Wissen"
        title="Wiki"
        description="Dokumentation, Wissen und interne Anleitungen aus PostgreSQL."
        badges={[
          {
            label:
              `${visiblePages.length} Seiten`,
          },
          {
            label:
              `${companyOptions.length} Firmen`,
          },
          {
            label:
              `${allTags.length} Tags`,
          },
        ]}
        actions={(
          <>
            {canCreateWiki && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Wiki-Seite erstellen
              </button>
            )}
          </>
        )}
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Wiki-Seiten werden geladen...
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-medium">
            {message}
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
        <StatCard
          label="Seiten gesamt"
          value={visiblePages.length}
          description="Alle sichtbaren Seiten"
          icon="📚"
          active={
            !companyFilter &&
            !departmentFilter &&
            !tagFilter
          }
          onClick={resetFilters}
        />

        <StatCard
          label="Firmen"
          value={companyOptions.length}
          description="Mit Wiki-Inhalten"
          icon="🏢"
          tone="green"
          onClick={resetFilters}
        />

        <StatCard
          label="Abteilungen"
          value={departmentOptions.length}
          description="Mit Dokumentation"
          icon="🧩"
          tone="indigo"
          onClick={resetFilters}
        />

        <StatCard
          label="Tags"
          value={allTags.length}
          description="Verfügbare Schlagwörter"
          icon="🏷️"
          tone="purple"
          active={Boolean(tagFilter)}
          onClick={resetFilters}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Inhalt, Firma, Abteilung oder Tags.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-5">
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
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
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
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
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

        <p className="text-sm text-zinc-500 mt-5">
          {filteredPages.length} von {visiblePages.length} Wiki-Seiten gefunden.
        </p>
      </section>

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
                <article
                  key={page.slug}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                          {pageCompany}
                        </span>

                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {pageDepartment}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mt-4">
                        {page.title}
                      </h2>

                      <p className="text-zinc-500 mt-2">
                        {page.description ||
                          page.excerpt ||
                          "Keine Beschreibung vorhanden."}
                      </p>

                      {pageTags.length > 0 && (
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
                      )}

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
                    </div>

                    {renderActions(
                      page
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {viewMode === "table" && filteredPages.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">
                    Seite
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Firma
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Abteilung
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Tags
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Aktualisiert
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
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
                        className="align-top"
                      >
                        <td className="px-5 py-4 min-w-80">
                          <p className="font-semibold">
                            {page.title}
                          </p>

                          <p className="text-sm text-zinc-500 mt-1">
                            {page.description ||
                              page.excerpt ||
                              "Keine Beschreibung vorhanden."}
                          </p>

                          <p className="text-xs text-zinc-400 mt-2 font-mono">
                            Slug: {page.slug}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {pageCompany}
                        </td>

                        <td className="px-5 py-4">
                          {pageDepartment}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2 min-w-48">
                            {pageTags.length === 0 && (
                              <span className="text-zinc-400 text-sm">
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

                        <td className="px-5 py-4 text-sm text-zinc-500">
                          {page.updatedAt ||
                            page.createdAt}
                        </td>

                        <td className="px-5 py-4">
                          {renderActions(
                            page
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {latestPages.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Letzte Seiten
          </h2>

          <div className="flex flex-wrap gap-2 mt-4">
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
        </section>
      )}
    </div>
  );
}