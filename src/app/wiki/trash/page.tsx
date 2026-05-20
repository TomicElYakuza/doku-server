"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  wikiRepository,
} from "../../../lib/wikiRepository";

import {
  getTrashPages,
  removeTrashPage,
} from "../../../lib/trashStorage";

import {
  activityRepository,
} from "../../../lib/activityRepository";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  isAdmin,
} from "../../../lib/permissions";

import {
  removeFavorite,
} from "../../../lib/favoritesStorage";

import {
  removeRecentPage,
} from "../../../lib/recentStorage";

import {
  deleteCommentsForPage,
} from "../../../lib/commentStorage";

import {
  deleteFilesForPage,
} from "../../../lib/fileStorage";

import {
  deleteVersionsForPage,
} from "../../../lib/versionStorage";

type TrashPageItem = {
  slug: string;
  title?: string;
  category?: string;
  department?: string;
  company?: string;
  description?: string;
  excerpt?: string;
  author?: string;
  updatedAt?: string;
  deletedAt?: string;
  tags?: string[];
  content?: string;
};

export default function TrashPage() {
  const [mounted, setMounted] =
    useState(false);

  const [trashPages, setTrashPages] =
    useState<TrashPageItem[]>([]);

  useEffect(() => {
    setMounted(
      true
    );

    loadTrash();

    function handleTrashUpdated() {
      loadTrash();
    }

    window.addEventListener(
      "trashUpdated",
      handleTrashUpdated
    );

    return () => {
      window.removeEventListener(
        "trashUpdated",
        handleTrashUpdated
      );
    };
  }, []);

  function loadTrash() {
    setTrashPages(
      getTrashPages() as TrashPageItem[]
    );
  }

  function removeRelatedData(
    slug: string
  ) {
    removeFavorite(
      slug
    );

    removeRecentPage(
      slug
    );

    deleteCommentsForPage(
      slug
    );

    deleteFilesForPage(
      slug
    );

    deleteVersionsForPage(
      slug
    );
  }

  function restorePage(
    page: TrashPageItem
  ) {
    if (!isAdmin()) {
      alert(
        "Nur Admins dürfen Dokumente wiederherstellen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Dokument wirklich wiederherstellen?"
      );

    if (!confirmed) {
      return;
    }

    const pageExists =
      Boolean(
        wikiRepository.findBySlug(
          page.slug
        )
      );

    if (pageExists) {
      alert(
        "Ein Dokument mit diesem Slug existiert bereits."
      );

      return;
    }

    const restoredPage =
      wikiRepository.create({
        slug:
          page.slug,

        title:
          page.title ||
          "Ohne Titel",

        company:
          page.company ||
          "Intern",

        category:
          page.category ||
          page.department ||
          "Allgemein",

        department:
          page.department ||
          page.category ||
          "Allgemein",

        description:
          page.description ||
          page.excerpt ||
          "",

        excerpt:
          page.description ||
          page.excerpt ||
          "",

        author:
          page.author ||
          "Unbekannt",

        updatedAt:
          new Date().toLocaleDateString(),

        createdAt:
          page.updatedAt ||
          new Date().toLocaleDateString(),

        tags:
          Array.isArray(
            page.tags
          )
            ? page.tags
            : [],

        content:
          page.content ||
          "",
      });

    removeTrashPage(
      page.slug
    );

    activityRepository.create({
      type:
        "restored",

      title:
        String(
          restoredPage.title ||
            page.title ||
            page.slug
        ),

      company:
        String(
          restoredPage.company ||
            "Intern"
        ),

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    alert(
      "Dokument wurde wiederhergestellt."
    );

    window.location.href =
      `/wiki/${encodeURIComponent(
        page.slug
      )}`;
  }

  function deleteForever(
    page: TrashPageItem
  ) {
    if (!isAdmin()) {
      alert(
        "Nur Admins dürfen Dokumente endgültig löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Dokument endgültig löschen? Kommentare, Anhänge und Versionen werden ebenfalls entfernt."
      );

    if (!confirmed) {
      return;
    }

    removeTrashPage(
      page.slug
    );

    removeRelatedData(
      page.slug
    );

    activityRepository.create({
      type:
        "deletedForever",

      title:
        page.title ||
        page.slug,

      company:
        page.company ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    alert(
      "Dokument wurde endgültig gelöscht."
    );

    loadTrash();
  }

  if (!mounted) {
    return null;
  }

  if (!isAdmin()) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-3">
            Nur Admins dürfen den Papierkorb öffnen.
          </p>

          <Link
            href="/wiki"
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Wiki
          </Link>
        </div>
      </div>
    );
  }

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
          Papierkorb
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

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Papierkorb
          </h1>

          <p className="text-zinc-500 mt-2">
            Gelöschte Dokumente wiederherstellen oder endgültig entfernen
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-sm text-zinc-500">
            Einträge im Papierkorb
          </p>

          <p className="text-2xl font-bold mt-1">
            {trashPages.length}
          </p>
        </div>
      </div>

      {trashPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Der Papierkorb ist leer.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {trashPages.map(
          (page) => {
            const tags =
              Array.isArray(
                page.tags
              )
                ? page.tags
                : [];

            return (
              <div
                key={page.slug}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {page.category ||
                          page.department ||
                          "Allgemein"}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {page.company ||
                          "Intern"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {page.title ||
                        "Ohne Titel"}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {page.description ||
                        page.excerpt ||
                        "Keine Beschreibung"}
                    </p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {tags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    <p className="text-sm text-zinc-500 mt-5">
                      Gelöscht am:{" "}
                      {page.deletedAt ||
                        "Unbekannt"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        restorePage(
                          page
                        )
                      }
                      className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
                    >
                      Wiederherstellen
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteForever(
                          page
                        )
                      }
                      className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 transition"
                    >
                      Endgültig löschen
                    </button>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}