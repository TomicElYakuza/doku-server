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

import AppModal from "../../components/AppModal";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  activityRepository,
} from "../../lib/activityRepository";
import {
  companyRepository,
} from "../../lib/companyRepository";
import {
  wikiRepository,
} from "../../lib/wikiRepository";
import {
  usePermissions,
} from "../../hooks/usePermissions";
import {
  useAppSettings,
} from "../../hooks/useAppSettings";
import type {
  Company,
  Department,
} from "../../types/company";
import type {
  WikiPage,
} from "../../types/wiki";

type ViewMode = "cards" | "table";

type TaxonomyItem = {
  id: string;
  type: "category" | "tag";
  target: string;
  name: string;
  slug?: string;
  path?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type SelectOption = {
  id: string;
  value: string;
  label: string;
};

function getWikiHref(slug: string) {
  return `/wiki/${encodeURIComponent(slug)}`;
}

function getSafeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

function getTaxonomyLabel(
  item: TaxonomyItem,
  allItems: TaxonomyItem[],
) {
  if (item.path?.trim()) {
    return item.path.trim();
  }

  const names: string[] = [];
  let current: TaxonomyItem | undefined = item;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.name);

    if (!current.parentId) {
      break;
    }

    current = allItems.find(
      (candidate) => candidate.id === current?.parentId,
    );
  }

  return names.join(" > ") || item.name;
}

function sortByLabel(
  first: SelectOption,
  second: SelectOption,
) {
  return first.label.localeCompare(second.label);
}

function getStatusLabel(pageCount: number) {
  if (pageCount === 1) {
    return "1 Seite";
  }

  return `${pageCount} Seiten`;
}

function createSlugFromTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function WikiPageList() {
  const searchParams = useSearchParams();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const {
    settings,
  } = useAppSettings();

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

  const urlCompanyFilter = searchParams.get("company") || "";
  const urlDepartmentFilter = searchParams.get("department") || "";
  const urlCategoryFilter = searchParams.get("category") || "";
  const urlTagFilter = searchParams.get("tag") || "";

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wikiCategories, setWikiCategories] = useState<TaxonomyItem[]>([]);
  const [wikiTags, setWikiTags] = useState<TaxonomyItem[]>([]);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [company, setCompany] = useState("Intern");
  const [department, setDepartment] = useState("");
  const [author, setAuthor] = useState("System");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setViewMode(settings.defaultWikiView === "cards" ? "cards" : "table");
  }, [
    settings.defaultWikiView,
  ]);

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
      handleWikiPagesUpdated,
    );
    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );
    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated,
      );
      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );
      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );
    };
  }, []);

  useEffect(() => {
    setCompanyFilter(urlCompanyFilter);
    setDepartmentFilter(urlDepartmentFilter);
    setCategoryFilter(urlCategoryFilter);
    setTagFilter(urlTagFilter);
  }, [
    urlCompanyFilter,
    urlDepartmentFilter,
    urlCategoryFilter,
    urlTagFilter,
  ]);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      fetch("/api/taxonomy?target=wiki&type=category"),
      fetch("/api/taxonomy?target=wiki&type=tag"),
      fetch("/api/taxonomy?target=global&type=tag"),
    ]);

    const nextWikiCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [index, result] of requests.entries()) {
      if (result.status !== "fulfilled" || !result.value.ok) {
        continue;
      }

      const data = await result.value.json();
      const items: TaxonomyItem[] = Array.isArray(data) ? data : [];

      if (index === 0) {
        nextWikiCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setWikiCategories(
      nextWikiCategories.filter((item) => item.isActive !== false),
    );

    setWikiTags(
      Array.from(
        new Map(
          nextTags
            .filter((item) => item.isActive !== false)
            .map((item) => [
              item.name,
              item,
            ]),
        ).values(),
      ),
    );
  }

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextPages,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        wikiRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        loadTaxonomyItems(),
      ]);

      setPages(Array.isArray(nextPages) ? nextPages : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seiten konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function userCanSeePage(page: WikiPage) {
    if (isAdmin || canManageWiki) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.department) {
      return page.department === user.department;
    }

    if (user.company) {
      return page.company === user.company;
    }

    return false;
  }

  const visiblePages = useMemo(
    () => pages.filter(userCanSeePage),
    [
      pages,
      user,
      isAdmin,
      canManageWiki,
    ],
  );

  const categoryOptions = useMemo(
    () =>
      wikiCategories
        .map((item) => {
          const label = getTaxonomyLabel(item, wikiCategories);

          return {
            id: item.id,
            value: label,
            label,
          };
        })
        .filter((option) => option.value.trim())
        .sort(sortByLabel),
    [
      wikiCategories,
    ],
  );

  const tagOptions = useMemo(
    () =>
      wikiTags
        .map((item) => ({
          id: item.id,
          value: item.name,
          label: item.name,
        }))
        .filter((option) => option.value.trim())
        .sort(sortByLabel),
    [
      wikiTags,
    ],
  );

  const companyOptions = useMemo(
    () =>
      Array.from(
        new Set([
          "Intern",
          ...companies.map((nextCompany) => nextCompany.name),
          ...visiblePages.map((page) => page.company || "Intern"),
        ]),
      )
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [
      companies,
      visiblePages,
    ],
  );

  const departmentOptions = useMemo(() => {
    const baseValues = Array.from(
      new Set([
        ...departments.map((nextDepartment) => nextDepartment.name),
        ...visiblePages
          .map((page) => String(page.department || "").trim())
          .filter(Boolean),
      ]),
    )
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));

    if (!companyFilter) {
      return baseValues;
    }

    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.name === companyFilter,
    );

    if (!selectedCompany) {
      return baseValues;
    }

    return Array.from(
      new Set([
        ...departments
          .filter(
            (nextDepartment) =>
              nextDepartment.companyId === selectedCompany.id,
          )
          .map((nextDepartment) => nextDepartment.name),
        ...visiblePages
          .filter((page) => page.company === companyFilter)
          .map((page) => String(page.department || "").trim())
          .filter(Boolean),
      ]),
    )
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }, [
    departments,
    companies,
    visiblePages,
    companyFilter,
  ]);

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visiblePages.filter((page) => {
      const pageCompany = page.company || "Intern";
      const pageDepartment = String(page.department || "").trim();
      const pageCategory = String(page.category || "").trim();
      const pageTags = getSafeTags(page.tags);

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
          pageCategory,
          pageTags.join(" "),
          page.createdAt,
          page.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCompany =
        !companyFilter ||
        pageCompany === companyFilter;

      const matchesDepartment =
        !departmentFilter ||
        pageDepartment === departmentFilter;

      const matchesCategory =
        !categoryFilter ||
        pageCategory === categoryFilter;

      const matchesTag =
        !tagFilter ||
        pageTags.includes(tagFilter);

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesCategory &&
        matchesTag
      );
    });
  }, [
    visiblePages,
    search,
    companyFilter,
    departmentFilter,
    categoryFilter,
    tagFilter,
  ]);

  const latestPages = useMemo(
    () => [
      ...visiblePages,
    ].slice(0, 5),
    [
      visiblePages,
    ],
  );

  function resetFilters() {
    setSearch("");
    setCompanyFilter("");
    setDepartmentFilter("");
    setCategoryFilter("");
    setTagFilter("");
  }

  function resetForm() {
    setEditingSlug("");
    setTitle("");
    setSlug("");
    setDescription("");
    setContent("");
    setCategory(categoryOptions[0]?.value || "");
    setCompany(user?.company || "Intern");
    setDepartment(user?.department || "");
    setAuthor(user?.name || "System");
    setSelectedTags([]);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function openCreateForm() {
    if (!canCreateWiki) {
      alert("Du hast keine Berechtigung, Wiki-Seiten zu erstellen.");
      return;
    }

    resetForm();
    setModalOpen(true);
  }

  function startEditPage(page: WikiPage) {
    if (!canEditWiki) {
      alert("Du hast keine Berechtigung, Wiki-Seiten zu bearbeiten.");
      return;
    }

    setEditingSlug(page.slug);
    setTitle(page.title);
    setSlug(page.slug);
    setDescription(page.description || page.excerpt || "");
    setContent(page.content || "");
    setCategory(page.category || categoryOptions[0]?.value || "");
    setCompany(page.company || "Intern");
    setDepartment(page.department || "");
    setAuthor(page.author || user?.name || "System");
    setSelectedTags(getSafeTags(page.tags));
    setModalOpen(true);
  }

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter((currentTag) => currentTag !== tag);
      }

      return [
        ...currentTags,
        tag,
      ];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!editingSlug && !canCreateWiki) {
      alert("Du hast keine Berechtigung, Wiki-Seiten zu erstellen.");
      return;
    }

    if (editingSlug && !canEditWiki) {
      alert("Du hast keine Berechtigung, Wiki-Seiten zu bearbeiten.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Wiki-Kategorie auswählen.");
      return;
    }

    const nextSlug = slug.trim() || createSlugFromTitle(title);

    if (!nextSlug) {
      alert("Bitte einen gültigen Slug eingeben.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        title: title.trim(),
        slug: nextSlug,
        description: description.trim(),
        excerpt: description.trim(),
        content: content.trim(),
        category: category.trim(),
        company: company.trim() || "Intern",
        department: department.trim(),
        author: author.trim() || user?.name || "System",
        tags: selectedTags,
      };

      if (editingSlug) {
        const updatedPage = await wikiRepository.update(
          editingSlug,
          payload,
        );

        if (updatedPage) {
          void activityRepository.create({
            type: "updated",
            title: "Wiki-Seite aktualisiert",
            description: `Wiki-Seite "${payload.title}" wurde aktualisiert.`,
            entityType: "wiki",
            entityId: nextSlug,
            userName: user?.name || "System",
            userEmail: user?.email || "",
            user: user?.name || "System",
            companyId: "",
            departmentId: "",
            company: payload.company,
            department: payload.department,
            metadata: {
              pageSlug: nextSlug,
              pageTitle: payload.title,
            },
          });
        }

        closeModal();
        await loadData();
        setMessage("Wiki-Seite wurde gespeichert.");
        return;
      }

      const createdPage = await wikiRepository.create(payload);

      void activityRepository.create({
        type: "created",
        title: "Wiki-Seite erstellt",
        description: `Wiki-Seite "${createdPage.title}" wurde erstellt.`,
        entityType: "wiki",
        entityId: createdPage.slug,
        userName: user?.name || "System",
        userEmail: user?.email || "",
        user: user?.name || "System",
        companyId: "",
        departmentId: "",
        company: createdPage.company || payload.company,
        department: createdPage.department || payload.department,
        metadata: {
          pageSlug: createdPage.slug,
          pageTitle: createdPage.title,
        },
      });

      closeModal();
      await loadData();
      setMessage("Wiki-Seite wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Wiki-Seite konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePage(page: WikiPage) {
    if (!canDeleteWiki) {
      alert("Du hast keine Berechtigung, Wiki-Seiten zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Wiki-Seite "${page.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await wikiRepository.delete(page.slug);

      void activityRepository.create({
        type: "deleted",
        title: "Wiki-Seite gelöscht",
        description: `Wiki-Seite "${page.title}" wurde gelöscht.`,
        entityType: "wiki",
        entityId: page.slug,
        userName: user?.name || "System",
        userEmail: user?.email || "",
        user: user?.name || "System",
        companyId: "",
        departmentId: "",
        company: page.company || "Intern",
        department: page.department || "",
        metadata: {
          pageSlug: page.slug,
          pageTitle: page.title,
        },
      });

      await loadData();
      setMessage("Wiki-Seite wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Wiki-Seite konnte nicht gelöscht werden.",
      );
    }
  }

  function renderActions(page: WikiPage) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href={getWikiHref(page.slug)}
          className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
        >
          Öffnen
        </Link>

        {canEditWiki && (
          <button
            type="button"
            onClick={() => startEditPage(page)}
            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
          >
            Bearbeiten
          </button>
        )}

        {canDeleteWiki && (
          <button
            type="button"
            onClick={() => void handleDeletePage(page)}
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
        onClose={closeModal}
        title={editingSlug ? "Wiki-Seite bearbeiten" : "Wiki-Seite erstellen"}
        description="Kategorie und Tags kommen aus dem Admin Backend."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="wiki-page-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingSlug
                  ? "Änderungen speichern"
                  : "Wiki-Seite erstellen"}
            </button>
          </>
        }
      >
        <form
          id="wiki-page-form"
          onSubmit={(event) => void handleSubmit(event)}
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
                  setTitle(event.target.value);

                  if (!editingSlug) {
                    setSlug(createSlugFromTitle(event.target.value));
                  }
                }}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="Titel der Wiki-Seite"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Slug
              </label>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="wiki-seite"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Kategorie auswählen
                </option>

                {categoryOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {categoryOptions.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Bitte zuerst eine aktive Wiki-Kategorie im Admin Backend anlegen.
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Autor
              </label>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                placeholder="System"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>
              <select
                value={company}
                onChange={(event) => {
                  setCompany(event.target.value);
                  setDepartment("");
                }}
                disabled={!isAdmin && !canManageWiki}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                {companyOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={!isAdmin && !canManageWiki}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Keine Abteilung
                </option>

                {departmentOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Kurzbeschreibung
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
              placeholder="Kurze Beschreibung der Wiki-Seite..."
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Inhalt
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-y"
              placeholder="Wiki-Inhalt..."
            />
          </div>

          <div>
            <label className="block mb-3 font-medium">
              Tags
            </label>

            {tagOptions.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-500">
                Noch keine globalen oder Wiki-Tags im Admin Backend vorhanden.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((option) => {
                  const active = selectedTags.includes(option.value);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleTag(option.value)}
                      className={`px-4 py-2 rounded-xl border transition ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      #{option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Wissen"
        title="Wiki"
        description="Dokumentation, Wissen und interne Anleitungen aus PostgreSQL mit Kategorien und Tags aus dem Admin Backend."
        badges={[
          {
            label: getStatusLabel(visiblePages.length),
          },
          {
            label: `${categoryOptions.length} Kategorien`,
          },
          {
            label: `${tagOptions.length} Tags`,
          },
        ]}
        actions={
          canCreateWiki ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Wiki-Seite erstellen
            </button>
          ) : null
        }
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
          description="Alle sichtbaren Wiki-Seiten"
          icon="📚"
          active={!categoryFilter && !tagFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Kategorien"
          value={categoryOptions.length}
          description="Aus dem Admin Backend"
          icon="🗂️"
          tone="indigo"
          active={Boolean(categoryFilter)}
        />
        <StatCard
          label="Tags"
          value={tagOptions.length}
          description="Vordefinierte Tags"
          icon="🏷️"
          tone="purple"
          active={Boolean(tagFilter)}
        />
        <StatCard
          label="Aktuell sichtbar"
          value={filteredPages.length}
          description="Nach Suche und Filtern"
          icon="🔎"
          tone="blue"
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Inhalt, Firma, Abteilung, Kategorie oder Tags.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "app-accent-bg text-white app-brand-shadow"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "app-accent-bg text-white app-brand-shadow"
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="Wiki durchsuchen..."
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>

            {categoryOptions.map((option) => (
              <option
                key={option.id}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Tags
            </option>

            {tagOptions.map((option) => (
              <option
                key={option.id}
                value={option.value}
              >
                #{option.label}
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(event.target.value);
              setDepartmentFilter("");
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companyOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {departmentOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          {filteredPages.length} von {visiblePages.length} Wiki-Seiten gefunden.
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

      {filteredPages.length > 0 && viewMode === "cards" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredPages.map((page) => {
            const pageDepartment = String(page.department || "").trim();
            const pageCategory = String(page.category || "").trim();
            const pageTags = getSafeTags(page.tags);

            return (
              <article
                key={page.slug}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap gap-2">
                  {pageCategory && (
                    <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                      {pageCategory}
                    </span>
                  )}

                  {page.company && (
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {page.company}
                    </span>
                  )}

                  {pageDepartment && (
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {pageDepartment}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black mt-5">
                  {page.title}
                </h2>

                <p className="text-zinc-500 mt-3 line-clamp-3">
                  {page.description ||
                    page.excerpt ||
                    "Keine Beschreibung vorhanden."}
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  {pageTags.length === 0 && (
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                      Keine Tags
                    </span>
                  )}

                  {pageTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTagFilter(tag)}
                      className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mt-6 pt-5 border-t border-zinc-100">
                  <div className="text-sm text-zinc-500">
                    {page.author || "System"} · {page.updatedAt || page.createdAt}
                  </div>

                  {renderActions(page)}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filteredPages.length > 0 && viewMode === "table" && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Seite
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Kategorie
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Organisation
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Tags
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktualisiert
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredPages.map((page) => {
                  const pageDepartment = String(page.department || "").trim();
                  const pageCategory = String(page.category || "").trim();
                  const pageTags = getSafeTags(page.tags);

                  return (
                    <tr
                      key={page.slug}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-5 py-4 align-top">
                        <Link
                          href={getWikiHref(page.slug)}
                          className="font-black text-zinc-950 hover:app-accent-text transition"
                        >
                          {page.title}
                        </Link>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {page.description ||
                            page.excerpt ||
                            "Keine Beschreibung vorhanden."}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {pageCategory ? (
                          <button
                            type="button"
                            onClick={() => setCategoryFilter(pageCategory)}
                            className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold"
                          >
                            {pageCategory}
                          </button>
                        ) : (
                          <span className="text-sm text-zinc-400">
                            Nicht gesetzt
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-medium">
                          {page.company || "Intern"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {pageDepartment || "Keine Abteilung"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {pageTags.length === 0 && (
                            <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                              Keine Tags
                            </span>
                          )}

                          {pageTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setTagFilter(tag)}
                              className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-500">
                        {page.updatedAt || page.createdAt}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {renderActions(page)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {latestPages.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold">
            Zuletzt sichtbar
          </h2>
          <p className="text-zinc-500 mt-1">
            Schneller Zugriff auf die neuesten sichtbaren Wiki-Seiten.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
            {latestPages.map((page) => (
              <Link
                key={page.slug}
                href={getWikiHref(page.slug)}
                className="bg-zinc-50 hover:bg-zinc-100 rounded-3xl p-5 transition"
              >
                <h3 className="font-black line-clamp-2">
                  {page.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-3 line-clamp-2">
                  {page.description ||
                    page.excerpt ||
                    "Keine Beschreibung vorhanden."}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}