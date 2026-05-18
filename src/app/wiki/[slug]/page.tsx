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

import TableOfContents from "../../../components/wiki/TableOfContents";

import FileList from "../../../components/wiki/FileList";

import Comments from "../../../components/wiki/Comments";

import {
  getStoredPages,
  savePages,
} from "../../../lib/wikiStorage";

import {
  addTrashPage,
} from "../../../lib/trashStorage";

import {
  getFavorites,
  saveFavorites,
  removeFavorite,
} from "../../../lib/favoritesStorage";

import {
  saveRecentPage,
  removeRecentPage,
} from "../../../lib/recentStorage";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  canEdit,
  canDelete,
} from "../../../lib/permissions";

export default function WikiDetailPage() {
  const params =
    useParams();

  const rawSlug =
    params.slug as string;

  const decodedSlug =
    decodeURIComponent(rawSlug);

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [page, setPage] =
    useState<any>(null);

  const [mounted, setMounted] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    loadPage();

    loadFavorites();

    function handleFavoritesUpdated() {
      loadFavorites();
    }

    function handleWikiPagesUpdated() {
      loadPage();
    }

    window.addEventListener(
      "favoritesUpdated",
      handleFavoritesUpdated
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "favoritesUpdated",
        handleFavoritesUpdated
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, [rawSlug]);

  function normalizeSlug(
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

  function loadFavorites() {
    setFavorites(
      getFavorites()
    );
  }

  function loadPage() {
    const allPages =
      getStoredPages();

    const foundPage =
      allPages.find(
        (item: any) =>
          item.slug === rawSlug ||
          item.slug === decodedSlug ||
          encodeURIComponent(
            item.slug
          ) === rawSlug ||
          normalizeSlug(
            item.slug
          ) ===
            normalizeSlug(
              decodedSlug
            ) ||
          normalizeSlug(
            item.title || ""
          ) ===
            normalizeSlug(
              decodedSlug
            )
      );

    setPage(
      foundPage || null
    );

    setPageChecked(true);

    if (foundPage) {
      saveRecentPage(
        foundPage.slug
      );
    }
  }

  function wikiCompanyHref(
    company: string
  ) {
    return `/wiki?company=${encodeURIComponent(
      company
    )}`;
  }

  function wikiDepartmentHref(
    department: string
  ) {
    return `/wiki?department=${encodeURIComponent(
      department
    )}`;
  }

  function wikiTagHref(
    tag: string
  ) {
    return `/wiki?tag=${encodeURIComponent(
      tag
    )}`;
  }

  function toggleFavorite() {
    if (!page) {
      return;
    }

    let updated = [
      ...favorites,
    ];

    if (
      updated.includes(
        page.slug
      )
    ) {
      updated =
        updated.filter(
          (favoriteSlug) =>
            favoriteSlug !==
            page.slug
        );
    } else {
      updated.push(
        page.slug
      );
    }

    setFavorites(updated);

    saveFavorites(updated);
  }

  function handleDeleteDocument() {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, dieses Dokument zu löschen."
      );

      return;
    }

    if (!page) {
      alert(
        "Dokument wurde nicht gefunden."
      );

      return;
    }

    const confirmed =
      confirm(
        "Dokument wirklich in den Papierkorb verschieben?"
      );

    if (!confirmed) {
      return;
    }

    const allPages =
      getStoredPages();

    const pageToDelete =
      allPages.find(
        (item: any) =>
          item.slug === page.slug
      );

    if (!pageToDelete) {
      alert(
        "Dokument wurde nicht gefunden."
      );

      return;
    }

    addTrashPage(
      pageToDelete
    );

    const updatedPages =
      allPages.filter(
        (item: any) =>
          item.slug !==
          pageToDelete.slug
      );

    savePages(
      updatedPages
    );

    removeFavorite(
      pageToDelete.slug
    );

    removeRecentPage(
      pageToDelete.slug
    );

    saveActivity({
      type: "deleted",

      title:
        pageToDelete.title,

      company:
        pageToDelete.company ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    window.location.href =
      "/wiki/trash";
  }

  if (!mounted || !pageChecked) {
    return null;
  }

  if (!page) {
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
            nicht gefunden
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
            Die Wiki-Seite mit dem Slug{" "}
            <span className="font-mono text-zinc-900">
              {decodedSlug}
            </span>{" "}
            existiert nicht mehr oder wurde gelöscht.
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

  const company =
    page.company || "Intern";

  return (
    <div className="flex gap-6">
      <div className="flex-1 max-w-5xl">
        {/* TOP NAV */}
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

          <Link
            href={wikiCompanyHref(
              company
            )}
            className="text-indigo-600 hover:text-indigo-900 transition"
          >
            {company}
          </Link>

          <span className="text-zinc-400">
            /
          </span>

          <Link
            href={wikiDepartmentHref(
              page.category
            )}
            className="text-indigo-600 hover:text-indigo-900 transition"
          >
            {page.category}
          </Link>
        </div>

        {/* BACK BUTTON */}
        <div className="mb-6">
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Link
                  href={wikiCompanyHref(
                    company
                  )}
                  className="inline-block bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                >
                  {company}
                </Link>

                <Link
                  href={wikiDepartmentHref(
                    page.category
                  )}
                  className="inline-block bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                >
                  {page.category}
                </Link>
              </div>

              <h1 className="text-5xl font-bold">
                {page.title}
              </h1>

              <p className="text-zinc-600 mt-4 text-lg">
                {page.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {page.tags?.map(
                  (tag: string) => (
                    <Link
                      key={tag}
                      href={wikiTagHref(
                        tag
                      )}
                      className="bg-zinc-100 text-zinc-700 text-sm px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      #{tag}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              {canEdit() && (
                <Link
                  href={`/wiki/edit/${encodeURIComponent(
                    page.slug
                  )}`}
                  className="bg-zinc-900 text-white px-5 py-3 rounded-xl hover:bg-zinc-700 transition"
                >
                  Bearbeiten
                </Link>
              )}

              <Link
                href={`/wiki/history/${encodeURIComponent(
                  page.slug
                )}`}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
              >
                Historie
              </Link>

              {canDelete() && (
                <button
                  onClick={handleDeleteDocument}
                  className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 transition"
                >
                  Löschen
                </button>
              )}

              <button
                onClick={toggleFavorite}
                className="bg-yellow-500 text-white px-5 py-3 rounded-xl hover:bg-yellow-400 transition"
              >
                {favorites.includes(
                  page.slug
                )
                  ? "Favorisiert"
                  : "Favorit"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500 border-b pb-6 mb-10 flex-wrap">
            <p>
              Firma:{" "}
              <Link
                href={wikiCompanyHref(
                  company
                )}
                className="text-indigo-700 hover:underline"
              >
                {company}
              </Link>
            </p>

            <p>
              Abteilung:{" "}
              <Link
                href={wikiDepartmentHref(
                  page.category
                )}
                className="text-indigo-700 hover:underline"
              >
                {page.category}
              </Link>
            </p>

            <p>
              Autor: {page.author}
            </p>

            <p>
              Zuletzt aktualisiert:{" "}
              {page.updatedAt}
            </p>

            <p>
              Version: 1.0
            </p>
          </div>

          <article className="prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700 prose-li:text-zinc-700">
            <ReactMarkdown>
              {page.content}
            </ReactMarkdown>
          </article>

          <div className="mt-10">
            <FileList
              slug={page.slug}
            />
          </div>
        </div>

        <Comments
          slug={page.slug}
        />
      </div>

      <TableOfContents
        content={page.content}
      />
    </div>
  );
}