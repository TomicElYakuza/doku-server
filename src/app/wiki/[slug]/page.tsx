"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  activityRepository,
} from "../../../lib/activityRepository";
import {
  companyRepository,
} from "../../../lib/companyRepository";
import {
  wikiRepository,
} from "../../../lib/wikiRepository";
import {
  usePermissions,
} from "../../../hooks/usePermissions";
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  WikiPage,
} from "../../../types/wiki";

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

function getPageSlug(page: WikiPage) {
  return String(page.slug || "");
}

function getPageTitle(page: WikiPage) {
  return String(page.title || "Unbenannt");
}

function getPageContent(page: WikiPage) {
  return String(page.content || "");
}

function getPageDescription(page: WikiPage) {
  return String(
    page.description ||
      page.excerpt ||
      "Keine Beschreibung vorhanden.",
  );
}

function getPageTags(page: WikiPage) {
  if (Array.isArray(page.tags)) {
    return page.tags
      .map((tag) => String(tag || "").trim())
      .filter(Boolean);
  }

  return [];
}

function getSafeCategory(category?: string) {
  return String(category || "").trim() || "Nicht zugeordnet";
}

function getSafeCompany(company?: string) {
  return String(company || "").trim() || "Intern";
}

function getSafeDepartment(department?: string) {
  return String(department || "").trim() || "Keine Abteilung";
}

function getTaxonomyLabel(
  item: TaxonomyItem,
  allItems: TaxonomyItem[],
) {
  if (item.path) {
    return item.path;
  }

  const names: string[] = [];
  let current: TaxonomyItem | undefined = item;
  const visited = new Set<string>();

  while (
    current &&
    !visited.has(current.id)
  ) {
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

function getReadingTime(text: string) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (words === 0) {
    return "0 Min.";
  }

  return `${Math.max(1, Math.ceil(words / 220))} Min.`;
}

function getCategoryClass(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("ticket")) {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (
    normalized.includes("wiki") ||
    normalized.includes("dokumentation")
  ) {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (
    normalized.includes("system") ||
    normalized.includes("admin")
  ) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    normalized.includes("organisation") ||
    normalized.includes("firma") ||
    normalized.includes("abteilung")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (category) {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function formatContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function WikiDetailPage() {
  const params = useParams();
  const router = useRouter();

  const {
    user,
    loading: permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const canManageWiki =
    isAdmin ||
    hasAnyPermission([
      "wiki.manage",
    ]);

  const canViewWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.view",
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

  const slug = String(params.slug || "");

  const [page, setPage] = useState<WikiPage | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wikiCategories, setWikiCategories] = useState<TaxonomyItem[]>([]);
  const [wikiTags, setWikiTags] = useState<TaxonomyItem[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState("");

  const [title, setTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
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
    void loadPage();

    function handleWikiPagesUpdated() {
      void loadPage();
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
  }, [
    slug,
  ]);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      fetch("/api/taxonomy?target=wiki&type=category"),
      fetch("/api/taxonomy?target=global&type=tag"),
      fetch("/api/taxonomy?target=wiki&type=tag"),
    ]);

    const nextWikiCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [
      index,
      result,
    ] of requests.entries()) {
      if (
        result.status !== "fulfilled" ||
        !result.value.ok
      ) {
        continue;
      }

      const data = await result.value.json();
      const items = Array.isArray(data) ? data : [];

      if (index === 0) {
        nextWikiCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setWikiCategories(
      nextWikiCategories.filter(
        (item) => item.isActive !== false,
      ),
    );

    const uniqueTags = Array.from(
      new Map(
        nextTags
          .filter((item) => item.isActive !== false)
          .map((item) => [
            item.name,
            item,
          ]),
      ).values(),
    );

    setWikiTags(uniqueTags);
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

  async function loadPage() {
    if (!slug) {
      setLoading(false);
      setError("Kein Wiki-Slug vorhanden.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        nextPage,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        wikiRepository.findBySlug(decodeURIComponent(slug)),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        loadTaxonomyItems(),
      ]);

      setPage(nextPage);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);

      if (!nextPage) {
        setError("Wiki-Seite wurde nicht gefunden.");
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seite konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function userCanSeePage(wikiPage: WikiPage) {
    if (
      isAdmin ||
      canManageWiki
    ) {
      return true;
    }

    if (
      !user ||
      !canViewWiki
    ) {
      return false;
    }

    const pageCompany = wikiPage.company || "";
    const pageDepartment = wikiPage.department || "";

    if (user.department) {
      return pageDepartment === user.department;
    }

    if (user.company) {
      return pageCompany === user.company;
    }

    return false;
  }

  const categoryOptions = useMemo(
    () =>
      wikiCategories
        .map((item) => ({
          id: item.id,
          value: getTaxonomyLabel(item, wikiCategories),
          label: getTaxonomyLabel(item, wikiCategories),
        }))
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
        .sort(sortByLabel),
    [
      wikiTags,
    ],
  );

  const companyOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...companies.map((nextCompany) => nextCompany.name),
          page?.company || "Intern",
        ]),
      )
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [
      companies,
      page,
    ],
  );

  const departmentOptions = useMemo(() => {
    const values = Array.from(
      new Set([
        ...departments.map((nextDepartment) => nextDepartment.name),
        page?.department || "",
      ]),
    )
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));

    if (!company) {
      return values;
    }

    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.name === company,
    );

    if (!selectedCompany) {
      return values;
    }

    const filteredByCompany = departments
      .filter(
        (nextDepartment) =>
          nextDepartment.companyId === selectedCompany.id,
      )
      .map((nextDepartment) => nextDepartment.name)
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return Array.from(
      new Set([
        ...filteredByCompany,
        page?.department || "",
      ]),
    )
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }, [
    departments,
    companies,
    page,
    company,
  ]);

  const pageTags = useMemo(
    () => (page ? getPageTags(page) : []),
    [
      page,
    ],
  );

  const pageContent = useMemo(
    () => (page ? getPageContent(page) : ""),
    [
      page,
    ],
  );

  const contentParagraphs = useMemo(
    () => formatContent(pageContent),
    [
      pageContent,
    ],
  );

  function closeModal() {
    setModalOpen(false);
    setEditingSlug("");
    setTitle("");
    setFormSlug("");
    setDescription("");
    setContent("");
    setCategory("");
    setCompany("Intern");
    setDepartment("");
    setAuthor("System");
    setSelectedTags([]);
  }

  function startEditPage(wikiPage: WikiPage) {
    if (!canEditWiki) {
      alert("Du hast keine Berechtigung, diese Seite zu bearbeiten.");
      return;
    }

    setEditingSlug(wikiPage.slug);
    setTitle(wikiPage.title);
    setFormSlug(wikiPage.slug);
    setDescription(wikiPage.description || wikiPage.excerpt || "");
    setContent(wikiPage.content || "");
    setCategory(wikiPage.category || categoryOptions[0]?.value || "");
    setCompany(wikiPage.company || "Intern");
    setDepartment(wikiPage.department || "");
    setAuthor(wikiPage.author || user?.name || "System");
    setSelectedTags(getPageTags(wikiPage));
    setModalOpen(true);
  }

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter(
          (currentTag) => currentTag !== tag,
        );
      }

      return [
        ...currentTags,
        tag,
      ];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!page) {
      return;
    }

    if (!canEditWiki) {
      alert("Du hast keine Berechtigung, diese Seite zu bearbeiten.");
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

    const nextSlug =
      formSlug.trim() ||
      createSlugFromTitle(title);

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
        author:
          author.trim() ||
          user?.name ||
          "System",
        tags: selectedTags,
      };

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

      if (nextSlug !== editingSlug) {
        router.push(`/wiki/${encodeURIComponent(nextSlug)}`);
        return;
      }

      await loadPage();
      setMessage("Wiki-Seite wurde gespeichert.");
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

  async function handleDelete() {
    if (!page) {
      return;
    }

    if (!canDeleteWiki) {
      alert("Du hast keine Berechtigung, diese Seite zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Wiki-Seite "${getPageTitle(page)}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await wikiRepository.delete(getPageSlug(page));

      void activityRepository.create({
        type: "deleted",
        title: "Wiki-Seite gelöscht",
        description: `Wiki-Seite "${getPageTitle(page)}" wurde gelöscht.`,
        entityType: "wiki",
        entityId: getPageSlug(page),
        userName: user?.name || "System",
        userEmail: user?.email || "",
        user: user?.name || "System",
        companyId: "",
        departmentId: "",
        company: page.company || "Intern",
        department: page.department || "",
        metadata: {
          pageSlug: getPageSlug(page),
          pageTitle: getPageTitle(page),
        },
      });

      router.push("/wiki");
    } catch (deleteError) {
      console.error(deleteError);

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Wiki-Seite konnte nicht gelöscht werden.",
      );
    }
  }

  if (
    loading ||
    permissionsLoading
  ) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>

          <h1 className="text-2xl font-black mt-6">
            Wiki-Seite wird geladen
          </h1>

          <p className="text-zinc-500 mt-2">
            Der Eintrag wird aus PostgreSQL geladen.
          </p>
        </div>
      </div>
    );
  }

  if (
    error ||
    !page
  ) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Wiki"
          title="Wiki-Seite nicht gefunden"
          description={error || "Diese Seite existiert nicht oder wurde entfernt."}
          badges={[
            {
              label: slug || "Kein Slug",
            },
            {
              label: "Nicht verfügbar",
            },
          ]}
          actions={
            <Link
              href="/wiki"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Zurück zum Wiki
            </Link>
          }
        />

        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Seite nicht verfügbar
          </h2>
          <p className="text-red-600 mt-2">
            {error || "Diese Wiki-Seite konnte nicht geladen werden."}
          </p>
        </div>
      </div>
    );
  }

  if (!userCanSeePage(page)) {
    return (
      <AccessDeniedCard
        title="Wiki-Seite nicht verfügbar"
        description="Du hast keine Berechtigung, diese Wiki-Seite zu sehen."
        backHref="/wiki"
        backLabel="Zurück zum Wiki"
      />
    );
  }

  const pageCompany = getSafeCompany(page.company);
  const pageDepartment = getSafeDepartment(page.department);
  const pageCategory = getSafeCategory(page.category);
  const pageDescription = getPageDescription(page);

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title="Wiki-Seite bearbeiten"
        description="Titel, Slug, Kategorie, Organisation, Inhalt und Tags bearbeiten."
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
              form="wiki-edit-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </>
        }
      >
        <form
          id="wiki-edit-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-8"
        >
          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Seitendaten
              </h3>
              <p className="text-zinc-500 mt-1">
                Titel, Slug, Kategorie und Autor.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">
                  Titel
                </label>
                <input
                  value={title}
                  onChange={(event) => {
                    const value = event.target.value;

                    setTitle(value);

                    if (!formSlug) {
                      setFormSlug(createSlugFromTitle(value));
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
                  value={formSlug}
                  onChange={(event) =>
                    setFormSlug(
                      createSlugFromTitle(event.target.value),
                    )
                  }
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
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Organisation
              </h3>
              <p className="text-zinc-500 mt-1">
                Firma und Abteilung steuern Sichtbarkeit und Zuordnung.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                  <option value="Intern">
                    Intern
                  </option>

                  {companyOptions
                    .filter((option) => option !== "Intern")
                    .map((option) => (
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
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-xl font-black">
                Inhalt
              </h3>
              <p className="text-zinc-500 mt-1">
                Kurzbeschreibung, Volltext und vordefinierte Tags.
              </p>
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
                rows={12}
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
                  Noch keine globalen Wiki-Tags im Admin Backend vorhanden.
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
                            ? "app-accent-bg text-white border-transparent app-brand-shadow"
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
          </section>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Wiki Detail"
        title={getPageTitle(page)}
        description={pageDescription}
        badges={[
          {
            label: pageCompany,
          },
          {
            label: pageDepartment,
          },
          {
            label: pageCategory,
          },
          {
            label: `${pageTags.length} Tags`,
          },
        ]}
        actions={
          <>
            <Link
              href="/wiki"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Zurück zum Wiki
            </Link>

            {canEditWiki && (
              <button
                type="button"
                onClick={() => startEditPage(page)}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                Bearbeiten
              </button>
            )}

            {canDeleteWiki && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition font-bold"
              >
                Löschen
              </button>
            )}
          </>
        }
      />

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
          label="Kategorie"
          value={pageCategory}
          description="Aus dem Admin Backend"
          icon="📚"
          tone="indigo"
        />

        <StatCard
          label="Tags"
          value={pageTags.length}
          description="Vordefinierte Tags"
          icon="#âƒ£"
          tone="purple"
        />

        <StatCard
          label="Lesedauer"
          value={getReadingTime(pageContent)}
          description="Geschätzt"
          icon="â±"
          tone="blue"
        />

        <StatCard
          label="Slug"
          value={getPageSlug(page)}
          description="Eindeutige Seiten-Adresse"
          icon="🔗"
          tone="green"
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          <article className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-bold ${getCategoryClass(
                    pageCategory,
                  )}`}
                >
                  {pageCategory}
                </span>

                <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1 rounded-full font-bold">
                  {pageCompany}
                </span>

                <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1 rounded-full font-bold">
                  {pageDepartment}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-6">
                {getPageTitle(page)}
              </h1>

              <p className="text-xl text-zinc-500 leading-8 mt-5">
                {pageDescription}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-zinc-100">
                <div className="h-11 w-11 rounded-2xl app-accent-bg text-white flex items-center justify-center font-black app-brand-shadow">
                  {(page.author || "S").charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-black text-zinc-950">
                    {page.author || "System"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Aktualisiert am {page.updatedAt || page.createdAt || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-10">
                {contentParagraphs.length > 0 ? (
                  <div className="space-y-5">
                    {contentParagraphs.map((paragraph, index) => (
                      <p
                        key={`${getPageSlug(page)}-paragraph-${index}`}
                        className="text-zinc-700 leading-8 text-lg whitespace-pre-wrap"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500">
                    Noch kein Inhalt vorhanden.
                  </p>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-zinc-100">
                <h3 className="text-xl font-black">
                  Tags
                </h3>

                <div className="flex flex-wrap gap-2 mt-4">
                  {pageTags.length === 0 && (
                    <span className="text-sm bg-zinc-100 text-zinc-500 px-3 py-2 rounded-xl">
                      Keine Tags
                    </span>
                  )}

                  {pageTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/wiki?tag=${encodeURIComponent(tag)}`}
                      className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Schnellaktionen
              </h2>
              <p className="text-zinc-500 mt-1">
                Seite bearbeiten oder verwandte Wiki-Seiten öffnen.
              </p>

              <div className="space-y-3 mt-6">
                {canEditWiki && (
                  <button
                    type="button"
                    onClick={() => startEditPage(page)}
                    className="w-full flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                  >
                    <span>Wiki-Seite bearbeiten</span>
                    <span>→</span>
                  </button>
                )}

                <Link
                  href={`/wiki?category=${encodeURIComponent(pageCategory)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Kategorie öffnen</span>
                  <span>→</span>
                </Link>

                <Link
                  href={`/wiki?company=${encodeURIComponent(pageCompany)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Firma öffnen</span>
                  <span>→</span>
                </Link>

                <Link
                  href={`/wiki?department=${encodeURIComponent(pageDepartment)}`}
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-4 py-4 rounded-2xl transition font-bold"
                >
                  <span>Gleiche Abteilung öffnen</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Seitendaten
            </h2>
            <p className="text-zinc-500 mt-1">
              Technische und organisatorische Informationen.
            </p>

            <div className="space-y-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Slug
                </p>
                <p className="font-black mt-1 break-all">
                  {getPageSlug(page)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Firma
                </p>
                <p className="font-black mt-1">
                  {pageCompany}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Abteilung
                </p>
                <p className="font-black mt-1">
                  {pageDepartment}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Kategorie
                </p>
                <p className="font-black mt-1">
                  {pageCategory}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Erstellt
                </p>
                <p className="font-black mt-1">
                  {page.createdAt || "-"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Aktualisiert
                </p>
                <p className="font-black mt-1">
                  {page.updatedAt || "-"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
