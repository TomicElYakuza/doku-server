"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  fileRepository,
} from "../../lib/fileRepository";

import type {
  StoredFile,
} from "../../lib/fileRepository";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

type FileSearchResult = {
  key: string;
  index: number;
  file: StoredFile;
};

function formatFileSize(
  size: number
) {
  if (!size) {
    return "0 KB";
  }

  if (size < 1024 * 1024) {
    return `${Math.round(
      size / 1024
    )} KB`;
  }

  return `${(
    size /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function getFileIcon(
  type: string
) {
  if (type?.startsWith("image/")) {
    return "🖼️";
  }

  if (type?.includes("pdf")) {
    return "📕";
  }

  if (
    type?.includes("word") ||
    type?.includes("document")
  ) {
    return "📄";
  }

  if (
    type?.includes("excel") ||
    type?.includes("spreadsheet")
  ) {
    return "📊";
  }

  if (
    type?.includes("zip") ||
    type?.includes("compressed")
  ) {
    return "🗜️";
  }

  return "📎";
}

function getAreaLabel(
  key: string
) {
  if (key.startsWith("ticket-")) {
    return "Ticket";
  }

  if (key.startsWith("wiki-")) {
    return "Wiki";
  }

  if (key.startsWith("news-")) {
    return "News";
  }

  return "Wiki";
}

function getAreaHref(
  key: string
) {
  if (key.startsWith("ticket-")) {
    return `/tickets/${key.replace(
      "ticket-",
      ""
    )}`;
  }

  if (key.startsWith("news-")) {
    return `/news/${key.replace(
      "news-",
      ""
    )}`;
  }

  if (key.startsWith("wiki-")) {
    return `/wiki/${encodeURIComponent(
      key.replace(
        "wiki-",
        ""
      )
    )}`;
  }

  return `/wiki/${encodeURIComponent(
    key
  )}`;
}

function getPageTitle(
  key: string
) {
  const normalizedKey =
    key.startsWith("wiki-")
      ? key.replace(
          "wiki-",
          ""
        )
      : key;

  const page =
    wikiRepository.findBySlug(
      normalizedKey
    );

  return String(
    page?.title ||
      normalizedKey
  );
}

export default function FilesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [results, setResults] =
    useState<FileSearchResult[]>([]);

  const [search, setSearch] =
    useState("");

  const [areaFilter, setAreaFilter] =
    useState("");

  useEffect(() => {
    setMounted(true);

    loadFiles();

    function handleFilesUpdated() {
      loadFiles();
    }

    window.addEventListener(
      "filesUpdated",
      handleFilesUpdated
    );

    return () => {
      window.removeEventListener(
        "filesUpdated",
        handleFilesUpdated
      );
    };
  }, []);

  function loadFiles() {
    setResults(
      fileRepository.search("")
    );
  }

  function resetFilters() {
    setSearch("");
    setAreaFilter("");
  }

  if (!mounted) {
    return null;
  }

  const filteredResults =
    results.filter(
      (result) => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const pageTitle =
          getPageTitle(
            result.key
          );

        const matchesSearch =
          !normalizedSearch ||
          result.key
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          result.file.name
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          result.file.type
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          result.file.uploadedBy
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          pageTitle
            .toLowerCase()
            .includes(
              normalizedSearch
            );

        const matchesArea =
          !areaFilter ||
          (
            areaFilter === "ticket" &&
            result.key.startsWith(
              "ticket-"
            )
          ) ||
          (
            areaFilter === "wiki" &&
            (
              result.key.startsWith(
                "wiki-"
              ) ||
              !result.key.startsWith(
                "ticket-"
              ) &&
              !result.key.startsWith(
                "news-"
              )
            )
          ) ||
          (
            areaFilter === "news" &&
            result.key.startsWith(
              "news-"
            )
          );

        return (
          matchesSearch &&
          matchesArea
        );
      }
    );

  const totalSize =
    results.reduce(
      (sum, result) =>
        sum +
        result.file.size,
      0
    );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-4xl font-bold">
          Dateien
        </h1>

        <p className="text-zinc-500 mt-2">
          Übersicht über gespeicherte Anhänge und Uploads
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() =>
            setAreaFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Dateien gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {results.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            {formatFileSize(
              totalSize
            )}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setAreaFilter(
              "wiki"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Wiki
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              results.filter(
                (result) =>
                  result.key.startsWith(
                    "wiki-"
                  ) ||
                  !result.key.startsWith(
                    "ticket-"
                  ) &&
                  !result.key.startsWith(
                    "news-"
                  )
              ).length
            }
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setAreaFilter(
              "ticket"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              results.filter(
                (result) =>
                  result.key.startsWith(
                    "ticket-"
                  )
              ).length
            }
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setAreaFilter(
              "news"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-amber-50 transition"
        >
          <p className="text-sm text-zinc-500">
            News
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              results.filter(
                (result) =>
                  result.key.startsWith(
                    "news-"
                  )
              ).length
            }
          </h2>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Dateien suchen
            </label>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Suche nach Datei, Bereich, Typ, Benutzer oder Wiki-Seite..."
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            />
          </div>

          <select
            value={areaFilter}
            onChange={(event) =>
              setAreaFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Bereiche
            </option>

            <option value="wiki">
              Wiki
            </option>

            <option value="ticket">
              Tickets
            </option>

            <option value="news">
              News
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-4 rounded-2xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredResults.length} von{" "}
          {results.length} Dateien gefunden
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Datei
                </th>

                <th className="px-5 py-4 font-semibold">
                  Bereich
                </th>

                <th className="px-5 py-4 font-semibold">
                  Zugeordnet zu
                </th>

                <th className="px-5 py-4 font-semibold">
                  Typ
                </th>

                <th className="px-5 py-4 font-semibold">
                  Größe
                </th>

                <th className="px-5 py-4 font-semibold">
                  Hochgeladen
                </th>

                <th className="px-5 py-4 font-semibold text-right">
                  Aktionen
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredResults.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-zinc-500"
                  >
                    Keine Dateien gefunden.
                  </td>
                </tr>
              )}

              {filteredResults.map(
                (result) => (
                  <tr
                    key={`${result.key}-${result.index}-${result.file.name}`}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4 min-w-[260px]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                          {getFileIcon(
                            result.file.type
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {result.file.name}
                          </p>

                          <p className="text-xs text-zinc-500 mt-1">
                            Index #{result.index}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getAreaLabel(
                          result.key
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={getAreaHref(
                          result.key
                        )}
                        className="font-medium hover:text-zinc-600 transition"
                      >
                        {getPageTitle(
                          result.key
                        )}
                      </Link>

                      <p className="font-mono text-xs text-zinc-400 mt-1">
                        {result.key}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {result.file.type ||
                        "Unbekannt"}
                    </td>

                    <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                      {formatFileSize(
                        result.file.size
                      )}
                    </td>

                    <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                      <p>
                        {result.file.uploadedAt ||
                          "Unbekannt"}
                      </p>

                      <p className="text-xs text-zinc-400 mt-1">
                        {result.file.uploadedBy ||
                          "Unbekannt"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {result.file.data && (
                          <a
                            href={result.file.data}
                            download={
                              result.file.name ||
                              "datei"
                            }
                            className="bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}