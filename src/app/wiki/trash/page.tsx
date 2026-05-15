"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

import {
  isAdmin,
} from "../../../lib/permissions";

export default function TrashPage() {
  const [mounted, setMounted] =
    useState(false);

  const [trashPages, setTrashPages] =
    useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    loadTrash();
  }, []);

  function loadTrash() {
    const data =
      localStorage.getItem(
        "wiki-trash"
      );

    const pages = data
      ? JSON.parse(data)
      : [];

    setTrashPages(pages);
  }

  function getCurrentWikiPages() {
    const data =
      localStorage.getItem(
        "wiki-pages"
      );

    return data
      ? JSON.parse(data)
      : [];
  }

  function saveWikiPages(
    pages: any[]
  ) {
    localStorage.setItem(
      "wiki-pages",
      JSON.stringify(pages)
    );

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );
  }

  function saveTrash(
    pages: any[]
  ) {
    localStorage.setItem(
      "wiki-trash",
      JSON.stringify(pages)
    );

    setTrashPages(pages);

    window.dispatchEvent(
      new Event("trashUpdated")
    );
  }

  function restorePage(
    page: any
  ) {
    if (!isAdmin()) {
      alert(
        "Nur Admins dürfen Dokumente wiederherstellen."
      );

      return;
    }

    const confirmed = confirm(
      "Dokument wirklich wiederherstellen?"
    );

    if (!confirmed) {
      return;
    }

    const currentPages =
      getCurrentWikiPages();

    const pageExists =
      currentPages.some(
        (item: any) =>
          item.slug === page.slug
      );

    if (pageExists) {
      alert(
        "Ein Dokument mit diesem Slug existiert bereits."
      );

      return;
    }

    const restoredPage = {
      slug: page.slug,

      title: page.title,

      category: page.category,

      description:
        page.description || "",

      author:
        page.author || "Unbekannt",

      updatedAt:
        new Date().toLocaleDateString(),

      tags: page.tags || [],

      content:
        page.content || "",
    };

    const updatedWikiPages = [
      ...currentPages,
      restoredPage,
    ];

    saveWikiPages(updatedWikiPages);

    const updatedTrash =
      trashPages.filter(
        (item: any) =>
          item.slug !== page.slug
      );

    saveTrash(updatedTrash);

    saveActivity({
      type: "restored",

      title: page.title,

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
      `/wiki/${page.slug}`;
  }

  function deleteForever(
    page: any
  ) {
    if (!isAdmin()) {
      alert(
        "Nur Admins dürfen Dokumente endgültig löschen."
      );

      return;
    }

    const confirmed = confirm(
      "Dokument endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
    );

    if (!confirmed) {
      return;
    }

    const updatedTrash =
      trashPages.filter(
        (item: any) =>
          item.slug !== page.slug
      );

    saveTrash(updatedTrash);

    saveActivity({
      type: "deletedForever",

      title: page.title,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    alert(
      "Dokument wurde endgültig gelöscht."
    );
  }

  if (!mounted) {
    return null;
  }

  if (!isAdmin()) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <h1 className="text-3xl font-bold">
            Keine Berechtigung
          </h1>

          <p className="text-zinc-500 mt-3">
            Nur Admins dürfen den Papierkorb öffnen.
          </p>

          <Link
            href="/wiki"
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            ← Zurück zum Wiki
          </Link>
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

        <span className="text-zinc-900">
          papierkorb
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Papierkorb
        </h1>

        <p className="text-zinc-500 mt-2">
          Gelöschte Dokumente wiederherstellen oder endgültig entfernen
        </p>

        <p className="text-sm text-zinc-400 mt-2">
          Einträge im Papierkorb:{" "}
          {trashPages.length}
        </p>
      </div>

      {trashPages.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8">
          <p className="text-zinc-500">
            Der Papierkorb ist leer.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {trashPages.map(
          (page: any) => (
            <div
              key={page.slug}
              className="bg-white border border-zinc-200 rounded-3xl p-6"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm text-zinc-500">
                    {page.category}
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    {page.title}
                  </h2>

                  <p className="text-zinc-600 mt-2">
                    {page.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {page.tags?.map(
                      (tag: string) => (
                        <span
                          key={tag}
                          className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      )
                    )}
                  </div>

                  <p className="text-sm text-zinc-500 mt-4">
                    Gelöscht am:{" "}
                    {page.deletedAt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() =>
                      restorePage(page)
                    }
                    className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
                  >
                    Wiederherstellen
                  </button>

                  <button
                    onClick={() =>
                      deleteForever(page)
                    }
                    className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 transition"
                  >
                    Endgültig löschen
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}