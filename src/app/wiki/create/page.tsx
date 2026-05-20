"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  wikiRepository,
} from "../../../lib/wikiRepository";

import {
  activityRepository,
} from "../../../lib/activityRepository";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  canCreate,
} from "../../../lib/permissions";

import FileUpload from "../../../components/wiki/FileUpload";

import FileList from "../../../components/wiki/FileList";

function createSlug(
  value: string
) {
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

export default function CreateWikiPage() {
  const router =
    useRouter();

  const [mounted, setMounted] =
    useState(false);

  const [allowed, setAllowed] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [content, setContent] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [createdSlug, setCreatedSlug] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    setAllowed(
      canCreate()
    );
  }, []);

  function handleCreate() {
    if (!allowed) {
      alert(
        "Du hast keine Berechtigung, eine Seite zu erstellen."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    if (!company.trim()) {
      alert(
        "Bitte eine Firma eingeben."
      );

      return;
    }

    if (!category.trim()) {
      alert(
        "Bitte eine Kategorie / Abteilung eingeben."
      );

      return;
    }

    const slug =
      createSlug(
        title
      );

    if (!slug) {
      alert(
        "Aus dem Titel konnte kein gültiger Slug erstellt werden."
      );

      return;
    }

    const exists =
      Boolean(
        wikiRepository.findBySlug(
          slug
        )
      );

    if (exists) {
      alert(
        "Eine Seite mit diesem Titel existiert bereits."
      );

      return;
    }

    const user =
      getUser();

    const newPage =
      wikiRepository.create({
        slug,

        title:
          title.trim(),

        company:
          company.trim() ||
          "Intern",

        category:
          category.trim(),

        department:
          category.trim(),

        description:
          description.trim(),

        excerpt:
          description.trim(),

        author:
          user?.name ||
          "Unbekannt",

        updatedAt:
          new Date().toLocaleDateString(),

        createdAt:
          new Date().toLocaleDateString(),

        tags:
          tags
            .split(",")
            .map(
              (tag) =>
                tag.trim()
            )
            .filter(Boolean),

        content:
          content.trim(),
      });

    activityRepository.create({
      type:
        "created",

      title:
        String(
          newPage.title ||
            title.trim()
        ),

      company:
        String(
          newPage.company ||
            "Intern"
        ),

      user:
        user?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    setCreatedSlug(
      slug
    );

    router.push(
      `/wiki/${encodeURIComponent(
        slug
      )}`
    );
  }

  if (!mounted) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-3">
            Du darfst keine neuen Wiki-Seiten erstellen.
          </p>

          <Link
            href="/wiki"
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Wiki
          </Link>
        </div>
      </div>
    );
  }

  const previewSlug =
    createSlug(
      title
    );

  const uploadSlug =
    createdSlug ||
    previewSlug;

  const previewTags =
    tags
      .split(",")
      .map(
        (tag) =>
          tag.trim()
      )
      .filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <Link
          href="/wiki"
          className="hover:text-zinc-900 transition"
        >
          Wiki
        </Link>

        <span>/</span>

        <span>
          Erstellen
        </span>
      </div>

      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Neue Wiki Seite
          </h1>

          <p className="text-zinc-500 mt-2">
            Erstelle ein neues Dokument.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div className="md:col-span-2">
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
                placeholder="z. B. VPN einrichten"
              />

              {previewSlug && (
                <p className="text-sm text-zinc-500 mt-2">
                  Slug:{" "}
                  <span className="font-mono">
                    {previewSlug}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <input
                value={company}
                onChange={(event) =>
                  setCompany(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Intern"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie / Abteilung
              </label>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="IT"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Kurze Zusammenfassung des Dokuments"
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
                rows={20}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none font-mono"
                placeholder="# Überschrift&#10;Inhalt der Wiki-Seite..."
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
                placeholder="vpn, remote, it"
              />

              <p className="text-sm text-zinc-500 mt-2">
                Mit Komma trennen.
              </p>
            </div>

            <div className="md:col-span-2">
              {uploadSlug ? (
                <div className="space-y-4">
                  <FileUpload
                    slug={uploadSlug}
                  />

                  <FileList
                    slug={uploadSlug}
                    editable={true}
                  />
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <h3 className="font-semibold">
                    Anhänge
                  </h3>

                  <p className="text-sm text-zinc-500 mt-2">
                    Gib zuerst einen Titel ein, damit Dateien einem Slug zugeordnet werden können.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleCreate}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              Seite erstellen
            </button>

            <Link
              href="/wiki"
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </Link>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm h-fit sticky top-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Live Vorschau
            </h2>

            <p className="text-zinc-500 mt-2">
              Markdown Darstellung
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
              {company || "Intern"}
            </span>

            {category && (
              <span className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
                {category}
              </span>
            )}
          </div>

          {previewTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {previewTags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                )
              )}
            </div>
          )}

          <article className="prose prose-zinc max-w-none">
            <ReactMarkdown>
              {content ||
                "Noch kein Inhalt vorhanden."}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}