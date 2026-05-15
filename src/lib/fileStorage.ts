const STORAGE_KEY =
  "wiki-files";

export function getFiles() {
  if (typeof window === "undefined") {
    return {};
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data
    ? JSON.parse(data)
    : {};
}

export function saveFile(
  slug: string,
  file: any
) {
  const files = getFiles();

  if (!files[slug]) {
    files[slug] = [];
  }

  files[slug].push(file);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(files)
  );
}

export function deleteFile(
  slug: string,
  index: number
) {
  const files = getFiles();

  if (!files[slug]) {
    return;
  }

  files[slug] = files[slug].filter(
    (
      _: any,
      i: number
    ) => i !== index
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(files)
  );
}