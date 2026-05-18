"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

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

import {
  canEdit,
} from "../../../../lib/permissions";

import FileUpload from "../../../../components/wiki/FileUpload";

import FileList from "../../../../components/wiki/FileList";

export default function EditWikiPage() {
  const params = useParams();

  const router = useRouter();

  const slug = params.slug as string;

  const [mounted, setMounted] =
    useState(false);

  const [allowed, setAllowed] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  const [pageFound, setPageFound] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [content, setContent] =
    useState("");

  useEffect(() => {
    setMounted(true);

    const editAllowed =
      canEdit();

    setAllowed(editAllowed);

    const pages =
      getStoredPages();

    const page =
      pages.find(
        (page: any) =>
          page.slug === slug
      );

    if (!page) {
      setPageFound(false);

      setPageChecked(true);

      return;
    }

    setPageFound(true);

    setTitle(page.title || "");

    setCompany(
      page.company || "Intern"
    );

    setCategory(page.category || "");

    setDescription(
      page.description || ""
    );

    setContent(page.content || "");

    setTags(
      page.tags?.join(", ") || ""
    );

    setPageChecked(true);
  }, [slug]);

  function handleSave() {
    if (!allowed) {
      alert(
        "Du hast keine Berechtigung, dieses Dokument zu bearbeiten."
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

    const existingPage =
      pages.find(
        (page: any) =>
          page.slug === slug
      );

    if (!existingPage) {
      alert(
        "Dokument nicht gefunden."
      );

      return;
    }

    saveVersion(slug, {
      title:
        existingPage.title,

      company:
        existingPage.company || "Intern",

      category:
        existingPage.category,

      description:
        existingPage.description,

      tags:
        existingPage.tags || [],

      content:
        existingPage.content || "",

      updatedAt:
        existingPage.updatedAt,

      savedAt:
        new Date().toLocaleString(),
    });

    const updatedPages =
      pages.map((page: any) => {
        if (page.slug !== slug) {
          return page;
        }

        return {
          ...page,

          title:
            title.trim(),

          company:
            company.trim() ||
            "Intern",

          category:
            category.trim(),

          description:
            description.trim(),

          tags: tags
            .split(",")
            .map((tag) =>
              tag.trim()
            )
            .filter(Boolean),

          content:
            content.trim(),

          updatedAt:
            new Date().toLocaleDateString(),
        };
      });

    savePages(updatedPages);

    saveActivity({
      type: "edited",

      title:
        title.trim(),

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    router.push(
      `/wiki/${slug}`
    );
  }

  if (!mounted || !pageChecked) {
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
            Du darfst dieses Dokument nicht bearbeiten.
          </p>

          <Link
            href={`/wiki/${slug}`}
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Dokument
          </Link>
        </div>
      </div>
    );
  }

  if (!pageFound) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6 text-sm">
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
            bearbeiten
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mb-6">
            🔎
          </div>

          <h1 className="text-4xl font-bold">
            Dokument nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Die Seite mit dem Slug{" "}
            <span className="font-mono text-zinc-900">
              {slug}
            </span>{" "}
            kann nicht bearbeitet werden, weil sie nicht existiert oder gelöscht wurde.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/wiki"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Zurück zur Wiki-Übersicht
            </Link>

            <Link
              href="/wiki/trash"
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Papierkorb öffnen
            </Link>
          </div>
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

        <Link
          href={`/wiki/${slug}`}
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          {slug}
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          bearbeiten
        </span>
      </div>

      {/* BACK BUTTON */}
      <div>
        <Link
          href={`/wiki/${slug}`}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dokument
        </Link>
      </div>

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
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            {/* FIRMA */}
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

            {/* KATEGORIE */}
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
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Kurze Zusammenfassung des Dokuments"
              />
            </div>

            {/* INHALT */}
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

            {/* FILES */}
            <FileUpload slug={slug} />

            <FileList
              slug={slug}
              editable={true}
            />

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                Änderungen speichern
              </button>

              <Link
                href={`/wiki/${slug}`}
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