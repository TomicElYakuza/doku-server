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

import {
  saveActivity,
} from "../../../../lib/activityStorage";

import {
  getUser,
} from "../../../../lib/userStorage";

import FileUpload from "../../../../components/wiki/FileUpload";

import FileList from "../../../../components/wiki/FileList";

export default function EditWikiPage() {
  const params = useParams();

  const router = useRouter();

  const slug = params.slug as string;

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
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

    setDescription(
      page.description || ""
    );

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

    if (!existingPage) {
      alert("Dokument nicht gefunden.");

      return;
    }

    saveVersion(slug, {
      title: existingPage.title,

      category:
        existingPage.category,

      description:
        existingPage.description,

      tags: existingPage.tags,

      content:
        existingPage.content,

      updatedAt:
        existingPage.updatedAt,

      savedAt:
        new Date().toLocaleString(),
    });

    const updatedPages = pages.map(
      (page: any) => {
        if (page.slug !== slug) {
          return page;
        }

        return {
          ...page,

          title,

          category,

          description,

          tags: tags
            .split(",")
            .map((tag) =>
              tag.trim()
            )
            .filter(Boolean),

          content,

          updatedAt:
            new Date().toLocaleDateString(),
        };
      }
    );

    savePages(updatedPages);

    saveActivity({
      type: "edited",

      title,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

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

          {/* FILE UPLOAD */}
          <FileUpload slug={slug} />

          {/* FILE LIST */}
          <FileList
            slug={slug}
            editable={true}
          />

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
  );
}