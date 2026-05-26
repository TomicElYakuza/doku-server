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

import {
  wikiRepository,
} from "../../../../lib/wikiRepository";

import {
  companyRepository,
} from "../../../../lib/companyRepository";

import {
  activityRepository,
} from "../../../../lib/activityRepository";

import {
  usePermissions,
} from "../../../../hooks/usePermissions";

import type {
  Company,
  Department,
} from "../../../../types/company";

import type {
  WikiPage,
} from "../../../../types/wiki";

function createSlug(
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

export default function EditWikiPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const {
    user,
    loading:
      permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageWiki =
    isAdmin ||
    hasAnyPermission([
      "wiki.manage",
    ]);

  const canEditWiki =
    canManageWiki ||
    hasAnyPermission([
      "wiki.edit",
    ]);

  const originalSlug =
    String(
      params.slug ||
        ""
    );

  const decodedOriginalSlug =
    decodeURIComponent(
      originalSlug
    );

  const [page, setPage] =
    useState<WikiPage | null>(null);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [title, setTitle] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("Allgemein");

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

  useEffect(() => {
    void loadData();
  }, [
    decodedOriginalSlug,
  ]);

  async function loadData() {
    if (!decodedOriginalSlug) {
      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextPage,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          wikiRepository.findBySlug(
            decodedOriginalSlug
          ),
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

      if (!nextPage) {
        setError(
          "Wiki-Seite wurde nicht gefunden."
        );

        return;
      }

      setPage(
        nextPage
      );

      setTitle(
        nextPage.title ||
          ""
      );

      setSlug(
        nextPage.slug ||
          ""
      );

      setDescription(
        nextPage.description ||
          nextPage.excerpt ||
          ""
      );

      setCompany(
        nextPage.company ||
          "Intern"
      );

      setDepartment(
        nextPage.department ||
          nextPage.category ||
          "Allgemein"
      );

      setTags(
        Array.isArray(
          nextPage.tags
        )
          ? nextPage.tags.join(
              ", "
            )
          : ""
      );

      setContent(
        nextPage.content ||
          ""
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Wiki-Seite konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function userCanEditPage(
    wikiPage: WikiPage
  ) {
    if (isAdmin || canManageWiki) {
      return true;
    }

    if (
      !user ||
      !canEditWiki
    ) {
      return false;
    }

    const pageCompany =
      wikiPage.company ||
      "";

    const pageDepartment =
      wikiPage.department ||
      wikiPage.category ||
      "";

    if (user.department) {
      return pageDepartment === user.department;
    }

    if (user.company) {
      return pageCompany === user.company;
    }

    return false;
  }

  const departmentOptions =
    useMemo(
      () => {
        const selectedCompany =
          companies.find(
            (item) =>
              item.name === company
          );

        if (!selectedCompany) {
          return departments;
        }

        return departments.filter(
          (item) =>
            item.companyId === selectedCompany.id
        );
      },
      [
        companies,
        departments,
        company,
      ]
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!page) {
      return;
    }

    if (!userCanEditPage(page)) {
      alert(
        "Du hast keine Berechtigung, diese Wiki-Seite zu bearbeiten."
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

    try {
      setSaving(
        true
      );

      const updatedPage =
        await wikiRepository.update(
          decodedOriginalSlug,
          {
            title:
              title.trim(),

            slug:
              nextSlug,

            description:
              description.trim(),

            excerpt:
              description.trim(),

            company:
              company ||
              "Intern",

            category:
              department ||
              "Allgemein",

            department:
              department ||
              "Allgemein",

            author:
              page.author ||
              user?.name ||
              "System",

            tags:
              splitTags(
                tags
              ),

            content,
          }
        );

      if (!updatedPage) {
        alert(
          "Wiki-Seite konnte nicht gespeichert werden."
        );

        return;
      }

      void activityRepository.create({
        type:
          "edited",

        title:
          "Wiki-Seite bearbeitet",

        description:
          `Wiki-Seite "${updatedPage.title}" wurde bearbeitet.`,

        entityType:
          "wiki",

        entityId:
          updatedPage.slug,

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
          updatedPage.company ||
          "Intern",

        department:
          updatedPage.department ||
          "Allgemein",

        metadata: {
          pageSlug:
            updatedPage.slug,

          previousSlug:
            decodedOriginalSlug,

          pageTitle:
            updatedPage.title,
        },
      });

      router.push(
        `/wiki/${encodeURIComponent(
          updatedPage.slug
        )}`
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
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

  if (
    loading ||
    permissionsLoading
  ) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <p className="text-zinc-500">
          Wiki-Seite wird geladen...
        </p>
      </div>
    );
  }

  if (
    error ||
    !page
  ) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Wiki
        </Link>

        <h1 className="text-3xl font-bold mt-8">
          Seite nicht gefunden
        </h1>

        <p className="text-zinc-500 mt-2">
          {error ||
            "Diese Wiki-Seite existiert nicht."}
        </p>
      </div>
    );
  }

  if (!userCanEditPage(page)) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <Link
          href={`/wiki/${encodeURIComponent(
            decodedOriginalSlug
          )}`}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Wiki-Seite
        </Link>

        <h1 className="text-3xl font-bold mt-8">
          Keine Berechtigung
        </h1>

        <p className="text-zinc-500 mt-2">
          Du hast keine Berechtigung, diese Wiki-Seite zu bearbeiten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/wiki/${encodeURIComponent(
            decodedOriginalSlug
          )}`}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Wiki-Seite
        </Link>
      </div>

      <div>
        <h1 className="text-4xl font-bold">
          Wiki-Seite bearbeiten
        </h1>

        <p className="text-zinc-500 mt-2">
          Bearbeite Inhalt, Zuordnung und Tags dieser Seite.
        </p>
      </div>

      <form
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-2 font-medium">
              Titel
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
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
              onChange={(event) => {
                const nextCompany =
                  event.target.value;

                setCompany(
                  nextCompany
                );

                const selectedCompany =
                  companies.find(
                    (item) =>
                      item.name === nextCompany
                  );

                const firstDepartment =
                  departments.find(
                    (item) =>
                      item.companyId === selectedCompany?.id
                  );

                setDepartment(
                  firstDepartment?.name ||
                    "Allgemein"
                );
              }}
              disabled={!isAdmin && !canManageWiki}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              <option value="Intern">
                Intern
              </option>

              {companies.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.name}
                  >
                    {item.name}
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
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
              disabled={!isAdmin && !canManageWiki}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              <option value="Allgemein">
                Allgemein
              </option>

              {departmentOptions.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.name}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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
              rows={18}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y font-mono text-sm"
              placeholder="Inhalt der Wiki-Seite..."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {saving
              ? "Speichert..."
              : "Änderungen speichern"}
          </button>

          <Link
            href={`/wiki/${encodeURIComponent(
              decodedOriginalSlug
            )}`}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}