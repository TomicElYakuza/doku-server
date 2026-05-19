export type TicketComment = {
  id: string;
  ticketId: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
};

const STORAGE_KEY =
  "dms_ticket_comments";

function dispatchTicketCommentsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("ticketCommentsUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function getTicketComments(): Record<string, TicketComment[]> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(raw);

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

export function saveTicketComments(
  comments: Record<string, TicketComment[]>
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      comments
    )
  );

  dispatchTicketCommentsUpdated();
}

export function getTicketCommentsByTicketId(
  ticketId: string
): TicketComment[] {
  const comments =
    getTicketComments();

  return comments[ticketId] || [];
}

export function addTicketComment(
  ticketId: string,
  text: string,
  author: string
): TicketComment | null {
  if (!ticketId || !text.trim()) {
    return null;
  }

  const comments =
    getTicketComments();

  const newComment: TicketComment = {
    id:
      createId(),

    ticketId,

    text:
      text.trim(),

    author:
      author || "Unbekannt",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      "",
  };

  const currentComments =
    comments[ticketId] || [];

  const updatedComments = {
    ...comments,

    [ticketId]: [
      newComment,
      ...currentComments,
    ],
  };

  saveTicketComments(
    updatedComments
  );

  return newComment;
}

export function updateTicketComment(
  ticketId: string,
  commentId: string,
  text: string
): TicketComment | null {
  if (
    !ticketId ||
    !commentId ||
    !text.trim()
  ) {
    return null;
  }

  const comments =
    getTicketComments();

  const currentComments =
    comments[ticketId] || [];

  let updatedComment:
    | TicketComment
    | null = null;

  const updatedTicketComments =
    currentComments.map(
      (comment) => {
        if (comment.id !== commentId) {
          return comment;
        }

        updatedComment = {
          ...comment,

          text:
            text.trim(),

          updatedAt:
            new Date().toLocaleString(),
        };

        return updatedComment;
      }
    );

  const updatedComments = {
    ...comments,

    [ticketId]:
      updatedTicketComments,
  };

  saveTicketComments(
    updatedComments
  );

  return updatedComment;
}

export function deleteTicketComment(
  ticketId: string,
  commentId: string
) {
  const comments =
    getTicketComments();

  const currentComments =
    comments[ticketId] || [];

  const updatedTicketComments =
    currentComments.filter(
      (comment) =>
        comment.id !== commentId
    );

  const updatedComments = {
    ...comments,

    [ticketId]:
      updatedTicketComments,
  };

  saveTicketComments(
    updatedComments
  );
}

export function deleteAllTicketComments(
  ticketId: string
) {
  const comments =
    getTicketComments();

  const updatedComments = {
    ...comments,
  };

  delete updatedComments[ticketId];

  saveTicketComments(
    updatedComments
  );
}

export function getTicketCommentCount(
  ticketId: string
) {
  return getTicketCommentsByTicketId(
    ticketId
  ).length;
}