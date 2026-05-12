const STORAGE_KEY = "wiki-versions";

export function getVersions() {
  if (typeof window === "undefined") {
    return {};
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : {};
}

export function saveVersion(
  slug: string,
  version: any
) {
  const versions = getVersions();

  if (!versions[slug]) {
    versions[slug] = [];
  }

  versions[slug].push(version);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(versions)
  );
}