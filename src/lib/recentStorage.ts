const STORAGE_KEY = "wiki-recent";

export function getRecentPages(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveRecentPage(
  slug: string
) {
  const current = getRecentPages();

  const updated = [
    slug,
    ...current.filter(
      (item) => item !== slug
    ),
  ].slice(0, 5);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
}