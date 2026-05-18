import { wikiPages } from "../data/wiki";

const STORAGE_KEY = "wiki-pages";

const INIT_KEY = "wiki-pages-initialized";

function normalizePage(page: any) {
  return {
    ...page,

    company:
      page.company ||
      "Intern",

    category:
      page.category ||
      "Allgemein",

    tags:
      Array.isArray(page.tags)
        ? page.tags
        : [],
  };
}

function normalizePages(pages: any[]) {
  if (!Array.isArray(pages)) {
    return [];
  }

  return pages.map(
    (page) =>
      normalizePage(page)
  );
}

export function getStoredPages() {
  if (typeof window === "undefined") {
    return [];
  }

  const initialized =
    localStorage.getItem(INIT_KEY);

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!initialized) {
    const normalizedInitialPages =
      normalizePages(wikiPages);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalizedInitialPages
      )
    );

    localStorage.setItem(
      INIT_KEY,
      "true"
    );

    return normalizedInitialPages;
  }

  if (!data) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedPages =
      normalizePages(parsed);

    return normalizedPages;
  } catch {
    return [];
  }
}

export function savePages(
  pages: any[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const safePages =
    normalizePages(
      Array.isArray(pages)
        ? pages
        : []
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safePages)
  );

  localStorage.setItem(
    INIT_KEY,
    "true"
  );

  window.dispatchEvent(
    new Event("wikiPagesUpdated")
  );
}

export function clearPages() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("wikiPagesUpdated")
  );
}

export function resetWikiInitialization() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    INIT_KEY
  );

  window.dispatchEvent(
    new Event("wikiPagesUpdated")
  );
}

export function resetWikiPages() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  localStorage.removeItem(
    INIT_KEY
  );

  window.dispatchEvent(
    new Event("wikiPagesUpdated")
  );
}