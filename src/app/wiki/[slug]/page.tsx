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
  removeFavorite,
  saveFavorites,
} from "../../../lib/favoritesStorage";

import {
  removeRecentPage,
  saveRecentPage,
} from "../../../lib/recentStorage";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  canDelete,
  canEdit,
} from "../../../lib/permissions";

type WikiPage = {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  company?: string;
  category?: string;
  author?: string;
  updatedAt?: string;
  tags?: string[];
};

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

export default function WikiDetailPage() {
  const params =
    useParams();

  const rawSlug =
    params.slug as string;

  const decodedSlug =
    decodeURIComponent(
      rawSlug
    );

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [page, setPage] =
    useState<WikiPage | null>(null);

  const [mounted, setMounted] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  useEffect(() => {
    setMounted(
      true
    );

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
  }, [
    rawSlug,
  ]);

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
          ) === normalizeSlug(
            decodedSlug
          ) ||
          normalizeSlug(
            item.title || ""
          ) === normalizeSlug(
            decodedSlug
          )
      ) || null;

    setPage(
      foundPage
    );

    setPageChecked(
      true
    );

    if (foundPage) {
      saveRecentPage(
        foundPage.slug
      );
    }
  }

  function toggleFavorite() {
    if (!page) {
      return;
    }

    let updated =
      [
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
            favoriteSlug !== page.slug
        );
    } else {
      updated.push(
        page.slug
      );
    }

    setFavorites(
      updated
    );

    saveFavorites(
      updated
    );
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
          item.slug !== pageToDelete.slug
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
      type:
        "deleted",

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

  if (
    !mounted ||
    !pageChecked
  ) {
    return null;
  }

  if (!page) {
    return (
      <div className="w-full max-w-[1800px] space-y-8">
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
            nicht gefunden
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Dokument nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Die Wiki-Seite mit dem Slug{" "}
            <span className="font-semibold text-zinc-900">
              {decodedSlug}
            </span>{" "}
            existiert nicht mehr oder wurde gelöscht.
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

  const company =
    page.company ||
    "Intern";

  const department =
    page.category ||
    "Allgemein";

  const isFavorite =
    favorites.includes(
      page.slug
    );

  return (
    <div className="w-full max-w-[1800px] space-y-6">
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
          href={wikiCompanyHref(
            company
          )}
          className="app-accent-text hover:underline"
        >
          {company}
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <Link
          href={wikiDepartmentHref(
            department
          )}
          className="app-accent-text hover:underline"
        >
          {department}
        </Link>
      </div>

      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={wikiCompanyHref(
                      company
                    )}
                    className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                  >
                    {company}
                  </Link>

                  <Link
                    href={wikiDepartmentHref(
                      department
                    )}
                    className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                  >
                    {department}
                  </Link>
                </div>

                <h1 className="text-5xl font-black tracking-tight mt-5">
                  {page.title}
                </h1>

                {page.description && (
                  <p className="text-xl text-zinc-500 mt-4">
                    {page.description}
                  </p>
                )}

                {page.tags &&
                  page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {page.tags.map(
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
                  )}
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end shrink-0">
                {canEdit() && (
                  <Link
                    href={`/wiki/edit/${encodeURIComponent(
                      page.slug
                    )}`}
                    className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
                  >
                    Bearbeiten
                  </Link>
                )}

                <Link
                  href={`/wiki/history/${encodeURIComponent(
                    page.slug
                  )}`}
                  className="bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-500 transition"
                >
                  Historie
                </Link>

                {canDelete() && (
                  <button
                    type="button"
                    onClick={handleDeleteDocument}
                    className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
                  >
                    Löschen
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`px-5 py-3 rounded-2xl transition ${
                    isFavorite
                      ? "bg-amber-500 text-white hover:bg-amber-400"
                      : "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  {isFavorite
                    ? "Favorisiert"
                    : "Favorit"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-500 mt-8 border-b border-zinc-200 pb-6">
              <p>
                Firma:{" "}
                <Link
                  href={wikiCompanyHref(
                    company
                  )}
                  className="app-accent-text hover:underline"
                >
                  {company}
                </Link>
              </p>

              <p>
                Abteilung:{" "}
                <Link
                  href={wikiDepartmentHref(
                    department
                  )}
                  className="app-accent-text hover:underline"
                >
                  {department}
                </Link>
              </p>

              <p>
                Autor:{" "}
                {page.author ||
                  "Unbekannt"}
              </p>

              <p>
                Zuletzt aktualisiert:{" "}
                {page.updatedAt ||
                  "Unbekannt"}
              </p>

              <p>
                Version: 1.0
              </p>
            </div>

            <div className="mt-8 max-w-none text-zinc-900 leading-relaxed">
              <ReactMarkdown>
                {page.content ||
                  ""}
              </ReactMarkdown>
            </div>

            <div className="mt-10">
              <FileList
                slug={page.slug}
                editable={canEdit()}
              />
            </div>
          </article>

          <Comments
            slug={page.slug}
          />
        </div>

        <aside className="hidden 2xl:block sticky top-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <TableOfContents
              content={page.content || ""}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}