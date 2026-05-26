"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fileRepository,
} from "../../lib/fileRepository";

import {
  wikiRepository,
} from "../../lib/wikiRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

import {
  usePermissions,
} from "../../hooks/usePermissions";

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

function getKeyLabel(
  key: string,
  wikiPages: WikiPage[]
) {
  if (key.startsWith("wiki-")) {
    const slug =
      key.replace(
        "wiki-",
        ""
      );

    const page =
      wikiPages.find(
        (item) =>
          item.slug === slug
      );

    return page?.title ||
      `Wiki: ${slug}`;
  }

  if (key.startsWith("ticket-")) {
    return `Ticket #${key.replace(
      "ticket-",
      ""
    )}`;
  }

  if (key.startsWith("news-")) {
    return `News #${key.replace(
      "news-",
      ""
    )}`;
  }

  return key;
}

function getKeyHref(
  key: string
) {
  if (key.startsWith("wiki-")) {
    return `/wiki/${encodeURIComponent(
      key.replace(
        "wiki-",
        ""
      )
    )}`;
  }

  if (key.startsWith("ticket-")) {
    return `/tickets/${encodeURIComponent(
      key.replace(
        "ticket-",
        ""
      )
    )}`;
  }

  if (key.startsWith("news-")) {
    return `/news/${encodeURIComponent(
      key.replace(
        "news-",
        ""
      )
    )}`;
  }

  return "";
}

function getFileCompany(
  entry: FileEntry,
  wikiPages: WikiPage[]
) {
  if (entry.key.startsWith("wiki-")) {
    const slug =
      entry.key.replace(
        "wiki-",
        ""
      );

    const page =
      wikiPages.find(
        (item) =>
          item.slug === slug
      );

    return page?.company ||
      "";
  }

  return "";
}

function getFileDepartment(
  entry: FileEntry,
  wikiPages: WikiPage[]
) {
  if (entry.key.startsWith("wiki-")) {
    const slug =
      entry.key.replace(
        "wiki-",
        ""
      );

    const page =
      wikiPages.find(
        (item) =>
          item.slug === slug
      );

    return (
      page?.department ||
      page?.category ||
      ""
    );
  }

  return "";
}

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        resolve(
          String(
            reader.result ||
              ""
          )
        );
      };

      reader.onerror = () => {
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

export default function FilesPage() {
  const {
    user,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageFiles =
    isAdmin ||
    hasAnyPermission([
      "files.manage",
    ]);

  const canViewFiles =
    canManageFiles ||
    hasAnyPermission([
      "files.view",
    ]);

  const canUploadFiles =
    canManageFiles ||
    hasAnyPermission([
      "files.upload",
    ]);

  const canDeleteFiles =
    canManageFiles ||
    hasAnyPermission([
      "files.delete",
    ]);

  const [fileMap, setFileMap] =
    useState<Record<string, StoredFile[]>>({});

  const [wikiPages, setWikiPages] =
    useState<WikiPage[]>([]);

  const [search, setSearch] =
    useState("");

  const [keyFilter, setKeyFilter] =
    useState("");

  const [uploadKey, setUploadKey] =
    useState("");

  const [customUploadKey, setCustomUploadKey] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

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
      handleFilesUpdated
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    return () => {
      window.removeEventListener(
        "filesUpdated",
        handleFilesUpdated
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );
    };
  }, []);

  async function loadWikiPages() {
    try {
      const nextWikiPages =
        await wikiRepository.list();

      setWikiPages(
        Array.isArray(
          nextWikiPages
        )
          ? nextWikiPages
          : []
      );
    } catch (loadError) {
      console.error(
        "Wiki-Seiten konnten nicht geladen werden:",
        loadError
      );
    }
  }

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextFileMap,
        nextWikiPages,
      ] =
        await Promise.all([
          fileRepository.getAll(),
          wikiRepository.list(),
        ]);

      const safeFileMap =
        nextFileMap ||
        {};

      setFileMap(
        safeFileMap
      );

      setWikiPages(
        Array.isArray(
          nextWikiPages
        )
          ? nextWikiPages
          : []
      );

      const keys =
        Object.keys(
          safeFileMap
        );

      if (
        keys.length > 0 &&
        !uploadKey
      ) {
        setUploadKey(
          keys[0]
        );
      }
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Dateien konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function userCanSeeEntry(
    entry: FileEntry
  ) {
    if (isAdmin || canManageFiles) {
      return true;
    }

    if (
      !user ||
      !canViewFiles
    ) {
      return false;
    }

    const fileCompany =
      getFileCompany(
        entry,
        wikiPages
      );

    const fileDepartment =
      getFileDepartment(
        entry,
        wikiPages
      );

    if (
      fileDepartment &&
      user.department
    ) {
      return fileDepartment === user.department;
    }

    if (
      fileCompany &&
      user.company
    ) {
      return fileCompany === user.company;
    }

    return true;
  }

  const keys =
    useMemo(
      () =>
        Object.keys(
          fileMap
        ).sort(),
      [
        fileMap,
      ]
    );

  const entries =
    useMemo(
      () =>
        Object.entries(
          fileMap
        ).flatMap(
          ([key, files]) =>
            files.map(
              (
                file,
                index
              ) => ({
                key,
                index,
                file,
              })
            )
        ),
      [
        fileMap,
      ]
    );

  const visibleEntries =
    useMemo(
      () =>
        entries.filter(
          userCanSeeEntry
        ),
      [
        entries,
        user,
        isAdmin,
        canManageFiles,
        canViewFiles,
        wikiPages,
      ]
    );

  const visibleKeys =
    useMemo(
      () =>
        Array.from(
          new Set(
            visibleEntries.map(
              (entry) =>
                entry.key
            )
          )
        ).sort(),
      [
        visibleEntries,
      ]
    );

  const filteredEntries =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return visibleEntries.filter(
          (entry) => {
            const label =
              getKeyLabel(
                entry.key,
                wikiPages
              );

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
                .includes(
                  query
                );

            return (
              matchesKey &&
              matchesSearch
            );
          }
        );
      },
      [
        visibleEntries,
        search,
        keyFilter,
        wikiPages,
      ]
    );

  const totalFiles =
    visibleEntries.length;

  const totalSize =
    visibleEntries.reduce(
      (
        sum,
        entry
      ) =>
        sum +
        (
          entry.file.size ||
          0
        ),
      0
    );

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    if (!canUploadFiles) {
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

    const targetKey =
      customUploadKey.trim() ||
      uploadKey.trim();

    if (!targetKey) {
      alert(
        "Bitte einen Datei-Schlüssel auswählen oder eingeben."
      );

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
          targetKey,
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
              user?.name ||
              "System",
          }
        );

        void activityRepository.create({
          type:
            "created",

          title:
            "Datei hochgeladen",

          description:
            `Datei "${file.name}" wurde unter "${targetKey}" hochgeladen.`,

          entityType:
            "file",

          entityId:
            targetKey,

          userName:
            user?.name ||
            "System",

          userEmail:
            user?.email ||
            "",

          user:
            user?.name ||
            "System",

          companyId:
            user?.companyId ||
            "",

          departmentId:
            user?.departmentId ||
            "",

          company:
            user?.company ||
            "Intern",

          department:
            user?.department ||
            "Allgemein",

          metadata: {
            key:
              targetKey,

            fileName:
              file.name,

            fileSize:
              file.size,
          },
        });
      }

      event.target.value =
        "";

      setCustomUploadKey(
        ""
      );

      await loadData();
    } catch (uploadError) {
      console.error(
        uploadError
      );

      alert(
        uploadError instanceof Error
          ? uploadError.message
          : "Datei konnte nicht hochgeladen werden."
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  async function handleDeleteFile(
    entry: FileEntry
  ) {
    if (!canDeleteFiles) {
      alert(
        "Du hast keine Berechtigung, Dateien zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Datei "${entry.file.name}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteFromKey(
        entry.key,
        entry.index
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Datei gelöscht",

        description:
          `Datei "${entry.file.name}" wurde aus "${entry.key}" gelöscht.`,

        entityType:
          "file",

        entityId:
          entry.key,

        userName:
          user?.name ||
          "System",

        userEmail:
          user?.email ||
          "",

        user:
          user?.name ||
          "System",

        companyId:
          user?.companyId ||
          "",

        departmentId:
          user?.departmentId ||
          "",

        company:
          user?.company ||
          "Intern",

        department:
          user?.department ||
          "Allgemein",

        metadata: {
          key:
            entry.key,

          fileName:
            entry.file.name,
        },
      });

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Datei konnte nicht gelöscht werden."
      );
    }
  }

  async function handleDeleteKey(
    key: string
  ) {
    if (!canDeleteFiles) {
      alert(
        "Du hast keine Berechtigung, Dateigruppen zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Alle Dateien unter "${key}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await fileRepository.deleteKey(
        key
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Dateigruppe gelöscht",

        description:
          `Alle Dateien unter "${key}" wurden gelöscht.`,

        entityType:
          "file",

        entityId:
          key,

        userName:
          user?.name ||
          "System",

        userEmail:
          user?.email ||
          "",

        user:
          user?.name ||
          "System",

        companyId:
          user?.companyId ||
          "",

        departmentId:
          user?.departmentId ||
          "",

        company:
          user?.company ||
          "Intern",

        department:
          user?.department ||
          "Allgemein",

        metadata: {
          key,
        },
      });

      setKeyFilter(
        ""
      );

      await loadData();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Dateigruppe konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch(
      ""
    );

    setKeyFilter(
      ""
    );
  }

  if (!canViewFiles) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          Keine Berechtigung
        </h1>

        <p className="text-zinc-500 mt-2">
          Du hast keine Berechtigung, Dateien zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Dateien
          </h1>

          <p className="text-zinc-500 mt-2">
            Zentral gespeicherte Anhänge und Uploads aus PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadData()
          }
          className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          Aktualisieren
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dateien gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {totalFiles}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dateigruppen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {visibleKeys.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Gesamtgröße
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {formatFileSize(
              totalSize
            )}
          </h2>
        </div>
      </div>

      {canUploadFiles && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Datei hochladen
          </h2>

          <p className="text-zinc-500 mt-1">
            Dateien werden in PostgreSQL gespeichert.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Vorhandene Gruppe
              </label>

              <select
                value={uploadKey}
                onChange={(event) =>
                  setUploadKey(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Gruppe auswählen
                </option>

                {keys.map(
                  (key) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {getKeyLabel(
                        key,
                        wikiPages
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Oder neue Gruppe
              </label>

              <input
                value={customUploadKey}
                onChange={(event) =>
                  setCustomUploadKey(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z.B. wiki-startseite"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Datei
              </label>

              <input
                type="file"
                multiple
                onChange={(event) =>
                  void handleFileChange(
                    event
                  )
                }
                disabled={uploading}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4"
              />
            </div>
          </div>

          {uploading && (
            <p className="text-zinc-500 mt-4">
              Upload läuft...
            </p>
          )}
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Dateiname, Typ, Gruppe oder Upload-Information.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Dateien suchen..."
          />

          <select
            value={keyFilter}
            onChange={(event) =>
              setKeyFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Gruppen
            </option>

            {visibleKeys.map(
              (key) => (
                <option
                  key={key}
                  value={key}
                >
                  {getKeyLabel(
                    key,
                    wikiPages
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          {filteredEntries.length} von {totalFiles} Dateien gefunden.
        </p>
      </section>

      {filteredEntries.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold">
            Keine Dateien gefunden
          </h2>

          <p className="text-zinc-500 mt-2">
            Lade Dateien hoch oder passe die Filter an.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filteredEntries.map(
          (entry) => {
            const href =
              getKeyHref(
                entry.key
              );

            return (
              <div
                key={`${entry.key}-${entry.index}`}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getKeyLabel(
                          entry.key,
                          wikiPages
                        )}
                      </span>

                      <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        {entry.file.type ||
                          "application/octet-stream"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {entry.file.name}
                    </h2>

                    <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-4">
                      <span>
                        Größe:{" "}
                        {formatFileSize(
                          entry.file.size
                        )}
                      </span>

                      <span>
                        Hochgeladen:{" "}
                        {entry.file.uploadedAt}
                      </span>

                      <span>
                        Von:{" "}
                        {entry.file.uploadedBy ||
                          "System"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 shrink-0">
                    {href && (
                      <Link
                        href={href}
                        className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                      >
                        Quelle öffnen
                      </Link>
                    )}

                    {entry.file.data && (
                      <a
                        href={entry.file.data}
                        download={entry.file.name}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Download
                      </a>
                    )}

                    {canDeleteFiles && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteFile(
                            entry
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {keyFilter && canDeleteFiles && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Dateigruppe löschen
          </h2>

          <p className="text-red-600 mt-2">
            Du filterst gerade nach der Gruppe "{keyFilter}". Du kannst alle Dateien dieser Gruppe löschen.
          </p>

          <button
            type="button"
            onClick={() =>
              void handleDeleteKey(
                keyFilter
              )
            }
            className="mt-5 bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
          >
            Ganze Gruppe löschen
          </button>
        </div>
      )}
    </div>
  );
}