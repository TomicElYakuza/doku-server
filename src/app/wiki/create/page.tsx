"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
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
  getCachedCurrentUser,
  loadCurrentUser,
} from "../../../lib/currentUserRepository";

import {
  activityRepository,
} from "../../../lib/activityRepository";

import type {
  Company,
  Department,
} from "../../../types/company";

import type {
  User,
} from "../../../types/user";

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

  const [currentUser, setCurrentUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

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

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(
        true
      );

      const [
        user,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          loadCurrentUser(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setCurrentUser(
        user
      );

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );

      setCompany(
        user?.company ||
          nextCompanies[0]?.name ||
          "Intern"
      );

      setDepartment(
        user?.department ||
          nextDepartments[0]?.name ||
          "Allgemein"
      );
    } catch (error) {
      console.error(
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function getDepartmentOptions() {
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
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

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
            currentUser?.name ||
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
          currentUser?.name ||
          "System",

        userEmail:
          currentUser?.email ||
          "",

        user:
          currentUser?.name ||
          "System",

        companyId:
          currentUser?.companyId ||
          "",

        departmentId:
          currentUser?.departmentId ||
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
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Wiki-Seite konnte nicht erstellt werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <p className="text-zinc-500">
          Formular wird geladen...
        </p>
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
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              <option value="Allgemein">
                Allgemein
              </option>

              {getDepartmentOptions().map(
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