"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
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

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
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

function getFileIcon(file: StoredFile) {
  const type = String(file.type || "");

  if (type.startsWith("image/")) {
    return "🖼️";
  }

  if (type.includes("pdf")) {
    return "📕";
  }

  if (type.includes("spreadsheet") || type.includes("excel")) {
    return "📊";
  }

  if (type.includes("word") || type.includes("document")) {
    return "📄";
  }

  if (type.includes("zip") || type.includes("archive")) {
    return "📦";
  }

  return "📎";
}

function getFileTypeLabel(file: StoredFile) {
  const type = String(file.type || "");

  if (!type) {
    return "Datei";
  }

  if (type.startsWith("image/")) {
    return "Bild";
  }

  if (type.includes("pdf")) {
    return "PDF";
  }

  if (type.includes("spreadsheet") || type.includes("excel")) {
    return "Tabelle";
  }

  if (type.includes("word") || type.includes("document")) {
    return "Dokument";
  }

  if (type.includes("zip") || type.includes("archive")) {
    return "Archiv";
  }

  return type;
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
        Array.isArray(nextWikiPages) ? nextWikiPages : [],
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

      setFileMap(nextFileMap || {});
      setWikiPages(
        Array.isArray(nextWikiPages) ? nextWikiPages : [],
      );

      const keys = Object.keys(nextFileMap || {});

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

  const totalSize = entries.reduce(
    (sum, entry) => sum + (entry.file.size || 0),
    0,
  );

  const imageFiles = entries.filter((entry) =>
    String(entry.file.type || "").startsWith("image/"),
  );

  const documentFiles = entries.filter((entry) =>
    !String(entry.file.type || "").startsWith("image/"),
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

    const targetKey = customUploadKey.trim() || uploadKey.trim();

    if (!targetKey) {
      alert("Bitte einen Datei-Schlüssel auswählen oder eingeben.");
      return;
    }

    try {
      setUploading(true);

      for (const file of selectedFiles) {
        const data = await readFileAsDataUrl(file);

        await fileRepository.addToKey(targetKey, {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          data,
          uploadedAt: new Date().toLocaleString(),
          uploadedBy: "System",
        });

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
      await fileRepository.deleteFromKey(entry.key, entry.index);

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
        eyebrow="Velunis Dateien"
        title="Dateien"
        description="Uploads und Anhänge aus Wiki, Tickets und News zentral durchsuchen und verwalten."
        badges={[
          {
            label: `${totalFiles} Dateien`,
          },
          {
            label: formatFileSize(totalSize),
          },
          {
            label: `${imageFiles.length} Bilder`,
          },
          {
            label: `${keys.length} Gruppen`,
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
        <LoadingState
          title="Dateien werden geladen..."
          description="Dateigruppen, Anhänge und Wiki-Zuordnungen werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Dateien konnten nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadData()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Dateien"
              value={totalFiles}
              description="Alle gespeicherten Uploads"
              icon="📁"
              active={!keyFilter && !search}
              onClick={resetFilters}
            />

            <StatCard
              label="Speicher"
              value={formatFileSize(totalSize)}
              description="Gesamte Dateigröße"
              icon="📦"
              tone="indigo"
            />

            <StatCard
              label="Bilder"
              value={imageFiles.length}
              description={`${documentFiles.length} weitere Dateien`}
              icon="🖼️"
              tone="blue"
              active={search === "image/"}
              onClick={() => setSearch("image/")}
            />

            <StatCard
              label="Gruppen"
              value={keys.length}
              description="Datei-Schlüssel"
              icon="🗂️"
              tone="green"
            />
          </div>

          {canEdit() && (
            <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black">
                      Datei hochladen
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Dateien werden einer Gruppe zugeordnet und in PostgreSQL gespeichert.
                    </p>
                  </div>

                  {uploading && (
                    <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                      Upload läuft...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
                  <div>
                    <label className="block mb-2 font-bold">
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
                    <label className="block mb-2 font-bold">
                      Oder neue Gruppe
                    </label>

                    <input
                      value={customUploadKey}
                      onChange={(event) =>
                        setCustomUploadKey(event.target.value)
                      }
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                      placeholder="z. B. wiki-startseite"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold">
                      Datei
                    </label>

                    <input
                      type="file"
                      multiple
                      onChange={(event) => void handleFileChange(event)}
                      disabled={uploading}
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus disabled:opacity-50 bg-white"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Suche & Filter
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Suche nach Dateiname, Typ, Gruppe oder Upload-Information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                >
                  Zurücksetzen
                </button>
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
            </div>
          </section>

          {filteredEntries.length === 0 && (
            <EmptyState
              icon="📁"
              title="Keine Dateien gefunden"
              description="Lade Dateien hoch oder passe die Filter an."
            />
          )}

          {filteredEntries.length > 0 && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredEntries.map((entry) => {
                const href = getKeyHref(entry.key);

                return (
                  <article
                    key={`${entry.key}-${entry.index}-${entry.file.name}`}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                            {getKeyLabel(entry.key, wikiPages)}
                          </span>

                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                            {getFileTypeLabel(entry.file)}
                          </span>
                        </div>

                        <div className="flex items-start gap-4 mt-5">
                          <div className="h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl shrink-0">
                            {getFileIcon(entry.file)}
                          </div>

                          <div className="min-w-0">
                            <h2 className="text-2xl font-black tracking-[-0.03em] text-zinc-950 break-words">
                              {entry.file.name}
                            </h2>

                            <p className="text-zinc-500 mt-2 break-all">
                              {entry.file.type || "application/octet-stream"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 text-sm">
                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              Größe
                            </p>
                            <p className="font-black text-zinc-950 mt-1">
                              {formatFileSize(entry.file.size)}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              Hochgeladen
                            </p>
                            <p className="font-black text-zinc-950 mt-1">
                              {entry.file.uploadedAt || "-"}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              Von
                            </p>
                            <p className="font-black text-zinc-950 mt-1">
                              {entry.file.uploadedBy || "System"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                        {href && (
                          <Link
                            href={href}
                            className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow text-center"
                          >
                            Quelle öffnen
                          </Link>
                        )}

                        {entry.file.data && (
                          <a
                            href={entry.file.data}
                            download={entry.file.name}
                            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-bold text-center"
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
                  </article>
                );
              })}
            </section>
          )}

          {keyFilter && canDelete() && (
            <section className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-red-700">
                Dateigruppe löschen
              </h2>

              <p className="text-red-700/80 mt-2 leading-7">
                Du filterst gerade nach der Gruppe "{keyFilter}". Du kannst alle Dateien dieser Gruppe löschen.
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
        </>
      )}
    </div>
  );
}