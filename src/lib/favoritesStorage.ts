const STORAGE_KEY = "wiki-favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveFavorites(
  favorites: string[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(favorites)
  );
}