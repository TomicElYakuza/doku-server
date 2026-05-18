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
    const parsed =
      JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(Boolean)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function saveRecentPages(
  slugs: string[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const safeSlugs =
    Array.isArray(slugs)
      ? slugs.filter(Boolean)
      : [];

  const uniqueSlugs = [
    ...new Set(safeSlugs),
  ].slice(0, MAX_RECENT);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(uniqueSlugs)
  );

  window.dispatchEvent(
    new Event("recentUpdated")
  );
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

  saveRecentPages(updatedRecent);
}

export function removeRecentPage(
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

  const updatedRecent =
    recentPages.filter(
      (item: string) =>
        item !== slug
    );

  saveRecentPages(updatedRecent);
}

export function clearRecentPages() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("recentUpdated")
  );
}