"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  getFiles,
} from "../../lib/fileStorage";

export default function FilesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [files, setFiles] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
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
    const storedFiles =
      getFiles();

    const allFiles =
      Object.entries(storedFiles).flatMap(
        ([slug, fileList]: any) => {
          if (!Array.isArray(fileList)) {
            return [];
          }

          return fileList.map(
            (
              file: any,
              index: number
            ) => ({
              ...file,

              slug,

              fileIndex: index,
            })
          );
        }
      );

    setFiles(allFiles);
  }

  function formatSize(size: number) {
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

  function getFileIcon(type: string) {
    if (type?.startsWith("image/")) {
      return "🖼️";
    }

    if (type?.includes("pdf")) {
      return "📄";
    }

    if (
      type?.includes("word") ||
      type?.includes("document")
    ) {
      return "📝";
    }

    if (
      type?.includes("excel") ||
      type?.includes("spreadsheet")
    ) {
      return "📊";
    }

    if (type?.includes("zip")) {
      return "🗜️";
    }

    return "📎";
  }

  function getFileTypeLabel(type: string) {
    if (type?.startsWith("image/")) {
      return "Bild";
    }

    if (type?.includes("pdf")) {
      return "PDF";
    }

    if (
      type?.includes("word") ||
      type?.includes("document")
    ) {
      return "Dokument";
    }

    if (
      type?.includes("excel") ||
      type?.includes("spreadsheet")
    ) {
      return "Tabelle";
    }

    if (type?.includes("zip")) {
      return "Archiv";
    }

    return "Sonstige";
  }

  const fileTypes = [
    ...new Set(
      files.map((file: any) =>
        getFileTypeLabel(file.type)
      )
    ),
  ];

  const filteredFiles =
    files.filter((file: any) => {
      const query =
        search.toLowerCase();

      const typeLabel =
        getFileTypeLabel(file.type);

      const matchesSearch =
        file.name
          ?.toLowerCase()
          .includes(query) ||
        file.slug
          ?.toLowerCase()
          .includes(query) ||
        file.uploadedBy
          ?.toLowerCase()
          .includes(query) ||
        file.uploadedAt
          ?.toLowerCase()
          .includes(query) ||
        typeLabel
          .toLowerCase()
          .includes(query);

      const matchesType =
        !typeFilter ||
        typeLabel === typeFilter;

      return (
        matchesSearch &&
        matchesType
      );
    });

  const imageCount =
    files.filter((file) =>
      file.type?.startsWith("image/")
    ).length;

  const totalSize =
    files.reduce(
      (sum, file) =>
        sum + (file.size || 0),
      0
    );

  function resetFilters() {
    setSearch("");

    setTypeFilter("");
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Dateien
        </h1>

        <p className="text-zinc-500 mt-2">
          Alle Wiki-Anhänge gesammelt an einem Ort
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dateien gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {files.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Bilder
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {imageCount}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dateitypen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {fileTypes.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Speichergröße
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {formatSize(totalSize)}
          </h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Suche & Filter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            type="text"
            placeholder="Nach Datei, Dokument, Benutzer oder Datum suchen..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="md:col-span-2 w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          >
            <option value="">
              Alle Typen
            </option>

            {fileTypes.map(
              (type: string) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-zinc-500">
            {filteredFiles.length} von{" "}
            {files.length} Dateien gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* FILE LIST */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Anhänge
        </h2>

        <div className="mt-6 space-y-4">
          {filteredFiles.length === 0 && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
              <p className="text-zinc-500">
                Keine Dateien gefunden.
              </p>

              <Link
                href="/wiki"
                className="inline-flex mt-4 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
              >
                Wiki öffnen
              </Link>
            </div>
          )}

          {filteredFiles.map(
            (
              file: any,
              index: number
            ) => (
              <div
                key={`${file.slug}-${file.name || "file"}-${file.fileIndex}-${index}`}
                className="flex items-center justify-between border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(
                      file.type
                    )}
                  </div>

                  <div className="min-w-0">
                    {file.data ? (
                      <a
                        href={file.data}
                        download={
                          file.name ||
                          "download"
                        }
                        className="font-semibold hover:underline break-all"
                      >
                        {file.name ||
                          "Unbenannte Datei"}
                      </a>
                    ) : (
                      <p className="font-semibold break-all">
                        {file.name ||
                          "Unbenannte Datei"}
                      </p>
                    )}

                    <p className="text-sm text-zinc-500 mt-1">
                      {getFileTypeLabel(
                        file.type
                      )}{" "}
                      ·{" "}
                      {formatSize(
                        file.size
                      )}{" "}
                      ·{" "}
                      {file.uploadedAt ||
                        "Unbekannt"}
                    </p>

                    {file.uploadedBy && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Hochgeladen von{" "}
                        {file.uploadedBy}
                      </p>
                    )}

                    <Link
                      href={`/wiki/${file.slug}`}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Zugehöriges Dokument öffnen
                    </Link>
                  </div>
                </div>

                {file.data && (
                  <a
                    href={file.data}
                    download={
                      file.name ||
                      "download"
                    }
                    className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition shrink-0"
                  >
                    Download
                  </a>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}