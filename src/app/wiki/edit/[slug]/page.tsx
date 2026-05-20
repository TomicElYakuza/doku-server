"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  wikiRepository,
} from "../../../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../../../lib/wikiRepository";

import {
  saveVersion,
} from "../../../../lib/versionStorage";

import {
  activityRepository,
} from "../../../../lib/activityRepository";

import {
  getUser,
} from "../../../../lib/userStorage";

import {
  canEdit,
} from "../../../../lib/permissions";

import FileUpload from "../../../../components/wiki/FileUpload";

import FileList from "../../../../components/wiki/FileList";

export default function EditWikiPage() {
  const params =
    useParams();

  const slug =
    params.slug as string;

  const [mounted, setMounted] =
    useState(false);

  const [allowed, setAllowed] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  const [pageFound, setPageFound] =
    useState(false);

  const [documentSlug, setDocumentSlug] =
    useState("");

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
    setMounted(
      true
    );

    const editAllowed =
      canEdit();

    setAllowed(
      editAllowed
    );

    loadPage();
  }, [
    slug,
  ]);

  function loadPage() {
    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const page =
      (
        wikiRepository.findBySlug(
          decodedSlug
        ) ||
        wikiRepository.findBySlug(
          slug
        )
      ) as WikiPage | null;

    if (!page) {
      setPageFound(
        false
      );

      setPageChecked(
        true
      );

      return;
    }

    setPageFound(
      true
    );

    setDocumentSlug(
      String(
        page.slug ||
          decodedSlug
      )
    );

    setTitle(
      String(
        page.title ||
          ""
      )
    );

    setCompany(
      String(
        page.company ||
          "Intern"
      )
    );

    setCategory(
      String(
        page.category ||
          page.department ||
          ""
      )
    );

    setDescription(
      String(
        page.description ||
          page.excerpt ||
          ""
      )
    );

    setContent(
      String(
        page.content ||
          ""
      )
    );

    setTags(
      Array.isArray(
        page.tags
      )
        ? page.tags.join(
            ", "
          )
        : ""
    );

    setPageChecked(
      true
    );
  }

  function getDocumentHref() {
    if (!documentSlug) {
      return "/wiki";
    }

    return `/wiki/${encodeURIComponent(
      documentSlug
    )}`;
  }

  function goToDocument() {
    window.location.href =
      getDocumentHref();
  }

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

    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const existingPage =
      (
        wikiRepository.findBySlug(
          documentSlug
        ) ||
        wikiRepository.findBySlug(
          decodedSlug
        ) ||
        wikiRepository.findBySlug(
          slug
        )
      ) as WikiPage | null;

    if (!existingPage) {
      alert(
        "Dokument nicht gefunden."
      );

      return;
    }

    const existingSlug =
      String(
        existingPage.slug ||
          documentSlug ||
          decodedSlug
      );

    saveVersion(
      existingSlug,
      {
        title:
          existingPage.title,

        company:
          existingPage.company ||
          "Intern",

        category:
          existingPage.category,

        description:
          existingPage.description ||
          existingPage.excerpt ||
          "",

        tags:
          existingPage.tags ||
          [],

        content:
          existingPage.content ||
          "",

        updatedAt:
          existingPage.updatedAt,

        savedAt:
          new Date().toLocaleString(),
      }
    );

    const updatedPage =
      wikiRepository.update(
        existingSlug,
        {
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

          updatedAt:
            new Date().toLocaleDateString(),
        }
      );

    activityRepository.create({
      type:
        "edited",

      title:
        title.trim(),

      company:
        company.trim() ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    window.location.href =
      `/wiki/${encodeURIComponent(
        String(
          updatedPage?.slug ||
            existingSlug
        )
      )}`;
  }

  if (
    !mounted ||
    !pageChecked
  ) {
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
            Du darfst dieses Dokument nicht bearbeiten.
          </p>

          <Link
            href={getDocumentHref()}
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Dokument
          </Link>
        </div>
      </div>
    );
  }

  if (!pageFound) {
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
            Bearbeiten
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Dokument nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Die Seite mit dem Slug{" "}
            <span className="font-mono text-zinc-700">
              {slug}
            </span>{" "}
            kann nicht bearbeitet werden.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
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

        <Link
          href={getDocumentHref()}
          className="hover:text-zinc-900 transition"
        >
          {documentSlug || slug}
        </Link>

        <span>/</span>

        <span>
          Bearbeiten
        </span>
      </div>

      <div>
        <button
          type="button"
          onClick={goToDocument}
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dokument
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Wiki Seite bearbeiten
          </h1>

          <p className="text-zinc-500 mt-2">
            Dokument aktualisieren.
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
              />
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

            <div className="md:col-span-2 space-y-4">
              <FileUpload
                slug={documentSlug || slug}
              />

              <FileList
                slug={documentSlug || slug}
                editable={true}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSave}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              Änderungen speichern
            </button>

            <button
              type="button"
              onClick={goToDocument}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
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