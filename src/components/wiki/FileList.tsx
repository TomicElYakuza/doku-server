"use client";

import { useEffect, useState } from "react";

import {
  getFilesForPage,
  deleteFile,
} from "../../lib/fileStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  getUser,
} from "../../lib/userStorage";

export default function FileList({
  slug,
  editable = false,
}: {
  slug: string;
  editable?: boolean;
}) {
  const [files, setFiles] =
    useState<any[]>([]);

  useEffect(() => {
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
  }, [slug]);

  function loadFiles() {
    setFiles(
      getFilesForPage(slug)
    );
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

  function handleDeleteFile(
    index: number
  ) {
    const file =
      files[index];

    const confirmed = confirm(
      "Anhang wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    deleteFile(
      slug,
      index
    );

    saveActivity({
      type: "fileDeleted",

      title:
        file?.name || slug,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });
  }

  if (files.length === 0) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
        <h3 className="font-semibold">
          Anhänge
        </h3>

        <p className="text-sm text-zinc-500 mt-2">
          Keine Anhänge vorhanden.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
      <h3 className="font-semibold">
        Anhänge
      </h3>

      <div className="mt-4 space-y-3">
        {files.map(
          (
            file: any,
            index: number
          ) => (
            <div
              key={`${file.name || "file"}-${index}`}
              className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
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
                      className="font-medium hover:underline break-all"
                    >
                      {file.name ||
                        "Unbenannte Datei"}
                    </a>
                  ) : (
                    <p className="font-medium break-all">
                      {file.name ||
                        "Unbenannte Datei"}
                    </p>
                  )}

                  <p className="text-sm text-zinc-500 mt-1">
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
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file.data && (
                  <a
                    href={file.data}
                    download={
                      file.name ||
                      "download"
                    }
                    className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition text-sm"
                  >
                    Download
                  </a>
                )}

                {editable && (
                  <button
                    onClick={() =>
                      handleDeleteFile(
                        index
                      )
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition text-sm"
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
  );
}