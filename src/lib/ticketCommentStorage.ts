export type TicketComment = {
  id: string;
  ticketId: string;
  text: string;
  author: string;
  authorEmail?: string;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  createdAt: string;
  updatedAt: string;
};

type OrganizationReference = {
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
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

function normalizeOrganizationReference(
  reference: OrganizationReference
): OrganizationReference {
  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    company:
      reference.company || "Intern",

    department:
      reference.department || "Allgemein",
  };
}

function normalizeTicketComment(
  comment: Partial<TicketComment>
): TicketComment {
  const now =
    new Date().toLocaleString();

  const organization =
    normalizeOrganizationReference({
      companyId:
        comment.companyId,

      departmentId:
        comment.departmentId,

      company:
        comment.company,

      department:
        comment.department,
    });

  return {
    id:
      comment.id ||
      createId(),

    ticketId:
      comment.ticketId ||
      "",

    text:
      comment.text ||
      "",

    author:
      comment.author ||
      "Unbekannt",

    authorEmail:
      comment.authorEmail ||
      "",

    companyId:
      organization.companyId,

    departmentId:
      organization.departmentId,

    company:
      organization.company,

    department:
      organization.department,

    createdAt:
      comment.createdAt ||
      now,

    updatedAt:
      comment.updatedAt ||
      now,
  };
}

export function getTicketComments(): TicketComment[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (comment) =>
        normalizeTicketComment(
          comment
        )
    );
  } catch {
    return [];
  }
}

export function saveTicketComments(
  comments: TicketComment[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedComments =
    comments.map(
      (comment) =>
        normalizeTicketComment(
          comment
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedComments
    )
  );

  dispatchTicketCommentsUpdated();
}

export function clearTicketComments() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchTicketCommentsUpdated();
}

export function getTicketCommentsByTicketId(
  ticketId: string
) {
  return getTicketComments()
    .filter(
      (comment) =>
        comment.ticketId === ticketId
    )
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    );
}

export function getTicketCommentById(
  id: string
): TicketComment | null {
  return (
    getTicketComments().find(
      (comment) =>
        comment.id === id
    ) || null
  );
}

export function createTicketComment(
  comment: Omit<
    TicketComment,
    "id" | "createdAt" | "updatedAt"
  >
): TicketComment {
  const comments =
    getTicketComments();

  const now =
    new Date().toLocaleString();

  const newComment =
    normalizeTicketComment({
      ...comment,

      id:
        createId(),

      createdAt:
        now,

      updatedAt:
        now,
    });

  saveTicketComments([
    newComment,
    ...comments,
  ]);

  return newComment;
}

export function updateTicketComment(
  id: string,
  updates: Partial<TicketComment>
): TicketComment | null {
  const comments =
    getTicketComments();

  let updatedComment:
    | TicketComment
    | null = null;

  const updatedComments =
    comments.map(
      (comment) => {
        if (comment.id !== id) {
          return comment;
        }

        const nextComment =
          normalizeTicketComment({
            ...comment,
            ...updates,

            id:
              comment.id,

            createdAt:
              comment.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        updatedComment =
          nextComment;

        return nextComment;
      }
    );

  saveTicketComments(
    updatedComments
  );

  return updatedComment;
}

export function deleteTicketComment(
  id: string
) {
  const comments =
    getTicketComments();

  saveTicketComments(
    comments.filter(
      (comment) =>
        comment.id !== id
    )
  );
}

export function deleteTicketCommentsByTicketId(
  ticketId: string
) {
  const comments =
    getTicketComments();

  saveTicketComments(
    comments.filter(
      (comment) =>
        comment.ticketId !== ticketId
    )
  );
}

export function getTicketCommentCount(
  ticketId: string
) {
  return getTicketCommentsByTicketId(
    ticketId
  ).length;
}

export function getTicketCommentsByCompanyId(
  companyId: string
) {
  return getTicketComments().filter(
    (comment) =>
      comment.companyId === companyId
  );
}

export function getTicketCommentsByDepartmentId(
  departmentId: string
) {
  return getTicketComments().filter(
    (comment) =>
      comment.departmentId === departmentId
  );
}