const STORAGE_KEY = "wiki-versions";

const MAX_VERSIONS_PER_PAGE = 50;

export function getVersions() {
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

export function saveVersions(
  versions: any
) {
  if (typeof window === "undefined") {
    return;
  }

  const safeVersions =
    versions &&
    typeof versions === "object" &&
    !Array.isArray(versions)
      ? versions
      : {};

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeVersions)
  );

  window.dispatchEvent(
    new Event("versionsUpdated")
  );
}

export function getVersionsForPage(
  slug: string
) {
  if (!slug) {
    return [];
  }

  const versions =
    getVersions();

  const pageVersions =
    versions[slug];

  if (!Array.isArray(pageVersions)) {
    return [];
  }

  return pageVersions;
}

export function saveVersion(
  slug: string,
  version: any
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug || !version) {
    return;
  }

  const versions =
    getVersions();

  const currentVersions =
    getVersionsForPage(slug);

  const newVersion = {
    title:
      version.title || "Ohne Titel",

    category:
      version.category || "Allgemein",

    description:
      version.description || "",

    tags:
      Array.isArray(version.tags)
        ? version.tags
        : [],

    content:
      version.content || "",

    updatedAt:
      version.updatedAt || "",

    savedAt:
      version.savedAt ||
      new Date().toLocaleString(),
  };

  const updatedVersions = {
    ...versions,

    [slug]: [
      ...currentVersions,
      newVersion,
    ].slice(-MAX_VERSIONS_PER_PAGE),
  };

  saveVersions(updatedVersions);
}

export function deleteVersionsForPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const versions =
    getVersions();

  if (!versions[slug]) {
    return;
  }

  const updatedVersions = {
    ...versions,
  };

  delete updatedVersions[slug];

  saveVersions(updatedVersions);
}

export function clearVersions() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("versionsUpdated")
  );
}