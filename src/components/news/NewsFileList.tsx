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

type NewsFileListProps = {
  newsId: string;
  editable?: boolean;
};

function getNewsFileKey(newsId: string) {
  return `news-${newsId}`;
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

export default function NewsFileList({
  newsId,
  editable = true,
}: NewsFileListProps) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
    newsId,
  ]);

  async function loadFiles() {
    if (!newsId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const nextFiles =
        await fileRepository.listForKey(getNewsFileKey(newsId));

      setFiles(Array.isArray(nextFiles) ? nextFiles : []);
    } catch (error) {
      console.error(
        "News-Dateien konnten nicht geladen werden:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  const totalSize = useMemo(
    () =>
      files.reduce(
        (sum, file) => sum + (file.size || 0),
        0,
      ),
    [
      files,
    ],
  );

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
          getNewsFileKey(newsId),
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
          title: "News-Datei hochgeladen",
          description: `Datei "${file.name}" wurde zu News #${newsId} hochgeladen.`,
          entityType: "news",
          entityId: newsId,
          userName: "System",
          userEmail: "",
          user: "System",
          companyId: "",
          departmentId: "",
          company: "Intern",
          department: "",
          metadata: {
            newsId,
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

  async function handleDeleteFile(
    file: StoredFile,
    index: number,
  ) {
    if (!editable) {
      alert("Du hast keine Berechtigung, Dateien zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Datei "${file.name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteFromKey(
        getNewsFileKey(newsId),
        index,
      );

      void activityRepository.create({
        type: "deleted",
        title: "News-Datei gelöscht",
        description: `Datei "${file.name}" wurde von News #${newsId} gelöscht.`,
        entityType: "news",
        entityId: newsId,
        userName: "System",
        userEmail: "",
        user: "System",
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          newsId,
          fileName: file.name,
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
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Dateien
            </h2>
            <p className="text-zinc-500 mt-1">
              Anhänge und Downloads zu dieser News.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
              {files.length} Dateien
            </span>

            <span className="rounded-full bg-zinc-100 text-zinc-700 px-4 py-2 text-sm font-bold">
              {formatFileSize(totalSize)}
            </span>
          </div>
        </div>

        {editable && (
          <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-3xl p-5">
            <label className="block font-bold text-zinc-950">
              Dateien hochladen
            </label>
            <p className="text-sm text-zinc-500 mt-1">
              Dateien werden der News-Gruppe zugeordnet und gespeichert.
            </p>

            <input
              type="file"
              multiple
              onChange={(event) => void handleFileChange(event)}
              disabled={uploading}
              className="mt-4 block w-full border border-dashed border-zinc-300 rounded-2xl px-5 py-5 bg-white disabled:opacity-50"
            />

            {uploading && (
              <div className="mt-4 app-accent-soft app-accent-text rounded-2xl p-4 font-medium">
                Upload läuft...
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 bg-zinc-50 rounded-2xl p-4">
            <p className="text-zinc-500">
              Dateien werden geladen...
            </p>
          </div>
        )}

        {!loading && files.length === 0 && (
          <div className="mt-6 border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
              📎
            </div>
            <h3 className="font-bold mt-4">
              Noch keine Dateien vorhanden.
            </h3>
            <p className="text-zinc-500 mt-2">
              Anhänge erscheinen hier, sobald sie hochgeladen wurden.
            </p>
          </div>
        )}

        {!loading && files.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            {files.map((file, index) => (
              <article
                key={`${file.name}-${index}`}
                className="border border-zinc-200 rounded-3xl p-5 bg-white hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-zinc-950 line-clamp-1">
                      {file.name}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                      {file.type || "application/octet-stream"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Größe
                    </p>
                    <p className="font-bold mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Hochgeladen
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {file.uploadedAt || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-3">
                    <p className="text-xs text-zinc-500">
                      Von
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {file.uploadedBy || "System"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-100">
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
                      onClick={() => void handleDeleteFile(file, index)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}