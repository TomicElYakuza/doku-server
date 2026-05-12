"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  getStoredPages,
  savePages,
} from "../../../lib/wikiStorage";

import {
  getUser,
} from "../../../lib/userStorage";

export default function CreateWikiPage() {
  const router = useRouter();

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [content, setContent] =
    useState(`# Neue Dokumentation

## Einleitung

Dokumentation hier schreiben...
`);

  function handleCreate() {
    const pages = getStoredPages();

    const slug = title
      .toLowerCase()
      .replaceAll(" ", "-");

    const newPage = {
      slug,

      title,

      category,

      description: "",

      author:
        getUser()?.name ||
        "Unbekannt",

      updatedAt:
        new Date().toLocaleDateString(),

      tags: tags
        .split(",")
        .map((tag) =>
          tag.trim()
        ),

      content,
    };

    const updatedPages = [
      ...pages,
      newPage,
    ];

    savePages(updatedPages);

    router.push("/wiki");
  }

  return (
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
          </div>

          {/* KATEGORIE */}
          <div>
            <label className="block mb-2 font-medium">
              Kategorie
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

          {/* DATEI UPLOAD */}
          <div>
            <label className="block mb-2 font-medium">
              Dateien hochladen
            </label>

            <input
              type="file"
              multiple
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 bg-white"
            />

            <p className="text-sm text-zinc-500 mt-2">
              Bilder, PDFs oder Dokumente
            </p>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleCreate}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Dokument erstellen
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
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
  );
}