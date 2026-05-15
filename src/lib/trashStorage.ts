const STORAGE_KEY = "wiki-trash";

export function getTrashPages() {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveTrashPage(page: any) {
  if (typeof window === "undefined") {
    return;
  }

  const trashPages =
    getTrashPages();

  const trashPage = {
    ...page,
    deletedAt:
      new Date().toLocaleString(),
  };

  const updatedTrash = [
    trashPage,
    ...trashPages.filter(
      (item: any) =>
        item.slug !== page.slug
    ),
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedTrash)
  );
}

export function removeTrashPage(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trashPages =
    getTrashPages();

  const updatedTrash =
    trashPages.filter(
      (page: any) =>
        page.slug !== slug
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedTrash)
  );
}