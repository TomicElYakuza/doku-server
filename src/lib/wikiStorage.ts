export const STORAGE_KEY = "wiki-pages";

export function getStoredPages() {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(
    STORAGE_KEY
  );

  return data ? JSON.parse(data) : [];
}

export function savePages(pages: any[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(pages)
  );
}