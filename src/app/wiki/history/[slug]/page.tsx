"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getVersions,
} from "../../../../lib/versionStorage";

import {
  getStoredPages,
  savePages,
} from "../../../../lib/wikiStorage";

import {
  saveActivity,
} from "../../../../lib/activityStorage";

import {
  getUser,
} from "../../../../lib/userStorage";

export default function HistoryPage() {
  const params = useParams();

  const slug = params.slug as string;

  const [mounted, setMounted] =
    useState(false);

  const [pageChecked, setPageChecked] =
    useState(false);

  const [pageFound, setPageFound] =
    useState(false);

  const [pageTitle, setPageTitle] =
    useState("");

  const [pageCategory, setPageCategory] =
    useState("");

  const [versions, setVersions] =
    useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleVersionsUpdated() {
      loadData();
    }

    function handleWikiPagesUpdated() {
      loadData();
    }

    window.addEventListener(
      "versionsUpdated",
      handleVersionsUpdated
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "versionsUpdated",
        handleVersionsUpdated
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, [slug]);

  function loadData() {
    const pages =
      getStoredPages();

    const page =
      pages.find(
        (item: any) =>
          item.slug === slug
      );

    const allVersions =
      getVersions();

    setVersions(
      allVersions[slug] || []
    );

    if (!page) {
      setPageFound(false);

      setPageChecked(true);

      return;
    }

    setPageFound(true);

    setPageTitle(page.title);

    setPageCategory(
      page.category || ""
    );

    setPageChecked(true);
  }

  function restoreVersion(
    version: any
  ) {
    const confirmed = confirm(
      "Version wirklich wiederherstellen?"
    );

    if (!confirmed) {
      return;
    }

    const pages =
      getStoredPages();

    const pageExists =
      pages.some(
        (page: any) =>
          page.slug === slug
      );

    if (!pageExists) {
      alert(
        "Dokument existiert nicht mehr und kann deshalb nicht aus der Historie wiederhergestellt werden."
      );

      return;
    }

    const updatedPages =
      pages.map((page: any) => {
        if (page.slug !== slug) {
          return page;
        }

        return {
          ...page,

          title:
            version.title || page.title,

          category:
            version.category ||
            page.category,

          description:
            version.description || "",

          tags:
            Array.isArray(version.tags)
              ? version.tags
              : [],

          content:
            version.content || "",

          updatedAt:
            new Date().toLocaleDateString(),
        };
      });

    savePages(updatedPages);

    saveActivity({
      type: "restored",

      title:
        version.title || slug,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    alert(
      "Version wurde wiederhergestellt."
    );

    window.location.href =
      `/wiki/${slug}`;
  }

  if (!mounted || !pageChecked) {
    return null;
  }

  if (!pageFound) {
    return (
      <div className="max-w-3xl">
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

          <span className="text-zinc-900">
            historie
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
            Die Historie für{" "}
            <span className="font-mono text-zinc-900">
              {slug}
            </span>{" "}
            kann nicht geöffnet werden, weil das Dokument nicht existiert oder gelöscht wurde.
          </p>

          {versions.length > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <p className="text-yellow-800">
                Für dieses Dokument sind noch{" "}
                {versions.length} alte Versionen gespeichert, aber das aktive Dokument existiert nicht mehr.
              </p>
            </div>
          )}

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

  const reversedVersions = [
    ...versions,
  ].reverse();

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

        {pageCategory ? (
          <>
            <Link
              href={`/wiki/department/${encodeURIComponent(
                pageCategory
              )}`}
              className="text-zinc-500 hover:text-zinc-900 transition"
            >
              {pageCategory}
            </Link>

            <span className="text-zinc-400">
              /
            </span>
          </>
        ) : null}

        <Link
          href={`/wiki/${slug}`}
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          {pageTitle || slug}
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          historie
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

      {/* HEADER */}
      <div>
        <p className="text-zinc-500">
          Versionshistorie
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {pageTitle || slug}
        </h1>

        <p className="text-zinc-500 mt-3">
          {versions.length} Versionen
        </p>
      </div>

      {/* EMPTY */}
      {versions.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-zinc-500">
            Noch keine Versionen vorhanden.
          </p>
        </div>
      )}

      {/* LIST */}
      <div className="grid gap-4">
        {reversedVersions.map(
          (
            version: any,
            index: number
          ) => {
            const versionNumber =
              versions.length - index;

            return (
              <div
                key={`${version.savedAt}-${index}`}
                className="bg-white border border-zinc-200 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Version{" "}
                      {versionNumber}
                    </h2>

                    <p className="text-sm text-zinc-500 mt-1">
                      {version.savedAt ||
                        "Unbekannt"}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      restoreVersion(
                        version
                      )
                    }
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
                  >
                    Wiederherstellen
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Titel
                    </p>

                    <p className="font-medium">
                      {version.title ||
                        "Ohne Titel"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Kategorie
                    </p>

                    <p className="font-medium">
                      {version.category ||
                        "Keine Kategorie"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Beschreibung
                    </p>

                    <p className="font-medium">
                      {version.description ||
                        "Keine Beschreibung"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500 mb-2">
                      Tags
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {version.tags?.length >
                      0 ? (
                        version.tags.map(
                          (
                            tag: string
                          ) => (
                            <Link
                              key={tag}
                              href={`/wiki/tag/${encodeURIComponent(
                                tag
                              )}`}
                              className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full hover:bg-zinc-200 transition"
                            >
                              #{tag}
                            </Link>
                          )
                        )
                      ) : (
                        <p className="text-sm text-zinc-400">
                          Keine Tags
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500 mb-2">
                      Inhalt Vorschau
                    </p>

                    <div className="bg-zinc-50 rounded-2xl p-4 text-sm text-zinc-700 max-h-48 overflow-hidden whitespace-pre-wrap">
                      {version.content ||
                        "Kein Inhalt"}
                    </div>
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