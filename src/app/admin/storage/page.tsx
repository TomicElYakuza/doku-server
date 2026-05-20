"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  canDelete,
  canViewAdmin,
} from "../../../lib/permissions";

import {
  fileRepository,
} from "../../../lib/fileRepository";

import type {
  StoredFile,
} from "../../../lib/fileRepository";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

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

  return "Allgemein";
}

function getAreaClass(
  key: string
) {
  if (key.startsWith("ticket-")) {
    return "bg-blue-50 text-blue-700";
  }

  if (key.startsWith("wiki-")) {
    return "bg-indigo-50 text-indigo-700";
  }

  if (key.startsWith("news-")) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function AdminStoragePage() {
  const [mounted, setMounted] =
    useState(false);

  const [results, setResults] =
    useState<FileSearchResult[]>([]);

  const [search, setSearch] =
    useState("");

  const [areaFilter, setAreaFilter] =
    useState("");

  const [selectedKey, setSelectedKey] =
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
    setSelectedKey("");
  }

  function handleDeleteFile(
    result: FileSearchResult
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Dateien zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Datei "${result.file.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    fileRepository.deleteFromKey(
      result.key,
      result.index
    );

    loadFiles();
  }

  function handleDeleteKey(
    key: string
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, diesen Speicherbereich zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Alle Dateien im Bereich "${key}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    fileRepository.deleteKey(
      key
    );

    loadFiles();
  }

  function handleClearFiles() {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, den Speicher zu leeren."
      );

      return;
    }

    const confirmed =
      confirm(
        "Wirklich alle gespeicherten Dateien und Anhänge löschen?"
      );

    if (!confirmed) {
      return;
    }

    fileRepository.clear();

    loadFiles();
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  const keys =
    fileRepository.listKeys();

  const fileCount =
    fileRepository.countFiles();

  const ticketFileCount =
    results.filter(
      (result) =>
        result.key.startsWith(
          "ticket-"
        )
    ).length;

  const wikiFileCount =
    results.filter(
      (result) =>
        result.key.startsWith(
          "wiki-"
        )
    ).length;

  const newsFileCount =
    results.filter(
      (result) =>
        result.key.startsWith(
          "news-"
        )
    ).length;

  const filteredResults =
    results.filter(
      (result) => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

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
          result.file.uploadedAt
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
            result.key.startsWith(
              "wiki-"
            )
          ) ||
          (
            areaFilter === "news" &&
            result.key.startsWith(
              "news-"
            )
          ) ||
          (
            areaFilter === "general" &&
            !result.key.startsWith(
              "ticket-"
            ) &&
            !result.key.startsWith(
              "wiki-"
            ) &&
            !result.key.startsWith(
              "news-"
            )
          );

        const matchesKey =
          !selectedKey ||
          result.key === selectedKey;

        return (
          matchesSearch &&
          matchesArea &&
          matchesKey
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
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Speicher & Dateien
          </h1>

          <p className="text-zinc-500 mt-2">
            Anhänge und Uploads aus News, Wiki, Tickets und anderen Bereichen verwalten
          </p>
        </div>

        {canDelete() && (
          <button
            type="button"
            onClick={handleClearFiles}
            className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
          >
            Speicher leeren
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
            {fileCount}
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
              "ticket"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Ticket-Dateien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {ticketFileCount}
          </h2>
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
            Wiki-Dateien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {wikiFileCount}
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
            News-Dateien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {newsFileCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedKey("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Speicherbereiche
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {keys.length}
          </h2>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere Dateien nach Name, Bereich, Typ, Speicher-Key oder Benutzer.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Dateien durchsuchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

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

            <option value="ticket">
              Tickets
            </option>

            <option value="wiki">
              Wiki
            </option>

            <option value="news">
              News
            </option>

            <option value="general">
              Allgemein
            </option>
          </select>

          <select
            value={selectedKey}
            onChange={(event) =>
              setSelectedKey(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Speicherbereiche
            </option>

            {keys.map(
              (key) => (
                <option
                  key={key}
                  value={key}
                >
                  {key}
                </option>
              )
            )}
          </select>
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
                  Speicher-Key
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
                      <span className={`text-xs px-3 py-1 rounded-full ${getAreaClass(result.key)}`}>
                        {getAreaLabel(
                          result.key
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                      {result.key}
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

                        {canDelete() && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFile(
                                result
                              )
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                          >
                            Löschen
                          </button>
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

      {keys.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Speicherbereiche
          </h2>

          <p className="text-zinc-500 mt-2">
            Übersicht über alle Keys, unter denen Dateien aktuell lokal gespeichert sind.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {keys.map(
              (key) => (
                <div
                  key={key}
                  className="border border-zinc-200 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className={`text-xs px-3 py-1 rounded-full ${getAreaClass(key)}`}>
                        {getAreaLabel(
                          key
                        )}
                      </span>

                      <p className="font-mono text-sm text-zinc-700 mt-3 truncate">
                        {key}
                      </p>

                      <p className="text-sm text-zinc-500 mt-2">
                        {fileRepository.countFilesForKey(
                          key
                        )}{" "}
                        Dateien
                      </p>
                    </div>

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteKey(
                            key
                          )
                        }
                        className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition shrink-0"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}