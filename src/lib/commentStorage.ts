const STORAGE_KEY = "wiki-comments";

export function getComments() {
  if (typeof window === "undefined") {
    return {};
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data
    ? JSON.parse(data)
    : {};
}

export function saveComment(
  slug: string,
  comment: any
) {
  const comments = getComments();

  if (!comments[slug]) {
    comments[slug] = [];
  }

  comments[slug].push(comment);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(comments)
  );
}

export function deleteComment(
  slug: string,
  index: number
) {
  const comments = getComments();

  if (!comments[slug]) {
    return;
  }

  comments[slug] = comments[slug].filter(
    (_: any, i: number) => i !== index
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(comments)
  );
}