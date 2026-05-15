const STORAGE_KEY = "wiki-favorites";

export function getFavorites() {
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

    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

export function saveFavorites(
  favorites: string[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const safeFavorites =
    Array.isArray(favorites)
      ? favorites.filter(Boolean)
      : [];

  const uniqueFavorites = [
    ...new Set(safeFavorites),
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(uniqueFavorites)
  );

  window.dispatchEvent(
    new Event("favoritesUpdated")
  );
}

export function addFavorite(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const favorites =
    getFavorites();

  if (favorites.includes(slug)) {
    return;
  }

  saveFavorites([
    ...favorites,
    slug,
  ]);
}

export function removeFavorite(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const favorites =
    getFavorites();

  const updatedFavorites =
    favorites.filter(
      (item: string) =>
        item !== slug
    );

  saveFavorites(updatedFavorites);
}

export function clearFavorites() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("favoritesUpdated")
  );
}