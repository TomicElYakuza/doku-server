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
  wikiRepository,
} from "../../../lib/wikiRepository";

import type {
  WikiPage,
} from "../../../lib/wikiRepository";

import {
  activityRepository,
} from "../../../lib/activityRepository";

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
  getUser,
} from "../../../lib/userStorage";

import {
  canDelete,
  canEdit,
} from "../../../lib/permissions";

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

function getPageTitle(
  page: WikiPage
) {
  return String(
    page.title ||
      "Unbenanntes Dokument"
  );
}

function getPageSlug(
  page: WikiPage
) {
  return String(
    page.slug ||
      normalizeSlug(
        getPageTitle(
          page
        )
      )
  );
}

function getPageDescription(
  page: WikiPage
) {
  return String(
    page.description ||
      page.excerpt ||
      ""
  );
}

function getPageContent(
  page: WikiPage
) {
  return String(
    page.content ||
      ""
  );
}

function getPageCompany(
  page: WikiPage
) {
  return String(
    page.company ||
      "Intern"
  );
}

function getPageDepartment(
  page: WikiPage
) {
  return String(
    page.department ||
      page.category ||
      "Allgemein"
  );
}

function getPageAuthor(
  page: WikiPage
) {
  return String(
    page.author ||
      "Unbekannt"
  );
}

function getPageUpdatedAt(
  page: WikiPage
) {
  return String(
    page.updatedAt ||
      "Unbekannt"
  );
}

function getPageTags(
  page: WikiPage
) {
  if (
    Array.isArray(
      page.tags
    )
  ) {
    return page.tags.map(
      (tag) =>
        String(
          tag
        )
    );
  }

  return [];
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
      wikiRepository.list();

    const foundPage =
      allPages.find(
        (item) => {
          const itemSlug =
            getPageSlug(
              item
            );

          const itemTitle =
            getPageTitle(
              item
            );

          return (
            itemSlug === rawSlug ||
            itemSlug === decodedSlug ||
            encodeURIComponent(
              itemSlug
            ) === rawSlug ||
            normalizeSlug(
              itemSlug
            ) ===
              normalizeSlug(
                decodedSlug
              ) ||
            normalizeSlug(
              itemTitle
            ) ===
              normalizeSlug(
                decodedSlug
              )
          );
        }
      ) || null;

    setPage(
      foundPage
    );

    setPageChecked(
      true
    );

    if (foundPage) {
      saveRecentPage(
        getPageSlug(
          foundPage
        )
      );
    }
  }

  function toggleFavorite() {
    if (!page) {
      return;
    }

    const slug =
      getPageSlug(
        page
      );

    let updatedFavorites =
      [
        ...favorites,
      ];

    if (
      updatedFavorites.includes(
        slug
      )
    ) {
      updatedFavorites =
        updatedFavorites.filter(
          (favoriteSlug) =>
            favoriteSlug !== slug
        );
    } else {
      updatedFavorites.push(
        slug
      );
    }

    setFavorites(
      updatedFavorites
    );

    saveFavorites(
      updatedFavorites
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

    const slug =
      getPageSlug(
        page
      );

    const pageToDelete =
      wikiRepository.findBySlug(
        slug
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

    wikiRepository.delete(
      slug
    );

    removeFavorite(
      slug
    );

    removeRecentPage(
      slug
    );

    activityRepository.create({
      type:
        "deleted",

      title:
        getPageTitle(
          pageToDelete
        ),

      company:
        getPageCompany(
          pageToDelete
        ),

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
            Nicht gefunden
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Dokument nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Die Wiki-Seite mit dem Slug{" "}
            <span className="font-mono text-zinc-700">
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

  const slug =
    getPageSlug(
      page
    );

  const title =
    getPageTitle(
      page
    );

  const description =
    getPageDescription(
      page
    );

  const content =
    getPageContent(
      page
    );

  const company =
    getPageCompany(
      page
    );

  const department =
    getPageDepartment(
      page
    );

  const author =
    getPageAuthor(
      page
    );

  const updatedAt =
    getPageUpdatedAt(
      page
    );

  const tags =
    getPageTags(
      page
    );

  const isFavorite =
    favorites.includes(
      slug
    );

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
          href={wikiCompanyHref(
            company
          )}
          className="hover:text-zinc-900 transition"
        >
          {company}
        </Link>

        <span>/</span>

        <Link
          href={wikiDepartmentHref(
            department
          )}
          className="hover:text-zinc-900 transition"
        >
          {department}
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>

        <div className="flex flex-wrap gap-3">
          {canEdit() && (
            <Link
              href={`/wiki/${encodeURIComponent(
                slug
              )}/edit`}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Bearbeiten
            </Link>
          )}

          <Link
            href={`/wiki/${encodeURIComponent(
              slug
            )}/history`}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Historie
          </Link>

          <button
            type="button"
            onClick={toggleFavorite}
            className={`px-5 py-3 rounded-2xl transition ${
              isFavorite
                ? "bg-yellow-500 text-white hover:bg-yellow-400"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
            }`}
          >
            {isFavorite
              ? "Favorisiert"
              : "Favorit"}
          </button>

          {canDelete() && (
            <button
              type="button"
              onClick={handleDeleteDocument}
              className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
            >
              Löschen
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-6">
        <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm min-w-0">
          <div className="flex flex-wrap gap-2">
            <Link
              href={wikiCompanyHref(
                company
              )}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
            >
              {company}
            </Link>

            <Link
              href={wikiDepartmentHref(
                department
              )}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
            >
              {department}
            </Link>

            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Dokument
            </span>

            {isFavorite && (
              <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                Favorit
              </span>
            )}
          </div>

          <h1 className="text-5xl font-black tracking-tight mt-6">
            {title}
          </h1>

          {description && (
            <p className="text-xl text-zinc-500 mt-4 leading-relaxed">
              {description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {tags.map(
                (tag) => (
                  <Link
                    key={tag}
                    href={wikiTagHref(
                      tag
                    )}
                    className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                  >
                    #{tag}
                  </Link>
                )
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-200">
            <div>
              <p className="text-sm text-zinc-500">
                Firma
              </p>

              <p className="font-semibold mt-1">
                {company}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Abteilung
              </p>

              <p className="font-semibold mt-1">
                {department}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Autor
              </p>

              <p className="font-semibold mt-1">
                {author}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Aktualisiert
              </p>

              <p className="font-semibold mt-1">
                {updatedAt}
              </p>
            </div>
          </div>

          <div className="wiki-content prose prose-zinc max-w-none mt-10">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Inhaltsverzeichnis
            </h2>

            <div className="mt-4">
              <TableOfContents
                content={content}
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Dokumentinfo
            </h2>

            <div className="space-y-4 mt-4 text-sm">
              <div>
                <p className="text-zinc-500">
                  Slug
                </p>

                <p className="font-mono text-zinc-700 break-all mt-1">
                  {slug}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Version
                </p>

                <p className="font-semibold mt-1">
                  1.0
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <FileList
          slug={slug}
          editable={canEdit()}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <Comments
          slug={slug}
        />
      </div>
    </div>
  );
}