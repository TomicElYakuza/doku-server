"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { wikiPages } from "../../data/wiki";

import {
  getStoredPages,
  savePages,
} from "../../lib/wikiStorage";

import {
  canEdit,
} from "../../lib/permissions";

import {
  getUser,
} from "../../lib/userStorage";

import {
  getVersions,
} from "../../lib/versionStorage";

export default function WikiPage() {
  const [search, setSearch] =
    useState("");

  const [pages, setPages] =
    useState<any[]>([]);

  const [user, setUser] =
    useState<any>(null);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const stored = getStoredPages();

    if (stored.length > 0) {
      setPages(stored);
    } else {
      savePages(wikiPages);

      setPages(wikiPages);
    }

    setUser(getUser());
  }, []);

  if (!mounted) {
    return null;
  }

  const filteredPages = pages.filter(
    (page: any) => {
      const query =
        search.toLowerCase();

      return (
        page.title
          ?.toLowerCase()
          .includes(query) ||

        page.description
          ?.toLowerCase()
          .includes(query) ||

        page.category
          ?.toLowerCase()
          .includes(query) ||

        page.content
          ?.toLowerCase()
          .includes(query) ||

        page.tags?.some((tag: string) =>
          tag
            .toLowerCase()
            .includes(query)
        )
      );
    }
  );

  const departments = [
    ...new Set(
      pages.map(
        (page: any) => page.category
      )
    ),
  ];

  const tags = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

  const versions = getVersions();

  const versionCount = (
    Object.values(
      versions
    ) as any[]
  ).reduce(
    (acc, current) =>
      acc + current.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">
            Wiki
          </h1>

          <p className="text-zinc-500 mt-2">
            Unternehmensdokumentation
          </p>

          {/* USER */}
          {user && (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
                {user.name?.charAt(0)}
              </div>

              <div>
                <p className="font-medium">
                  {user.name}
                </p>

                <p className="text-sm text-zinc-500 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CREATE */}
        {canEdit() && (
          <div>
            <Link
              href="/wiki/create"
              className="inline-flex bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Neue Seite
            </Link>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {pages.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {departments.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {tags.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Versionen
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {versionCount}
          </h2>
        </div>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Dokumente, Tags oder Inhalte suchen..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
      />

      {/* RESULTS */}
      <div className="grid gap-4">
        {filteredPages.map(
          (page: any) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  {page.category}
                </p>

                <span className="text-xs bg-zinc-100 px-3 py-1 rounded-full">
                  Dokument
                </span>
              </div>

              <h2 className="text-xl font-semibold mt-3">
                {page.title}
              </h2>

              <p className="text-zinc-600 mt-2">
                {page.description}
              </p>

              {/* TAGS */}
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

              {/* META */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
                <p className="text-sm text-zinc-500">
                  {page.author}
                </p>

                <p className="text-sm text-zinc-500">
                  {page.updatedAt}
                </p>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}