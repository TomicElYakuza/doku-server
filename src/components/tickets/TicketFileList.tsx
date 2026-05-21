"use client";

import {
  ChangeEvent,
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

type TicketFileListProps = {
  ticketId: string;
  editable?: boolean;
};

function getTicketFileKey(
  ticketId: string
) {
  return `ticket-${ticketId}`;
}

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

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          resolve(
            String(
              reader.result ||
                ""
            )
          );
        };

      reader.onerror =
        () => {
          reject(
            new Error(
              "Datei konnte nicht gelesen werden."
            )
          );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}

export default function TicketFileList({
  ticketId,
  editable = true,
}: TicketFileListProps) {
  const [files, setFiles] =
    useState<StoredFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

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
    ticketId,
  ]);

  async function loadFiles() {
    if (!ticketId) {
      return;
    }

    try {
      setLoading(
        true
      );

      const nextFiles =
        await fileRepository.listForKey(
          getTicketFileKey(
            ticketId
          )
        );

      setFiles(
        nextFiles
      );
    } catch (error) {
      console.error(
        "Ticket-Dateien konnten nicht geladen werden:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    if (!editable) {
      alert(
        "Du hast keine Berechtigung, Dateien hochzuladen."
      );

      return;
    }

    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      );

    if (selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(
        true
      );

      for (const file of selectedFiles) {
        const data =
          await readFileAsDataUrl(
            file
          );

        await fileRepository.addToKey(
          getTicketFileKey(
            ticketId
          ),
          {
            name:
              file.name,

            type:
              file.type ||
              "application/octet-stream",

            size:
              file.size,

            data,

            uploadedAt:
              new Date().toLocaleString(),

            uploadedBy:
              "System",
          }
        );

        void activityRepository.create({
          type:
            "created",

          title:
            "Ticket-Datei hochgeladen",

          description:
            `Datei "${file.name}" wurde zu Ticket #${ticketId} hochgeladen.`,

          entityType:
            "ticket",

          entityId:
            ticketId,

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
            ticketId,
            fileName:
              file.name,
            fileSize:
              file.size,
          },
        });
      }

      event.target.value =
        "";

      await loadFiles();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Datei konnte nicht hochgeladen werden."
      );
    } finally {
      setUploading(
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
        getTicketFileKey(
          ticketId
        ),
        index
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Ticket-Datei gelöscht",

        description:
          `Datei "${file.name}" wurde von Ticket #${ticketId} gelöscht.`,

        entityType:
          "ticket",

        entityId:
          ticketId,

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
          ticketId,
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
            Dateien
          </h2>

          <p className="text-zinc-500 mt-1">
            Anhänge zu diesem Ticket.
          </p>
        </div>

        <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
          {files.length}
        </span>
      </div>

      {editable && (
        <div className="border border-dashed border-zinc-300 rounded-2xl p-5 bg-zinc-50 mt-6">
          <label className="block">
            <span className="block font-medium">
              Dateien hochladen
            </span>

            <span className="block text-sm text-zinc-500 mt-1">
              Dateien werden in PostgreSQL gespeichert.
            </span>

            <input
              type="file"
              multiple
              onChange={(event) =>
                void handleFileChange(
                  event
                )
              }
              disabled={uploading}
              className="mt-4 block w-full text-sm"
            />
          </label>

          {uploading && (
            <p className="text-sm text-zinc-500 mt-3">
              Upload läuft...
            </p>
          )}
        </div>
      )}

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