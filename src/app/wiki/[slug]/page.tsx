"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import ReactMarkdown from "react-markdown";

import TableOfContents from "../../../components/wiki/TableOfContents";

import { wikiPages } from "../../../data/wiki";

import {
  getFavorites,
  saveFavorites,
} from "../../../lib/favoritesStorage";

import {
  saveRecentPage,
} from "../../../lib/recentStorage";

export default function WikiDetailPage() {
  const params = useParams();

  const slug = params.slug as string;

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [page, setPage] =
    useState<any>(null);

  useEffect(() => {
    setFavorites(getFavorites());

    const storedPages = JSON.parse(
      localStorage.getItem("wiki-pages") ||
        "[]"
    );

    const allPages =
      storedPages.length > 0
        ? storedPages
        : wikiPages;

    const foundPage = allPages.find(
      (page: any) =>
        page.slug === slug
    );

    setPage(foundPage);

    saveRecentPage(slug);

    window.dispatchEvent(
      new Event("recentUpdated")
    );
  }, [slug]);

  function toggleFavorite() {
    let updated = [...favorites];

    if (updated.includes(slug)) {
      updated = updated.filter(
        (fav) => fav !== slug
      );
    } else {
      updated.push(slug);
    }

    setFavorites(updated);

    saveFavorites(updated);

    window.dispatchEvent(
      new Event("favoritesUpdated")
    );
  }

  if (!page) {
    return null;
  }

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
            href={`/wiki/department/${page.category}`}
            className="text-zinc-500 hover:text-zinc-900 transition"
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

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <span className="inline-block bg-zinc-100 text-zinc-700 text-sm px-3 py-1 rounded-full mb-4">
                {page.category}
              </span>

              <h1 className="text-5xl font-bold">
                {page.title}
              </h1>

              <p className="text-zinc-600 mt-4 text-lg">
                {page.description}
              </p>

              {/* TAGS */}
              <div className="flex flex-wrap gap-2 mt-4">
                {page.tags?.map(
                  (tag: string) => (
                    <a
                      key={tag}
                      href={`/wiki/tag/${tag}`}
                      className="bg-zinc-100 text-zinc-700 text-sm px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                    >
                      #{tag}
                    </a>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {/* EDIT */}
              <a
                href={`/wiki/edit/${page.slug}`}
                className="bg-zinc-900 text-white px-5 py-3 rounded-xl hover:bg-zinc-700 transition"
              >
                Bearbeiten
              </a>

              {/* HISTORY */}
              <a
                href={`/wiki/history/${page.slug}`}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-500 transition"
              >
                Historie
              </a>

              {/* DELETE */}
              <button
                onClick={() => {
                  const confirmed = confirm(
                    "Dokument wirklich löschen?"
                  );

                  if (!confirmed) {
                    return;
                  }

                  const data =
                    localStorage.getItem(
                      "wiki-pages"
                    );

                  if (!data) {
                    return;
                  }

                  const pages =
                    JSON.parse(data);

                  const updatedPages =
                    pages.filter(
                      (p: any) =>
                        p.slug !== page.slug
                    );

                  localStorage.setItem(
                    "wiki-pages",
                    JSON.stringify(
                      updatedPages
                    )
                  );

                  window.location.href =
                    "/wiki";
                }}
                className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 transition"
              >
                Löschen
              </button>

              {/* FAVORITE */}
              <button
                onClick={toggleFavorite}
                className="bg-yellow-500 text-white px-5 py-3 rounded-xl hover:bg-yellow-400 transition"
              >
                {favorites.includes(slug)
                  ? "Favorisiert"
                  : "Favorit"}
              </button>
            </div>
          </div>

          {/* META */}
          <div className="flex items-center gap-6 text-sm text-zinc-500 border-b pb-6 mb-10">
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

          {/* CONTENT */}
          <article className="prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700 prose-li:text-zinc-700">
            <ReactMarkdown>
              {page.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* TOC */}
      <TableOfContents
        content={page.content}
      />
    </div>
  );
}