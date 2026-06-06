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
  canDelete,
  canEdit,
} from "../../lib/permissions";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

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

function getKeyLabel(
  key: string,
  wikiPages: WikiPage[]
) {
  if (
    key.startsWith(
      "wiki-"
    )
  ) {
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

    return (
      page?.title ||
      `Wiki: ${slug}`
    );
  }

  if (
    key.startsWith(
      "ticket-"
    )
  ) {
    return `Ticket #${key.replace(
      "ticket-",
      ""
    )}`;
  }

  if (
    key.startsWith(
      "news-"
    )
  ) {
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
  if (
    key.startsWith(
      "wiki-"
    )
  ) {
    return `/wiki/${encodeURIComponent(
      key.replace(
        "wiki-",
        ""
      )
    )}`;
  }

  if (
    key.startsWith(
      "ticket-"
    )
  ) {
    return `/tickets/${encodeURIComponent(
      key.replace(
        "ticket-",
        ""
      )
    )}`;
  }

  if (
    key.startsWith(
      "news-"
    )
  ) {
    return `/news/${encodeURIComponent(
      key.replace(
        "news-",
        ""
      )
    )}`;
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

export default function FilesPage() {
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

      setFileMap(
        nextFileMap ||
          {}
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
          nextFileMap ||
            {}
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
          ([
            key,
            files,
          ]) =>
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

  const filteredEntries =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return entries.filter(
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
        entries,
        search,
        keyFilter,
        wikiPages,
      ]
    );

  const totalFiles =
    entries.length;

  const totalSize =
    entries.reduce(
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

  const imageFiles =
    entries.filter(
      (entry) =>
        String(
          entry.file.type ||
            ""
        ).startsWith(
          "image/"
        )
    );

  const documentFiles =
    entries.filter(
      (entry) =>
        !String(
          entry.file.type ||
            ""
        ).startsWith(
          "image/"
        )
    );

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    if (!canEdit()) {
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
        "Bitte einen Datei-SchlÃ¼ssel auswÃ¤hlen oder eingeben."
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
            "Keine Abteilung",

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
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Dateien zu lÃ¶schen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Datei "${entry.file.name}" wirklich lÃ¶schen?`
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
          "Datei gelÃ¶scht",

        description:
          `Datei "${entry.file.name}" wurde aus "${entry.key}" gelÃ¶scht.`,

        entityType:
          "file",

        entityId:
          entry.key,

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
          "Keine Abteilung",

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
          : "Datei konnte nicht gelÃ¶scht werden."
      );
    }
  }

  async function handleDeleteKey(
    key: string
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Dateigruppen zu lÃ¶schen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Alle Dateien unter "${key}" wirklich lÃ¶schen?`
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
          "Dateigruppe gelÃ¶scht",

        description:
          `Alle Dateien unter "${key}" wurden gelÃ¶scht.`,

        entityType:
          "file",

        entityId:
          key,

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
          "Keine Abteilung",

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
          : "Dateigruppe konnte nicht gelÃ¶scht werden."
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

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Verwaltung"
        title="Dateien"
        description="Zentral gespeicherte AnhÃ¤nge und Uploads aus PostgreSQL verwalten."
        badges={[
          {
            label:
              `${totalFiles} Dateien`,
          },
          {
            label:
              `${keys.length} Gruppen`,
          },
          {
            label:
              formatFileSize(
                totalSize
              ),
          },
        ]}
        actions={(
          <>
            <button
              type="button"
              onClick={() =>
                void loadData()
              }
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Aktualisieren
            </button>
          </>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Dateien gesamt"
          value={totalFiles}
          description="Alle Uploads"
          icon="ðŸ“"
          active={!search && !keyFilter}
          onClick={resetFilters}
        />

        <StatCard
          label="Dateigruppen"
          value={keys.length}
          description="Wiki, Ticket, News oder eigene Gruppen"
          icon="ðŸ—‚ï¸"
          tone="indigo"
        />

        <StatCard
          label="GesamtgrÃ¶ÃŸe"
          value={formatFileSize(
            totalSize
          )}
          description="Speicherverbrauch"
          icon="ðŸ’¾"
          tone="green"
        />

        <StatCard
          label="Bilder"
          value={imageFiles.length}
          description={`${documentFiles.length} sonstige Dateien`}
          icon="ðŸ–¼ï¸"
          tone="blue"
        />
      </div>

      {canEdit() && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">
              Datei hochladen
            </h2>

            <p className="text-zinc-500 mt-1">
              Dateien werden einer Gruppe zugeordnet und in PostgreSQL gespeichert.
            </p>
          </div>

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
                  Gruppe auswÃ¤hlen
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
                onChange={(event) =>
                  void handleFileChange(
                    event
                  )
                }
                disabled={uploading}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 disabled:opacity-50"
              />
            </div>
          </div>

          {uploading && (
            <p className="text-sm text-zinc-500 mt-5">
              Upload lÃ¤uft...
            </p>
          )}
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
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
            ZurÃ¼cksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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

        <p className="text-sm text-zinc-500 mt-5">
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

      <section className="space-y-4">
        {filteredEntries.map(
          (entry) => {
            const href =
              getKeyHref(
                entry.key
              );

            return (
              <div
                key={`${entry.key}-${entry.index}-${entry.file.name}`}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getKeyLabel(
                          entry.key,
                          wikiPages
                        )}
                      </span>

                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {entry.file.type ||
                          "application/octet-stream"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4 break-all">
                      {entry.file.name}
                    </h2>

                    <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                      <span>
                        GrÃ¶ÃŸe:{" "}
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
                        Quelle Ã¶ffnen
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

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteFile(
                            entry
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        LÃ¶schen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </section>

      {keyFilter && canDelete() && (
        <section className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Dateigruppe lÃ¶schen
          </h2>

          <p className="text-red-600 mt-2">
            Du filterst gerade nach der Gruppe "{keyFilter}". Du kannst alle Dateien dieser Gruppe lÃ¶schen.
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
            Ganze Gruppe lÃ¶schen
          </button>
        </section>
      )}
    </div>
  );
}
