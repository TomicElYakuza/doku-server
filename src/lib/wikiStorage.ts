import { wikiPages } from "../data/wiki";

const STORAGE_KEY =
  "wiki-pages";

const INIT_KEY =
  "wiki-pages-initialized";

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
    return JSON.parse(data);
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

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(pages)
  );

  localStorage.setItem(
    INIT_KEY,
    "true"
  );
}

export function resetWikiInitialization() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(INIT_KEY);
}