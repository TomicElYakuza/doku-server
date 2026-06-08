"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  activityRepository,
} from "../../lib/activityRepository";
import {
  fileRepository,
} from "../../lib/fileRepository";
import type {
  StoredFile,
} from "../../types/file";

type TicketFileListProps = {
  ticketId: string;
  editable?: boolean;
};

type FileEntry = {
  file: StoredFile;
  index: number;
};

function getFileKey(ticketId: string) {
  return `ticket-${ticketId}`;
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(type?: string) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("pdf")) {
    return "📕";
  }

  if (normalizedType.includes("image")) {
    return "🖼️";
  }

  if (
    normalizedType.includes("word") ||
    normalizedType.includes("document")
  ) {
    return "📘";
  }

  if (
    normalizedType.includes("excel") ||
    normalizedType.includes("spreadsheet")
  ) {
    return "📗";
  }

  if (
    normalizedType.includes("zip") ||
    normalizedType.includes("compressed")
  ) {
    return "🗜️";
  }

  return "📄";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.onerror = () => {
      reject(new Error("Datei konnte nicht gelesen werden."));
    };

    reader.readAsDataURL(file);
  });
}

export default function TicketFileList({
  ticketId,
  editable = true,
}: TicketFileListProps) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileKey = useMemo(
    () => getFileKey(ticketId),
    [
      ticketId,
    ],
  );

  useEffect(() => {
    void loadFiles();

    function handleFilesUpdated() {
      void loadFiles();
    }

    window.addEventListener(
      "filesUpdated",
      handleFilesUpdated,
    );

    return () => {
      window.removeEventListener(
        "filesUpdated",
        handleFilesUpdated,
      );
    };
  }, [
    fileKey,
  ]);

  async function loadFiles() {
    if (!fileKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const fileMap = await fileRepository.getAll();
      const nextFiles = Array.isArray(fileMap[fileKey])
        ? fileMap[fileKey]
        : [];

      setFiles(nextFiles);
    } catch (error) {
      console.error(
        "Ticket-Dateien konnten nicht geladen werden:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!editable) {
      alert("Du hast keine Berechtigung, Dateien hochzuladen.");
      return;
    }

    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(true);

      for (const file of selectedFiles) {
        const data = await readFileAsDataUrl(file);

        await fileRepository.addToKey(
          fileKey,
          {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            data,
            uploadedAt: new Date().toLocaleString(),
            uploadedBy: "System",
          },
        );

        void activityRepository.create({
          type: "created",
          title: "Ticket-Datei hochgeladen",
          description: `Datei "${file.name}" wurde zu Ticket #${ticketId} hochgeladen.`,
          entityType: "ticket",
          entityId: ticketId,
          userName: "System",
          userEmail: "",
          user: "System",
          companyId: "",
          departmentId: "",
          company: "Intern",
          department: "",
          metadata: {
            ticketId,
            fileKey,
            fileName: file.name,
            fileSize: file.size,
          },
        });
      }

      event.target.value = "";
      await loadFiles();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Datei konnte nicht hochgeladen werden.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(entry: FileEntry) {
    if (!editable) {
      alert("Du hast keine Berechtigung, Dateien zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Datei "${entry.file.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteFromKey(
        fileKey,
        entry.index,
      );

      void activityRepository.create({
        type: "deleted",
        title: "Ticket-Datei gelöscht",
        description: `Datei "${entry.file.name}" wurde von Ticket #${ticketId} gelöscht.`,
        entityType: "ticket",
        entityId: ticketId,
        userName: "System",
        userEmail: "",
        user: "System",
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          ticketId,
          fileKey,
          fileName: entry.file.name,
        },
      });

      await loadFiles();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Datei konnte nicht gelöscht werden.",
      );
    }
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-black">
              Dateien
            </h2>
            <p className="text-zinc-500 mt-1">
              Anhänge, Screenshots und Dokumente zu diesem Ticket.
            </p>
          </div>

          <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
            {files.length} Dateien
          </span>
        </div>

        {editable && (
          <div className="border border-dashed border-zinc-300 rounded-3xl p-5 bg-zinc-50 mt-6">
            <label className="block mb-2 font-bold">
              Dateien hochladen
            </label>

            <input
              type="file"
              multiple
              onChange={(event) => void handleFileChange(event)}
              disabled={uploading}
              className="w-full border border-dashed border-zinc-300 rounded-2xl px-5 py-4 bg-white disabled:opacity-50"
            />

            {uploading && (
              <div className="mt-4 app-accent-soft app-accent-text rounded-2xl p-4 font-medium">
                Upload läuft...
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mt-8">
          {loading && (
            <div className="bg-zinc-50 rounded-2xl p-5 text-zinc-500">
              Dateien werden geladen...
            </div>
          )}

          {!loading && files.length === 0 && (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
                📎
              </div>

              <p className="font-black mt-4">
                Noch keine Dateien
              </p>
              <p className="text-zinc-500 mt-1">
                Anhänge erscheinen hier, sobald sie hochgeladen werden.
              </p>
            </div>
          )}

          {files.map((file, index) => (
            <article
              key={`${file.name}-${index}`}
              className="border border-zinc-200 rounded-3xl p-5 bg-white hover:border-indigo-200 transition"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-black text-zinc-950 break-all">
                      {file.name}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      {formatFileSize(file.size)} · {file.type || "application/octet-stream"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {file.uploadedAt || "-"} · {file.uploadedBy || "System"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {file.data && (
                    <a
                      href={file.data}
                      download={file.name}
                      className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                    >
                      Download
                    </a>
                  )}

                  {editable && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleDeleteFile({
                          file,
                          index,
                        })
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
