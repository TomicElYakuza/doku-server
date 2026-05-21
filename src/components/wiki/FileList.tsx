"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  fileRepository,
} from "../../lib/fileRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

import type {
  StoredFile,
} from "../../types/file";

type FileListProps = {
  pageSlug: string;
  editable?: boolean;
};

function formatFileSize(
  size: number
) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getWikiFileKey(
  pageSlug: string
) {
  return `wiki-${pageSlug}`;
}

export default function FileList({
  pageSlug,
  editable = true,
}: FileListProps) {
  const [files, setFiles] =
    useState<StoredFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void loadFiles();

    function handleFilesUpdated() {
      void loadFiles();
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
  }, [
    pageSlug,
  ]);

  async function loadFiles() {
    if (!pageSlug) {
      return;
    }

    try {
      setLoading(
        true
      );

      const nextFiles =
        await fileRepository.listForKey(
          getWikiFileKey(
            pageSlug
          )
        );

      setFiles(
        nextFiles
      );
    } catch (error) {
      console.error(
        "Dateien konnten nicht geladen werden:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleDeleteFile(
    file: StoredFile,
    index: number
  ) {
    if (!editable) {
      alert(
        "Du hast keine Berechtigung, Dateien zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Datei "${file.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteFromKey(
        getWikiFileKey(
          pageSlug
        ),
        index
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Wiki-Datei gelöscht",

        description:
          `Datei "${file.name}" wurde von Wiki-Seite "${pageSlug}" gelöscht.`,

        entityType:
          "wiki",

        entityId:
          pageSlug,

        userName:
          "System",

        userEmail:
          "",

        user:
          "System",

        companyId:
          "",

        departmentId:
          "",

        company:
          "Intern",

        department:
          "Allgemein",

        metadata: {
          pageSlug,
          fileName:
            file.name,
        },
      });

      await loadFiles();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Datei konnte nicht gelöscht werden."
      );
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Anhänge
          </h2>

          <p className="text-zinc-500 mt-1">
            Dateien zu dieser Wiki-Seite.
          </p>
        </div>

        <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
          {files.length}
        </span>
      </div>

      <div className="space-y-4 mt-6">
        {loading && (
          <p className="text-zinc-500">
            Dateien werden geladen...
          </p>
        )}

        {!loading && files.length === 0 && (
          <p className="text-zinc-500">
            Noch keine Dateien vorhanden.
          </p>
        )}

        {files.map(
          (file, index) => (
            <div
              key={`${file.name}-${file.uploadedAt}-${index}`}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-zinc-200 rounded-2xl p-5"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {file.name}
                </p>

                <p className="text-sm text-zinc-500 mt-1">
                  {file.type} ·{" "}
                  {formatFileSize(
                    file.size
                  )} · Hochgeladen am{" "}
                  {file.uploadedAt}
                </p>

                {file.uploadedBy && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Von:{" "}
                    {file.uploadedBy}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <a
                  href={file.data}
                  download={file.name}
                  className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                >
                  Download
                </a>

                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleDeleteFile(
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