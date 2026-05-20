import {
  clearFiles,
  deleteFile,
  deleteFilesForPage,
  getFiles,
  getFilesForPage,
  saveFile,
  saveFiles,
} from "./fileStorage";

export type StoredFile = {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type FileMap = Record<
  string,
  StoredFile[]
>;

export type FileRepository = {
  getAll: () => FileMap;
  saveAll: (files: FileMap) => void;
  listKeys: () => string[];
  listForKey: (key: string) => StoredFile[];
  addToKey: (key: string, file: Partial<StoredFile>) => void;
  deleteFromKey: (key: string, index: number) => void;
  deleteKey: (key: string) => void;
  clear: () => void;

  countKeys: () => number;
  countFiles: () => number;
  countFilesForKey: (key: string) => number;
  search: (query: string) => Array<{
    key: string;
    index: number;
    file: StoredFile;
  }>;
};

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

export const localFileRepository: FileRepository = {
  getAll() {
    return getFiles() as FileMap;
  },

  saveAll(
    files: FileMap
  ) {
    saveFiles(
      files
    );
  },

  listKeys() {
    return Object.keys(
      localFileRepository.getAll()
    );
  },

  listForKey(
    key: string
  ) {
    return getFilesForPage(
      key
    ).map(
      (file: Partial<StoredFile>) =>
        normalizeFile(
          file
        )
    );
  },

  addToKey(
    key: string,
    file: Partial<StoredFile>
  ) {
    saveFile(
      key,
      normalizeFile(
        file
      )
    );
  },

  deleteFromKey(
    key: string,
    index: number
  ) {
    deleteFile(
      key,
      index
    );
  },

  deleteKey(
    key: string
  ) {
    deleteFilesForPage(
      key
    );
  },

  clear() {
    clearFiles();
  },

  countKeys() {
    return localFileRepository.listKeys().length;
  },

  countFiles() {
    return Object.values(
      localFileRepository.getAll()
    ).reduce(
      (sum, files) =>
        sum +
        (
          Array.isArray(
            files
          )
            ? files.length
            : 0
        ),
      0
    );
  },

  countFilesForKey(
    key: string
  ) {
    return localFileRepository.listForKey(
      key
    ).length;
  },

  search(
    query: string
  ) {
    const normalizedQuery =
      query
        .trim()
        .toLowerCase();

    const results: Array<{
      key: string;
      index: number;
      file: StoredFile;
    }> = [];

    Object.entries(
      localFileRepository.getAll()
    ).forEach(
      ([key, files]) => {
        if (!Array.isArray(files)) {
          return;
        }

        files.forEach(
          (file, index) => {
            const normalizedFile =
              normalizeFile(
                file
              );

            const haystack = [
              key,
              normalizedFile.name,
              normalizedFile.type,
              normalizedFile.uploadedAt,
              normalizedFile.uploadedBy,
              normalizedFile.size,
            ]
              .join(" ")
              .toLowerCase();

            if (
              !normalizedQuery ||
              haystack.includes(
                normalizedQuery
              )
            ) {
              results.push({
                key,
                index,
                file:
                  normalizedFile,
              });
            }
          }
        );
      }
    );

    return results;
  },
};

export const fileRepository =
  localFileRepository;