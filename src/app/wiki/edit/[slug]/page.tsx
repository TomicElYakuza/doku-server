"use client";

import { useEffect, useState } from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  getStoredPages,
  savePages,
} from "../../../../lib/wikiStorage";

import {
  saveVersion,
} from "../../../../lib/versionStorage";

export default function EditWikiPage() {
  const params = useParams();

  const router = useRouter();

  const slug = params.slug as string;

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [content, setContent] =
    useState("");

  useEffect(() => {
    const pages = getStoredPages();

    const page = pages.find(
      (page: any) =>
        page.slug === slug
    );

    if (!page) {
      return;
    }

    setTitle(page.title);

    setCategory(page.category);

    setContent(page.content);

    setTags(
      page.tags?.join(", ") || ""
    );
  }, [slug]);

  function handleSave() {
    const pages = getStoredPages();

    const existingPage = pages.find(
      (page: any) =>
        page.slug === slug
    );

    /* VERSION SPEICHERN */
    saveVersion(slug, {
      title: existingPage.title,

      category:
        existingPage.category,

      tags: existingPage.tags,

      content:
        existingPage.content,

      updatedAt:
        existingPage.updatedAt,

      savedAt:
        new Date().toLocaleString(),
    });

    /* PAGE UPDATEN */
    const updatedPages = pages.map(
      (page: any) => {
        if (page.slug !== slug) {
          return page;
        }

        return {
          ...page,

          title,

          category,

          tags: tags
            .split(",")
            .map((tag) =>
              tag.trim()
            ),

          content,

          updatedAt:
            new Date().toLocaleDateString(),
        };
      }
    );

    savePages(updatedPages);

    router.push(`/wiki/${slug}`);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* EDITOR */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Wiki Seite bearbeiten
          </h1>

          <p className="text-zinc-500 mt-2">
            Dokument aktualisieren
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
            />

            <p className="text-sm text-zinc-500 mt-2">
              Mit Komma trennen
            </p>
          </div>

          {/* CONTENT */}
          <div>
            <label className="block mb-2 font-medium">
              Inhalt
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

          {/* SAVE */}
          <button
            onClick={handleSave}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Änderungen speichern
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Live Vorschau
          </h2>
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