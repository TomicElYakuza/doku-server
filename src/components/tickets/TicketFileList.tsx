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

type TicketFileListProps = {
  ticketId: string;
  editable?: boolean;
};

function formatSize(
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

  if (type?.includes("zip")) {
    return "🗜️";
  }

  return "📎";
}

export default function TicketFileList({
  ticketId,
  editable = false,
}: TicketFileListProps) {
  const [mounted, setMounted] =
    useState(false);

  const [files, setFiles] =
    useState<any[]>([]);

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
  }, [
    ticketId,
  ]);

  function loadFiles() {
    setFiles(
      getFilesForPage(
        ticketId
      )
    );
  }

  function handleDeleteFile(
    file: any,
    index: number
  ) {
    const confirmed =
      confirm(
        "Anhang wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteFile(
      ticketId,
      index
    );

    saveActivity({
      type:
        "fileDeleted",

      title:
        file.name ||
        "Ticket-Anhang gelöscht",

      company:
        "Tickets",

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
    <div>
      <h3 className="text-xl font-semibold">
        Dateien & Anhänge
      </h3>

      <p className="text-zinc-500 mt-2">
        Hochgeladene Dateien, Screenshots, PDFs oder andere Anhänge zu diesem Ticket.
      </p>

      {files.length === 0 && (
        <p className="text-zinc-500 mt-4">
          Keine Dateien oder Anhänge vorhanden.
        </p>
      )}

      {files.length > 0 && (
        <div className="grid gap-3 mt-5">
          {files.map(
            (file: any, index: number) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl p-4"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
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
                          "ticket-anhang"
                        }
                        className="font-semibold hover:underline truncate block"
                      >
                        {file.name ||
                          "Unbenannter Anhang"}
                      </a>
                    ) : (
                      <p className="font-semibold truncate">
                        {file.name ||
                          "Unbenannter Anhang"}
                      </p>
                    )}

                    <p className="text-sm text-zinc-500 mt-1">
                      {formatSize(
                        file.size
                      )}
                      {" · "}
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

                <div className="flex gap-2 shrink-0">
                  {file.data && (
                    <a
                      href={file.data}
                      download={
                        file.name ||
                        "ticket-anhang"
                      }
                      className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                    >
                      Download
                    </a>
                  )}

                  {editable && (
                    <button
                      type="button"
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
      )}
    </div>
  );
}