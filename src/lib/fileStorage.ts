const STORAGE_KEY = "wiki-files";

export function getFiles() {
  if (typeof window === "undefined") {
    return {};
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(data);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveFiles(files: any) {
  if (typeof window === "undefined") {
    return;
  }

  const safeFiles =
    files &&
    typeof files === "object" &&
    !Array.isArray(files)
      ? files
      : {};

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeFiles)
  );

  window.dispatchEvent(
    new Event("filesUpdated")
  );
}

export function getFilesForPage(
  slug: string
) {
  if (!slug) {
    return [];
  }

  const files =
    getFiles();

  const pageFiles =
    files[slug];

  if (!Array.isArray(pageFiles)) {
    return [];
  }

  return pageFiles;
}

export function saveFile(
  slug: string,
  file: any
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug || !file) {
    return;
  }

  const files =
    getFiles();

  const currentFiles =
    getFilesForPage(slug);

  const newFile = {
    name:
      file.name ||
      "Unbenannte Datei",

    type:
      file.type ||
      "application/octet-stream",

    size:
      file.size || 0,

    data:
      file.data || "",

    uploadedAt:
      file.uploadedAt ||
      new Date().toLocaleString(),

    uploadedBy:
      file.uploadedBy ||
      "Unbekannt",
  };

  const updatedFiles = {
    ...files,

    [slug]: [
      ...currentFiles,
      newFile,
    ],
  };

  saveFiles(updatedFiles);
}

export function deleteFile(
  slug: string,
  index: number
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const files =
    getFiles();

  const currentFiles =
    getFilesForPage(slug);

  const updatedSlugFiles =
    currentFiles.filter(
      (
        _file: any,
        fileIndex: number
      ) => fileIndex !== index
    );

  const updatedFiles = {
    ...files,
  };

  if (updatedSlugFiles.length === 0) {
    delete updatedFiles[slug];
  } else {
    updatedFiles[slug] =
      updatedSlugFiles;
  }

  saveFiles(updatedFiles);
}

export function deleteFilesForPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const files =
    getFiles();

  if (!files[slug]) {
    return;
  }

  const updatedFiles = {
    ...files,
  };

  delete updatedFiles[slug];

  saveFiles(updatedFiles);
}

export function clearFiles() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("filesUpdated")
  );
}