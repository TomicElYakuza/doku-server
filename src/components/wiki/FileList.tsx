"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  deleteFile,
  getFilesForPage,
} from "../../lib/fileStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  getUser,
} from "../../lib/userStorage";

import {
  getStoredPages,
} from "../../lib/wikiStorage";

type FileListProps = {
  slug: string;
  editable?: boolean;
};

export default function FileList({
  slug,
  editable = false,
}: FileListProps) {
  const [files, setFiles] =
    useState<any[]>([]);

  const [mounted, setMounted] =
    useState(false);

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
  }, [slug]);

  function loadFiles() {
    setFiles(
      getFilesForPage(slug)
    );
  }

  function getCurrentCompany() {
    const pages =
      getStoredPages();

    const page =
      pages.find(
        (item: any) =>
          item.slug === slug
      );

    return (
      page?.company ||
      "Intern"
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
    file: any,
    index: number
  ) {
    const confirmed = confirm(
      "Datei wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    const company =
      getCurrentCompany();

    deleteFile(
      slug,
      index
    );

    saveActivity({
      type: "fileDeleted",

      title:
        file.name ||
        "Datei gelöscht",

      company,

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      <h3 className="font-semibold">
        Dateien
      </h3>

      {files.length === 0 && (
        <p className="text-sm text-zinc-500 mt-3">
          Keine Dateien vorhanden.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {files.map(
          (
            file: any,
            index: number
          ) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-4"
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
                    className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                  >
                    Download
                  </a>
                )}

                {editable && (
                  <button
                    onClick={() =>
                      handleDeleteFile(
                        file,
                        index
                      )
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
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