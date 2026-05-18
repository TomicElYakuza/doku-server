const STORAGE_KEY = "wiki-trash";

export function getTrashPages() {
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

    return parsed;
  } catch {
    return [];
  }
}

export function saveTrashPages(
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

  window.dispatchEvent(
    new Event("trashUpdated")
  );
}

export function addTrashPage(
  page: any
) {
  if (typeof window === "undefined") {
    return [];
  }

  if (!page || !page.slug) {
    return getTrashPages();
  }

  const currentTrash =
    getTrashPages();

  const trashPage = {
    ...page,

    deletedAt:
      page.deletedAt ||
      new Date().toLocaleString(),
  };

  const updatedTrash = [
    trashPage,

    ...currentTrash.filter(
      (item: any) =>
        item.slug !== page.slug
    ),
  ];

  saveTrashPages(updatedTrash);

  return updatedTrash;
}

export function removeTrashPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return [];
  }

  if (!slug) {
    return getTrashPages();
  }

  const currentTrash =
    getTrashPages();

  const updatedTrash =
    currentTrash.filter(
      (page: any) =>
        page.slug !== slug
    );

  saveTrashPages(updatedTrash);

  return updatedTrash;
}

export function clearTrashPages() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("trashUpdated")
  );
}