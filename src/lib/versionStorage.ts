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

export function saveVersions(
  versions: any
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(versions)
  );

  window.dispatchEvent(
    new Event("versionsUpdated")
  );
}

export function saveVersion(
  slug: string,
  version: any
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const versions =
    getVersions();

  const currentVersions =
    versions[slug] || [];

  const newVersion = {
    ...version,

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