import {
  requestJson,
} from "./apiClient";

import type {
  FileMap,
  FileSearchResult,
  StoredFile,
} from "../types/file";

import type {
  StoredFileWithId,
} from "./database/mappers/fileMapper";

export type FileRepository = {
  getAll: () => Promise<FileMap>;
  saveAll: (files: FileMap) => Promise<void>;
  listKeys: () => Promise<string[]>;
  listForKey: (key: string) => Promise<StoredFile[]>;
  addToKey: (key: string, file: Partial<StoredFile>) => Promise<void>;
  deleteFromKey: (key: string, index: number) => Promise<void>;
  deleteKey: (key: string) => Promise<void>;
  clear: () => Promise<void>;

  countKeys: () => Promise<number>;
  countFiles: () => Promise<number>;
  countFilesForKey: (key: string) => Promise<number>;
  search: (query: string) => Promise<FileSearchResult[]>;
};

function dispatchFilesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "filesUpdated"
    )
  );
}

function normalizeFile(
  file: Partial<StoredFile>
): StoredFile {
  return {
    name:
      file.name ||
      "Unbenannte Datei",

    type:
      file.type ||
      "application/octet-stream",

    size:
      file.size ||
      0,

    data:
      file.data ||
      "",

    uploadedAt:
      file.uploadedAt ||
      new Date().toLocaleString(),

    uploadedBy:
      file.uploadedBy ||
      "Unbekannt",
  };
}

function fileMatchesQuery(
  key: string,
  file: StoredFile,
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    key,
    file.name,
    file.type,
    file.size,
    file.uploadedAt,
    file.uploadedBy,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedQuery
  );
}

async function listAllFilesWithIds() {
  return requestJson<StoredFileWithId[]>(
    "/api/files"
  );
}

export const postgresFileRepository: FileRepository = {
  async getAll() {
    const files =
      await listAllFilesWithIds();

    return files.reduce<FileMap>(
      (map, file) => {
        if (!map[file.key]) {
          map[file.key] =
            [];
        }

        map[file.key].push({
          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

          data:
            file.data,

          uploadedAt:
            file.uploadedAt,

          uploadedBy:
            file.uploadedBy,
        });

        return map;
      },
      {}
    );
  },

  async saveAll(
    files: FileMap
  ) {
    await Promise.all(
      Object.entries(
        files
      ).flatMap(
        ([key, fileList]) =>
          fileList.map(
            (file) =>
              postgresFileRepository.addToKey(
                key,
                file
              )
          )
      )
    );

    dispatchFilesUpdated();
  },

  async listKeys() {
    const all =
      await postgresFileRepository.getAll();

    return Object.keys(
      all
    );
  },

  async listForKey(
    key: string
  ) {
    const files =
      await requestJson<StoredFileWithId[]>(
        `/api/files?key=${encodeURIComponent(
          key
        )}`
      );

    return files.map(
      (file) => ({
        name:
          file.name,

        type:
          file.type,

        size:
          file.size,

        data:
          file.data,

        uploadedAt:
          file.uploadedAt,

        uploadedBy:
          file.uploadedBy,
      })
    );
  },

  async addToKey(
    key: string,
    file: Partial<StoredFile>
  ) {
    const normalizedFile =
      normalizeFile(
        file
      );

    await requestJson<StoredFileWithId>(
      "/api/files",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            key,

            ...normalizedFile,
          }),
      }
    );

    dispatchFilesUpdated();
  },

  async deleteFromKey(
    key: string,
    index: number
  ) {
    const files =
      await requestJson<StoredFileWithId[]>(
        `/api/files?key=${encodeURIComponent(
          key
        )}`
      );

    const file =
      files[index];

    if (!file) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/files/${encodeURIComponent(
        file.id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchFilesUpdated();
  },

  async deleteKey(
    key: string
  ) {
    await requestJson<{
      ok: boolean;
    }>(
      `/api/files/by-key/${encodeURIComponent(
        key
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchFilesUpdated();
  },

  async clear() {
    throw new Error(
      "clear ist für PostgreSQL-Dateien nicht direkt verfügbar."
    );
  },

  async countKeys() {
    const keys =
      await postgresFileRepository.listKeys();

    return keys.length;
  },

  async countFiles() {
    const files =
      await listAllFilesWithIds();

    return files.length;
  },

  async countFilesForKey(
    key: string
  ) {
    const files =
      await postgresFileRepository.listForKey(
        key
      );

    return files.length;
  },

  async search(
    query: string
  ) {
    const files =
      await listAllFilesWithIds();

    return files
      .filter(
        (file) =>
          fileMatchesQuery(
            file.key,
            file,
            query
          )
      )
      .map(
        (file, index) => ({
          key:
            file.key,

          index,

          file: {
            name:
              file.name,

            type:
              file.type,

            size:
              file.size,

            data:
              file.data,

            uploadedAt:
              file.uploadedAt,

            uploadedBy:
              file.uploadedBy,
          },
        })
      );
  },
};

export const fileRepository =
  postgresFileRepository;
