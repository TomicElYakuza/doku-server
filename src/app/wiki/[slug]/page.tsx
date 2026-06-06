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

  const slug = Array.isArray(params.slug)
    ? String(params.slug[0] || "")
    : String(params.slug || "");

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

  async function loadPage() {
    if (!slug) {
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
    if (isAdmin || canManageWiki) {
      return true;
    }

    if (!user || !canViewWiki) {
      return false;
    }

    const pageCompany = String(wikiPage.company || "");
    const pageDepartment = String(wikiPage.department || "");

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
          page?.company || "Intern",
        ]),
      )
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [
      companies,
      page,
    ],
  );

  const departmentOptions = useMemo(() => {
    const baseValues = Array.from(
      new Set([
        ...departments.map((nextDepartment) => nextDepartment.name),
        String(page?.department || "").trim(),
      ]),
    )
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));

    if (!company) {
      return baseValues;
    }

    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.name === company,
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
        String(page?.department || "").trim(),
      ]),
    )
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }, [
    departments,
    companies,
    page,
    company,
  ]);

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
    setSelectedTags(getSafeTags(wikiPage.tags));
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

    const nextSlug = formSlug.trim() || createSlugFromTitle(title);

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

  if (loading || permissionsLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <p className="text-zinc-500">
          Wiki-Seite wird geladen...
        </p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Wiki"
          title="Wiki-Seite nicht gefunden"
          description={error || "Diese Wiki-Seite ist nicht vorhanden."}
          actions={
            <Link
              href="/wiki"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zum Wiki
            </Link>
          }
        />
      </div>
    );
  }

  if (!userCanSeePage(page)) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="Wiki"
          title="Kein Zugriff"
          description="Du hast keine Berechtigung, diese Wiki-Seite zu sehen."
          actions={
            <Link
              href="/wiki"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zum Wiki
            </Link>
          }
        />
      </div>
    );
  }

  const tags = getSafeTags(page.tags);
  const pageCompany = page.company || "Intern";
  const pageDepartment = String(page.department || "").trim();
  const pageCategory = String(page.category || "").trim();
  const pageDescription =
    page.description ||
    page.excerpt ||
    "Keine Beschreibung vorhanden.";

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title="Wiki-Seite bearbeiten"
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
              form="wiki-detail-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </>
        }
      >
        <form
          id="wiki-detail-form"
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
                onChange={(event) => setTitle(event.target.value)}
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
                onChange={(event) => setFormSlug(event.target.value)}
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
        eyebrow="Wiki Detail"
        title={getPageTitle(page)}
        description={pageDescription}
        badges={[
          {
            label: pageCompany,
          },
          ...(pageDepartment
            ? [
                {
                  label: pageDepartment,
                },
              ]
            : []),
          ...(pageCategory
            ? [
                {
                  label: pageCategory,
                },
              ]
            : []),
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/wiki"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zum Wiki
            </Link>

            {canEditWiki && (
              <button
                type="button"
                onClick={() => startEditPage(page)}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Bearbeiten
              </button>
            )}

            {canDeleteWiki && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
              >
                Löschen
              </button>
            )}
          </div>
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
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Kategorie"
          value={pageCategory || "Nicht gesetzt"}
          description="Aus dem Admin Backend"
          icon="🗂️"
          tone="indigo"
        />
        <StatCard
          label="Tags"
          value={tags.length}
          description="Vordefinierte Tags"
          icon="🏷️"
          tone="purple"
        />
        <StatCard
          label="Autor"
          value={page.author || "System"}
          description="Ersteller der Wiki-Seite"
          icon="👤"
          tone="blue"
        />
        <StatCard
          label="Slug"
          value={getPageSlug(page)}
          description="Eindeutige Seiten-Adresse"
          icon="🔗"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="prose prose-zinc max-w-none">
              <div className="whitespace-pre-wrap leading-8 text-zinc-800">
                {getPageContent(page) || "Noch kein Inhalt vorhanden."}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Seitendaten
            </h2>

            <div className="space-y-4 mt-5 text-sm">
              <div>
                <p className="text-zinc-400">
                  Firma
                </p>
                <p className="font-medium text-zinc-800">
                  {pageCompany}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Abteilung
                </p>
                <p className="font-medium text-zinc-800">
                  {pageDepartment || "Keine Abteilung"}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Kategorie
                </p>
                <p className="font-medium text-zinc-800">
                  {pageCategory || "Nicht gesetzt"}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Erstellt
                </p>
                <p className="font-medium text-zinc-800">
                  {page.createdAt || "-"}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">
                  Aktualisiert
                </p>
                <p className="font-medium text-zinc-800">
                  {page.updatedAt || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Tags
            </h2>

            <div className="flex flex-wrap gap-2 mt-5">
              {tags.length === 0 && (
                <span className="text-sm bg-zinc-100 text-zinc-500 px-3 py-2 rounded-xl">
                  Keine Tags
                </span>
              )}

              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/wiki?tag=${encodeURIComponent(tag)}`}
                  className="text-sm bg-zinc-100 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-200 transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Schnellfilter
            </h2>

            <div className="space-y-3 mt-5">
              {pageCategory && (
                <Link
                  href={`/wiki?category=${encodeURIComponent(pageCategory)}`}
                  className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
                >
                  Gleiche Kategorie öffnen
                </Link>
              )}

              <Link
                href={`/wiki?company=${encodeURIComponent(pageCompany)}`}
                className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
              >
                Gleiche Firma öffnen
              </Link>

              {pageDepartment && (
                <Link
                  href={`/wiki?department=${encodeURIComponent(pageDepartment)}`}
                  className="block bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-2xl transition"
                >
                  Gleiche Abteilung öffnen
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}