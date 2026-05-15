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
    const parsed = JSON.parse(data);

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

export function saveFiles(
  files: any
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(files)
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

  const files = getFiles();

  return files[slug] || [];
}

export function saveFile(
  slug: string,
  file: any
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
    files[slug] || [];

  const updatedFiles = {
    ...files,

    [slug]: [
      ...currentFiles,
      {
        ...file,

        uploadedAt:
          file.uploadedAt ||
          new Date().toLocaleString(),
      },
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

  const files =
    getFiles();

  const currentFiles =
    files[slug] || [];

  const updatedSlugFiles =
    currentFiles.filter(
      (_file: any, fileIndex: number) =>
        fileIndex !== index
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