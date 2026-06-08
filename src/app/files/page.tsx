"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  activityRepository,
} from "../../lib/activityRepository";
import {
  fileRepository,
} from "../../lib/fileRepository";
import {
  canDelete,
  canEdit,
} from "../../lib/permissions";
import {
  wikiRepository,
} from "../../lib/wikiRepository";
import type {
  StoredFile,
} from "../../types/file";
import type {
  WikiPage,
} from "../../types/wiki";

type FileEntry = {
  key: string;
  index: number;
  file: StoredFile;
};

type ViewMode = "table" | "cards";

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

  if (normalizedType.includes("text")) {
    return "📝";
  }

  return "📄";
}

function getFileTypeLabel(type?: string) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("pdf")) {
    return "PDF";
  }

  if (normalizedType.includes("image")) {
    return "Bild";
  }

  if (
    normalizedType.includes("word") ||
    normalizedType.includes("document")
  ) {
    return "Dokument";
  }

  if (
    normalizedType.includes("excel") ||
    normalizedType.includes("spreadsheet")
  ) {
    return "Tabelle";
  }

  if (
    normalizedType.includes("zip") ||
    normalizedType.includes("compressed")
  ) {
    return "Archiv";
  }

  if (normalizedType.includes("text")) {
    return "Text";
  }

  return "Datei";
}

function getFileTypeClass(type?: string) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("pdf")) {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (normalizedType.includes("image")) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    normalizedType.includes("word") ||
    normalizedType.includes("document")
  ) {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (
    normalizedType.includes("excel") ||
    normalizedType.includes("spreadsheet")
  ) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (
    normalizedType.includes("zip") ||
    normalizedType.includes("compressed")
  ) {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getGroupClass(key: string) {
  if (key.startsWith("wiki-")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (key.startsWith("ticket-")) {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (key.startsWith("news-")) {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getKeyLabel(
  key: string,
  wikiPages: WikiPage[],
) {
  if (key.startsWith("wiki-")) {
    const slug = key.replace("wiki-", "");
    const page = wikiPages.find((item) => item.slug === slug);

    return page?.title || `Wiki: ${slug}`;
  }

  if (key.startsWith("ticket-")) {
    return `Ticket #${key.replace("ticket-", "")}`;
  }

  if (key.startsWith("news-")) {
    return `News #${key.replace("news-", "")}`;
  }

  return key;
}

function getKeyTypeLabel(key: string) {
  if (key.startsWith("wiki-")) {
    return "Wiki";
  }

  if (key.startsWith("ticket-")) {
    return "Ticket";
  }

  if (key.startsWith("news-")) {
    return "News";
  }

  return "Gruppe";
}

function getKeyHref(key: string) {
  if (key.startsWith("wiki-")) {
    return `/wiki/${encodeURIComponent(key.replace("wiki-", ""))}`;
  }

  if (key.startsWith("ticket-")) {
    return `/tickets/${encodeURIComponent(key.replace("ticket-", ""))}`;
  }

  if (key.startsWith("news-")) {
    return `/news/${encodeURIComponent(key.replace("news-", ""))}`;
  }

  return "";
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

export default function FilesPage() {
  const [fileMap, setFileMap] = useState<Record<string, StoredFile[]>>({});
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);

  const [search, setSearch] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [uploadKey, setUploadKey] = useState("");
  const [customUploadKey, setCustomUploadKey] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadData();

    function handleFilesUpdated() {
      void loadData();
    }

    function handleWikiPagesUpdated() {
      void loadWikiPages();
    }

    window.addEventListener(
      "filesUpdated",
      handleFilesUpdated,
    );
    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated,
    );

    return () => {
      window.removeEventListener(
        "filesUpdated",
        handleFilesUpdated,
      );
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated,
      );
    };
  }, []);

  async function loadWikiPages() {
    try {
      const nextWikiPages = await wikiRepository.list();

      setWikiPages(
        Array.isArray(nextWikiPages)
          ? nextWikiPages
          : [],
      );
    } catch (loadError) {
      console.error(
        "Wiki-Seiten konnten nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextFileMap,
        nextWikiPages,
      ] = await Promise.all([
        fileRepository.getAll(),
        wikiRepository.list(),
      ]);

      const normalizedFileMap =
        nextFileMap && typeof nextFileMap === "object"
          ? nextFileMap
          : {};

      setFileMap(normalizedFileMap);
      setWikiPages(
        Array.isArray(nextWikiPages)
          ? nextWikiPages
          : [],
      );

      const keys = Object.keys(normalizedFileMap);

      if (keys.length > 0 && !uploadKey) {
        setUploadKey(keys[0]);
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dateien konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  const keys = useMemo(
    () => Object.keys(fileMap).sort(),
    [
      fileMap,
    ],
  );

  const entries = useMemo(
    () =>
      Object.entries(fileMap).flatMap(([key, files]) =>
        files.map((file, index) => ({
          key,
          index,
          file,
        })),
      ),
    [
      fileMap,
    ],
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const label = getKeyLabel(entry.key, wikiPages);

      const matchesKey =
        !keyFilter ||
        entry.key === keyFilter;

      const matchesSearch =
        !query ||
        [
          entry.key,
          label,
          getKeyTypeLabel(entry.key),
          entry.file.name,
          entry.file.type,
          entry.file.size,
          entry.file.uploadedAt,
          entry.file.uploadedBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesKey && matchesSearch;
    });
  }, [
    entries,
    search,
    keyFilter,
    wikiPages,
  ]);

  const totalFiles = entries.length;

  const totalSize = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => sum + (entry.file.size || 0),
        0,
      ),
    [
      entries,
    ],
  );

  const imageFiles = useMemo(
    () =>
      entries.filter((entry) =>
        String(entry.file.type || "").startsWith("image/"),
      ),
    [
      entries,
    ],
  );

  const documentFiles = useMemo(
    () =>
      entries.filter(
        (entry) =>
          !String(entry.file.type || "").startsWith("image/"),
      ),
    [
      entries,
    ],
  );

  const largestFile = useMemo(
    () =>
      [...entries].sort(
        (first, second) =>
          (second.file.size || 0) - (first.file.size || 0),
      )[0],
    [
      entries,
    ],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!canEdit()) {
      alert("Du hast keine Berechtigung, Dateien hochzuladen.");
      return;
    }

    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const targetKey =
      customUploadKey.trim() ||
      uploadKey.trim();

    if (!targetKey) {
      alert("Bitte einen Datei-Schlüssel auswählen oder eingeben.");
      return;
    }

    try {
      setUploading(true);

      for (const file of selectedFiles) {
        const data = await readFileAsDataUrl(file);

        await fileRepository.addToKey(
          targetKey,
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
          title: "Datei hochgeladen",
          description: `Datei "${file.name}" wurde unter "${targetKey}" hochgeladen.`,
          entityType: "file",
          entityId: targetKey,
          userName: "System",
          userEmail: "",
          user: "System",
          companyId: "",
          departmentId: "",
          company: "Intern",
          department: "",
          metadata: {
            key: targetKey,
            fileName: file.name,
            fileSize: file.size,
          },
        });
      }

      event.target.value = "";
      setCustomUploadKey("");

      await loadData();
    } catch (uploadError) {
      console.error(uploadError);

      alert(
        uploadError instanceof Error
          ? uploadError.message
          : "Datei konnte nicht hochgeladen werden.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(entry: FileEntry) {
    if (!canDelete()) {
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
        entry.key,
        entry.index,
      );

      void activityRepository.create({
        type: "deleted",
        title: "Datei gelöscht",
        description: `Datei "${entry.file.name}" wurde aus "${entry.key}" gelöscht.`,
        entityType: "file",
        entityId: entry.key,
        userName: "System",
        userEmail: "",
        user: "System",
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          key: entry.key,
          fileName: entry.file.name,
        },
      });

      await loadData();
    } catch (deleteError) {
      console.error(deleteError);

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Datei konnte nicht gelöscht werden.",
      );
    }
  }

  async function handleDeleteKey(key: string) {
    if (!canDelete()) {
      alert("Du hast keine Berechtigung, Dateigruppen zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Alle Dateien unter "${key}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteKey(key);

      void activityRepository.create({
        type: "deleted",
        title: "Dateigruppe gelöscht",
        description: `Alle Dateien unter "${key}" wurden gelöscht.`,
        entityType: "file",
        entityId: key,
        userName: "System",
        userEmail: "",
        user: "System",
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          key,
        },
      });

      setKeyFilter("");
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Dateigruppe konnte nicht gelöscht werden.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setKeyFilter("");
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Dateiablage"
        title="Dateien"
        description="Zentrale Dateiübersicht für Wiki, Tickets, News und weitere Dateigruppen im Velunis Workspace."
        badges={[
          {
            label: `${totalFiles} Dateien`,
          },
          {
            label: `${formatFileSize(totalSize)} Gesamtgröße`,
          },
          {
            label: `${keys.length} Gruppen`,
          },
          {
            label: largestFile
              ? `Größte: ${largestFile.file.name}`
              : "Noch keine Dateien",
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadData()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
          >
            Aktualisieren
          </button>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Dateien werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Dateien"
          value={totalFiles}
          description={`${keys.length} Gruppen`}
          icon="📁"
          active={!search && !keyFilter}
          onClick={resetFilters}
        />

        <StatCard
          label="Gesamtgröße"
          value={formatFileSize(totalSize)}
          description="Alle gespeicherten Dateien"
          icon="💾"
          tone="blue"
        />

        <StatCard
          label="Bilder"
          value={imageFiles.length}
          description="Bilddateien"
          icon="🖼️"
          tone="indigo"
          active={search === "image"}
          onClick={() => setSearch("image")}
        />

        <StatCard
          label="Dokumente"
          value={documentFiles.length}
          description="Nicht-Bild-Dateien"
          icon="📄"
          tone="purple"
        />
      </div>

      {canEdit() && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Datei hochladen
                </h2>
                <p className="text-zinc-500 mt-1">
                  Dateien werden einer Gruppe zugeordnet und in PostgreSQL gespeichert.
                </p>
              </div>

              <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                Upload
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
              <div>
                <label className="block mb-2 font-medium">
                  Vorhandene Gruppe
                </label>
                <select
                  value={uploadKey}
                  onChange={(event) => setUploadKey(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Gruppe auswählen
                  </option>

                  {keys.map((key) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {getKeyLabel(key, wikiPages)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Oder neue Gruppe
                </label>
                <input
                  value={customUploadKey}
                  onChange={(event) => setCustomUploadKey(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="z. B. wiki-startseite"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Datei
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(event) => void handleFileChange(event)}
                  disabled={uploading}
                  className="w-full border border-dashed border-zinc-300 rounded-2xl px-5 py-4 bg-white disabled:opacity-50"
                />
              </div>
            </div>

            {uploading && (
              <div className="mt-5 app-accent-soft app-accent-text rounded-2xl p-4 font-medium">
                Upload läuft...
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Dateiname, Typ, Gruppe oder Upload-Information.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                viewMode === "table"
                  ? "app-accent-bg text-white app-brand-shadow"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              }`}
            >
              Tabelle
            </button>

            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                viewMode === "cards"
                  ? "app-accent-bg text-white app-brand-shadow"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
              }`}
            >
              Karten
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="Dateien suchen..."
          />

          <select
            value={keyFilter}
            onChange={(event) => setKeyFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Gruppen
            </option>

            {keys.map((key) => (
              <option
                key={key}
                value={key}
              >
                {getKeyLabel(key, wikiPages)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <span className="text-sm text-zinc-500">
            {filteredEntries.length} von {totalFiles} Dateien gefunden.
          </span>

          {search && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Suche: {search}
            </span>
          )}

          {keyFilter && (
            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
              Gruppe: {getKeyLabel(keyFilter, wikiPages)}
            </span>
          )}
        </div>
      </section>

      {!loading && filteredEntries.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
            🔎
          </div>

          <h2 className="text-xl font-semibold mt-5">
            Keine Dateien gefunden
          </h2>
          <p className="text-zinc-500 mt-2">
            Lade Dateien hoch oder passe die Filter an.
          </p>
        </div>
      )}

      {viewMode === "table" && filteredEntries.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Datei
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Gruppe
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Typ
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Größe
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Upload
                  </th>
                  <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredEntries.map((entry) => {
                  const href = getKeyHref(entry.key);

                  return (
                    <tr
                      key={`${entry.key}-${entry.index}-${entry.file.name}`}
                      className="hover:bg-zinc-50 transition"
                    >
                      <td className="px-5 py-4 align-top min-w-[280px]">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl shrink-0">
                            {getFileIcon(entry.file.type)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-black text-zinc-950 line-clamp-1">
                              {entry.file.name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1 break-all">
                              {entry.file.type || "application/octet-stream"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getGroupClass(
                            entry.key,
                          )}`}
                        >
                          {getKeyTypeLabel(entry.key)}
                        </span>
                        <p className="text-sm text-zinc-500 mt-2 line-clamp-1">
                          {getKeyLabel(entry.key, wikiPages)}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getFileTypeClass(
                            entry.file.type,
                          )}`}
                        >
                          {getFileTypeLabel(entry.file.type)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {formatFileSize(entry.file.size)}
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-zinc-500">
                        <p>
                          {entry.file.uploadedAt || "-"}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {entry.file.uploadedBy || "System"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {href && (
                            <Link
                              href={href}
                              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                            >
                              Quelle
                            </Link>
                          )}

                          {entry.file.data && (
                            <a
                              href={entry.file.data}
                              download={entry.file.name}
                              className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                            >
                              Download
                            </a>
                          )}

                          {canDelete() && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteFile(entry)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewMode === "cards" && filteredEntries.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => {
            const href = getKeyHref(entry.key);

            return (
              <article
                key={`${entry.key}-${entry.index}-${entry.file.name}`}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getGroupClass(
                          entry.key,
                        )}`}
                      >
                        {getKeyLabel(entry.key, wikiPages)}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getFileTypeClass(
                          entry.file.type,
                        )}`}
                      >
                        {getFileTypeLabel(entry.file.type)}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mt-4">
                      <div className="h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl shrink-0">
                        {getFileIcon(entry.file.type)}
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-2xl font-black line-clamp-2">
                          {entry.file.name}
                        </h2>
                        <p className="text-zinc-500 mt-2 break-all">
                          {entry.file.type || "application/octet-stream"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {href && (
                      <Link
                        href={href}
                        className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                      >
                        Quelle
                      </Link>
                    )}

                    {entry.file.data && (
                      <a
                        href={entry.file.data}
                        download={entry.file.name}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                      >
                        Download
                      </a>
                    )}

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteFile(entry)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Größe
                    </p>
                    <p className="font-bold mt-1">
                      {formatFileSize(entry.file.size)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Hochgeladen
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {entry.file.uploadedAt || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Von
                    </p>
                    <p className="font-bold mt-1 line-clamp-1">
                      {entry.file.uploadedBy || "System"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {keyFilter && canDelete() && (
        <section className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-red-700">
            Dateigruppe löschen
          </h2>
          <p className="text-red-600 mt-2">
            Du filterst gerade nach der Gruppe „{keyFilter}“. Du kannst alle Dateien dieser Gruppe löschen.
          </p>

          <button
            type="button"
            onClick={() => void handleDeleteKey(keyFilter)}
            className="mt-5 bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition font-bold"
          >
            Ganze Gruppe löschen
          </button>
        </section>
      )}
    </div>
  );
}
