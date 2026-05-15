const STORAGE_KEY = "wiki-comments";

export function getComments() {
  if (typeof window === "undefined") {
    return {};
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return {};
  }

  try {
    const parsed = JSON.parse(data);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveComments(
  comments: any
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(comments)
  );

  window.dispatchEvent(
    new Event("commentsUpdated")
  );
}

export function saveComment(
  slug: string,
  comment: any
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!slug) {
    return;
  }

  const comments =
    getComments();

  const currentComments =
    comments[slug] || [];

  const updatedComments = {
    ...comments,

    [slug]: [
      ...currentComments,
      {
        ...comment,

        createdAt:
          comment.createdAt ||
          new Date().toLocaleString(),
      },
    ],
  };

  saveComments(updatedComments);
}

export function deleteComment(
  slug: string,
  index: number
) {
  if (typeof window === "undefined") {
    return;
  }

  const comments =
    getComments();

  const currentComments =
    comments[slug] || [];

  const updatedSlugComments =
    currentComments.filter(
      (_comment: any, commentIndex: number) =>
        commentIndex !== index
    );

  const updatedComments = {
    ...comments,
  };

  if (updatedSlugComments.length === 0) {
    delete updatedComments[slug];
  } else {
    updatedComments[slug] =
      updatedSlugComments;
  }

  saveComments(updatedComments);
}

export function deleteCommentsForPage(
  slug: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const comments =
    getComments();

  if (!comments[slug]) {
    return;
  }

  const updatedComments = {
    ...comments,
  };

  delete updatedComments[slug];

  saveComments(updatedComments);
}

export function clearComments() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("commentsUpdated")
  );
}