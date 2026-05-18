"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  getStoredPages,
  savePages,
} from "../../../lib/wikiStorage";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  canCreate,
} from "../../../lib/permissions";

import FileUpload from "../../../components/wiki/FileUpload";

import FileList from "../../../components/wiki/FileList";

export default function CreateWikiPage() {
  const router = useRouter();

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
    setMounted(true);

    setAllowed(canCreate());
  }, []);

  function createSlug(value: string) {
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

    const pages =
      getStoredPages();

    const slug =
      createSlug(title);

    if (!slug) {
      alert(
        "Aus dem Titel konnte kein gültiger Slug erstellt werden."
      );

      return;
    }

    const exists =
      pages.some(
        (page: any) =>
          page.slug === slug
      );

    if (exists) {
      alert(
        "Eine Seite mit diesem Titel existiert bereits."
      );

      return;
    }

    const user =
      getUser();

    const newPage = {
      slug,

      title:
        title.trim(),

      company:
        company.trim() ||
        "Intern",

      category:
        category.trim(),

      description:
        description.trim(),

      author:
        user?.name ||
        "Unbekannt",

      updatedAt:
        new Date().toLocaleDateString(),

      tags: tags
        .split(",")
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean),

      content:
        content.trim(),
    };

    savePages([
      newPage,
      ...pages,
    ]);

    saveActivity({
      type: "created",

      title:
        newPage.title,

      company:
        newPage.company ||
        "Intern",

      user:
        user?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    setCreatedSlug(slug);

    router.push(
      `/wiki/${slug}`
    );
  }

  if (!mounted) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <h1 className="text-3xl font-bold">
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-3">
            Du darfst keine neuen Wiki-Seiten erstellen.
          </p>

          <Link
            href="/wiki"
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Wiki
          </Link>
        </div>
      </div>
    );
  }

  const previewSlug =
    createSlug(title);

  const uploadSlug =
    createdSlug || previewSlug;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/wiki"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          wiki
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          erstellen
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Neue Wiki Seite
            </h1>

            <p className="text-zinc-500 mt-2">
              Erstelle ein neues Dokument
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                type="text"
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
                type="text"
                value={company}
                onChange={(event) =>
                  setCompany(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z. B. Intern, Muster GmbH, Kunde A"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie / Abteilung
              </label>

              <input
                type="text"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z. B. IT"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <input
                type="text"
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

            <div>
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
                placeholder="# Überschrift&#10;&#10;Inhalt der Wiki-Seite..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <input
                type="text"
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
                Mit Komma trennen
              </p>
            </div>

            {uploadSlug ? (
              <>
                <FileUpload slug={uploadSlug} />

                <FileList
                  slug={uploadSlug}
                  editable={true}
                />
              </>
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

            <div className="flex flex-wrap gap-3">
              <button
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
            <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
              {company || "Intern"}
            </span>

            {category && (
              <span className="bg-zinc-100 text-zinc-700 text-sm px-3 py-1 rounded-full">
                {category}
              </span>
            )}
          </div>

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