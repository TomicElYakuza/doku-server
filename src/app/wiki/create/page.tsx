"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import ReactMarkdown from "react-markdown";

import FileUpload from "../../../components/wiki/FileUpload";

import FileList from "../../../components/wiki/FileList";

import {
  getStoredPages,
  savePages,
} from "../../../lib/wikiStorage";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  canCreate,
} from "../../../lib/permissions";

export default function CreateWikiPage() {
  const router = useRouter();

  const [mounted, setMounted] =
    useState(false);

  const [allowed, setAllowed] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [content, setContent] =
    useState(`# Neue Dokumentation

## Einleitung

Dokumentation hier schreiben...
`);

  useEffect(() => {
    setMounted(true);

    setAllowed(canCreate());
  }, []);

  const slug = title
    .toLowerCase()
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^\w-]/g, "");

  function handleCreate() {
    if (!allowed) {
      alert(
        "Du hast keine Berechtigung, Dokumente zu erstellen."
      );

      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");

      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Kategorie eingeben.");

      return;
    }

    const pages = getStoredPages();

    const pageExists = pages.some(
      (page: any) =>
        page.slug === slug
    );

    if (pageExists) {
      alert(
        "Eine Seite mit diesem Titel existiert bereits."
      );

      return;
    }

    const newPage = {
      slug,

      title,

      category,

      description,

      author:
        getUser()?.name ||
        "Unbekannt",

      updatedAt:
        new Date().toLocaleDateString(),

      tags: tags
        .split(",")
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean),

      content,
    };

    const updatedPages = [
      ...pages,
      newPage,
    ];

    savePages(updatedPages);

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );

    saveActivity({
      type: "created",

      title,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    router.push(`/wiki/${slug}`);
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

  return (
    <div className="space-y-6">
      {/* TOP NAV */}
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
          neue seite
        </span>
      </div>

      {/* BACK BUTTON */}
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* EDITOR */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Neue Wiki Seite
            </h1>

            <p className="text-zinc-500 mt-2">
              Dokument erstellen
            </p>
          </div>

          <div className="space-y-6">
            {/* TITEL */}
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="VPN Einrichtung"
              />

              {slug && (
                <p className="text-sm text-zinc-500 mt-2">
                  URL: /wiki/{slug}
                </p>
              )}
            </div>

            {/* KATEGORIE */}
            <div>
              <label className="block mb-2 font-medium">
                Kategorie / Abteilung
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="IT"
              />
            </div>

            {/* BESCHREIBUNG */}
            <div>
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Kurze Zusammenfassung des Dokuments"
              />
            </div>

            {/* INHALT */}
            <div>
              <label className="block mb-2 font-medium">
                Inhalt (Markdown)
              </label>

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(
                    e.target.value
                  )
                }
                rows={20}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none font-mono"
              />
            </div>

            {/* TAGS */}
            <div>
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <input
                type="text"
                value={tags}
                onChange={(e) =>
                  setTags(
                    e.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="vpn, remote, it"
              />

              <p className="text-sm text-zinc-500 mt-2">
                Mit Komma trennen
              </p>
            </div>

            {/* FILES */}
            {slug && (
              <div className="space-y-4">
                <FileUpload slug={slug} />

                <FileList
                  slug={slug}
                  editable={true}
                />
              </div>
            )}

            {!slug && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                <p className="text-zinc-500">
                  Dateien können hochgeladen werden, sobald ein Titel vergeben wurde.
                </p>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreate}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                Dokument erstellen
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

        {/* PREVIEW */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm h-fit sticky top-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Live Vorschau
            </h2>

            <p className="text-zinc-500 mt-2">
              Markdown Darstellung
            </p>
          </div>

          <article className="prose prose-zinc max-w-none">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}