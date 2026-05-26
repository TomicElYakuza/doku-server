"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  wikiRepository,
} from "../../../lib/wikiRepository";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import {
  activityRepository,
} from "../../../lib/activityRepository";

import {
  usePermissions,
} from "../../../hooks/usePermissions";

import type {
  Company,
  Department,
} from "../../../types/company";

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

export default function CreateWikiPage() {
  const router =
    useRouter();

  const {
    user,
    loading: permissionsLoading,
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

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (
      !user ||
      isAdmin ||
      canManageWiki
    ) {
      return;
    }

    setCompany(
      user.company ||
        "Intern"
    );

    setDepartment(
      user.department ||
        "Allgemein"
    );
  }, [
    user,
    isAdmin,
    canManageWiki,
  ]);

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

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

      if (user && !isAdmin && !canManageWiki) {
        setCompany(
          user.company ||
            "Intern"
        );

        setDepartment(
          user.department ||
            "Allgemein"
        );

        return;
      }

      setCompany(
        nextCompanies[0]?.name ||
          "Intern"
      );

      const firstDepartment =
        nextDepartments.find(
          (item) =>
            item.companyId === nextCompanies[0]?.id
        );

      setDepartment(
        firstDepartment?.name ||
          nextDepartments[0]?.name ||
          "Allgemein"
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Daten konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
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

    if (!canCreateWiki) {
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

    try {
      setSaving(
        true
      );

      const createdPage =
        await wikiRepository.create({
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
            user?.name ||
            "System",

          tags:
            splitTags(
              tags
            ),

          content:
            content.trim(),
        });

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
          createdPage.company,

        department:
          createdPage.department,

        metadata: {
          pageSlug:
            createdPage.slug,

          pageTitle:
            createdPage.title,
        },
      });

      router.push(
        `/wiki/${encodeURIComponent(
          createdPage.slug
        )}`
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "Wiki-Seite konnte nicht erstellt werden."
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
          Formular wird geladen...
        </p>
      </div>
    );
  }

  if (!canCreateWiki) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          Keine Berechtigung
        </h1>

        <p className="text-zinc-500 mt-2">
          Du hast keine Berechtigung, Wiki-Seiten zu erstellen.
        </p>

        <Link
          href="/wiki"
          className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
        >
          Zurück zum Wiki
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Wiki
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-bold">
          Neue Wiki-Seite
        </h1>

        <p className="text-zinc-500 mt-2">
          Erstelle eine neue Dokumentationsseite in PostgreSQL.
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
              onChange={(event) => {
                const value =
                  event.target.value;

                setTitle(
                  value
                );

                if (!slug) {
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
              rows={16}
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
              : "Wiki-Seite erstellen"}
          </button>

          <Link
            href="/wiki"
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}