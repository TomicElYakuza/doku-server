"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { wikiPages as defaultPages } from "../../data/wiki";

import {
  getStoredPages,
  savePages,
} from "../../lib/wikiStorage";

export default function WikiPage() {
  const [search, setSearch] = useState("");

  const [pages, setPages] = useState(
    defaultPages
  );

  useEffect(() => {
    const stored = getStoredPages();

    if (stored.length > 0) {
      setPages(stored);
    } else {
      savePages(defaultPages);
    }
  }, []);

  const filteredPages = pages.filter((page) =>
    page.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Wiki
        </h1>

        <p className="text-zinc-500 mt-2">
          Unternehmensdokumentation
        </p>

        <div className="mt-6">
          <Link
            href="/wiki/create"
            className="inline-flex bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Neue Seite
          </Link>
        </div>
      </div>

      <input
        type="text"
        placeholder="Dokument suchen..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
      />

      <div className="grid gap-4">
        {filteredPages.map((page) => (
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
          </Link>
        ))}
      </div>
    </div>
  );
}