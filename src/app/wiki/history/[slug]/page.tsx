"use client";

import Link from "next/link";

import { useParams } from "next/navigation";

import {
  getVersions,
} from "../../../../lib/versionStorage";

import {
  getStoredPages,
  savePages,
} from "../../../../lib/wikiStorage";

export default function HistoryPage() {
  const params = useParams();

  const slug = params.slug as string;

  const versions =
    getVersions()[slug] || [];

  function restoreVersion(
    version: any
  ) {
    const confirmed = confirm(
      "Version wirklich wiederherstellen?"
    );

    if (!confirmed) {
      return;
    }

    const pages = getStoredPages();

    const updatedPages = pages.map(
      (page: any) => {
        if (page.slug !== slug) {
          return page;
        }

        return {
          ...page,

          title: version.title,

          category:
            version.category,

          tags: version.tags,

          content:
            version.content,

          updatedAt:
            new Date().toLocaleDateString(),
        };
      }
    );

    savePages(updatedPages);

    alert(
      "Version wiederhergestellt"
    );

    window.location.href = `/wiki/${slug}`;
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

        <Link
          href={`/wiki/${slug}`}
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          {slug}
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

      <div>
        <p className="text-zinc-500">
          Versionshistorie
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {slug}
        </h1>

        <p className="text-zinc-500 mt-3">
          {versions.length} Versionen
        </p>
      </div>

      {versions.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          Noch keine Versionen vorhanden.
        </div>
      )}

      <div className="grid gap-4">
        {[...versions]
          .reverse()
          .map(
            (
              version: any,
              index: number
            ) => (
              <div
                key={index}
                className="bg-white border border-zinc-200 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Version{" "}
                      {versions.length -
                        index}
                    </h2>

                    <p className="text-sm text-zinc-500 mt-1">
                      {version.savedAt}
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
                      {version.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Kategorie
                    </p>

                    <p className="font-medium">
                      {version.category}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500 mb-2">
                      Tags
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {version.tags?.map(
                        (
                          tag: string
                        ) => (
                          <span
                            key={tag}
                            className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500 mb-2">
                      Inhalt Vorschau
                    </p>

                    <div className="bg-zinc-50 rounded-2xl p-4 text-sm text-zinc-700 max-h-48 overflow-hidden whitespace-pre-wrap">
                      {version.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
      </div>
    </div>
  );
}