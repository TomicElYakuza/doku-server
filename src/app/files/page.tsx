"use client";

import { useEffect, useState } from "react";

export default function FilesPage() {
  const [files, setFiles] =
    useState<any[]>([]);

  useEffect(() => {
    const data =
      localStorage.getItem(
        "wiki-files"
      );

    const storedFiles = data
      ? JSON.parse(data)
      : {};

    const allFiles = Object.entries(
      storedFiles
    ).flatMap(
      ([slug, fileList]: any) =>
        fileList.map((file: any) => ({
          ...file,
          slug,
        }))
    );

    setFiles(allFiles);
  }, []);

  function formatSize(size: number) {
    return `${Math.round(size / 1024)} KB`;
  }

  function getFileIcon(type: string) {
    if (type?.startsWith("image/")) {
      return "🖼️";
    }

    if (type?.includes("pdf")) {
      return "📄";
    }

    if (type?.includes("word")) {
      return "📝";
    }

    return "📎";
  }

  const imageCount = files.filter(
    (file) =>
      file.type?.startsWith("image/")
  ).length;

  const totalSize = files.reduce(
    (sum, file) =>
      sum + (file.size || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Dateien
        </h1>

        <p className="text-zinc-500 mt-2">
          Alle Anhänge aus dem Wiki gesammelt an einem Ort
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            Speichergröße
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {formatSize(totalSize)}
          </h2>
        </div>
      </div>

      {/* FILE LIST */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Anhänge
        </h2>

        <div className="mt-6 space-y-4">
          {files.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Dateien vorhanden.
            </p>
          )}

          {files.map(
            (
              file: any,
              index: number
            ) => (
              <div
                key={`${file.slug}-${index}`}
                className="flex items-center justify-between border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
                    {getFileIcon(file.type)}
                  </div>

                  <div>
                    <a
                      href={file.data}
                      download={file.name}
                      className="font-semibold hover:underline"
                    >
                      {file.name}
                    </a>

                    <p className="text-sm text-zinc-500 mt-1">
                      {formatSize(file.size)} ·{" "}
                      {file.uploadedAt}
                    </p>

                    <a
                      href={`/wiki/${file.slug}`}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Zugehöriges Dokument öffnen
                    </a>
                  </div>
                </div>

                <a
                  href={file.data}
                  download={file.name}
                  className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                >
                  Download
                </a>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}