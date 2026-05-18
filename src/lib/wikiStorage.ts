import { wikiPages } from "../data/wiki";

const STORAGE_KEY = "wiki-pages";

const INIT_KEY = "wiki-pages-initialized";

export function getStoredPages() {
  if (typeof window === "undefined") {
    return [];
  }

  const initialized =
    localStorage.getItem(INIT_KEY);

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!initialized) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wikiPages)
    );

    localStorage.setItem(
      INIT_KEY,
      "true"
    );

    return wikiPages;
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

    return parsed;
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
    Array.isArray(pages)
      ? pages
      : [];

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