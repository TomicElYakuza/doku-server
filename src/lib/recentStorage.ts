const STORAGE_KEY = "wiki-recent";

const MAX_RECENT = 5;

export function getRecentPages() {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecentPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const recentPages =
    getRecentPages();

  const updatedRecent = [
    slug,
    ...recentPages.filter(
      (item: string) =>
        item !== slug
    ),
  ].slice(0, MAX_RECENT);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecent)
  );
}

export function removeRecentPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const recentPages =
    getRecentPages();

  const updatedRecent =
    recentPages.filter(
      (item: string) =>
        item !== slug
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedRecent)
  );
}

export function clearRecentPages() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}