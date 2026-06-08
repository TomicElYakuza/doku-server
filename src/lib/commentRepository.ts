import {
  requestJson,
} from "./apiClient";

import type {
  Comment,
  CommentCreateInput,
} from "../types/comment";

export type CommentRepository = {
  list: () => Promise<Comment[]>;
  listByEntity: (
    entityType: string,
    entityId: string
  ) => Promise<Comment[]>;
  create: (comment: CommentCreateInput) => Promise<Comment>;
  delete: (id: string) => Promise<void>;
  countByEntity: (
    entityType: string,
    entityId: string
  ) => Promise<number>;
};

function dispatchCommentsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "commentsUpdated"
    )
  );
}

export const postgresCommentRepository: CommentRepository = {
  async list() {
    return requestJson<Comment[]>(
      "/api/comments"
    );
  },

  async listByEntity(
    entityType: string,
    entityId: string
  ) {
    return requestJson<Comment[]>(
      `/api/comments?entityType=${encodeURIComponent(
        entityType
      )}&entityId=${encodeURIComponent(
        entityId
      )}`
    );
  },

  async create(
    comment: CommentCreateInput
  ) {
    const createdComment =
      await requestJson<Comment>(
        "/api/comments",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              comment
            ),
        }
      );

    dispatchCommentsUpdated();

    return createdComment;
  },

  async delete(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/comments/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchCommentsUpdated();
  },

  async countByEntity(
    entityType: string,
    entityId: string
  ) {
    const comments =
      await postgresCommentRepository.listByEntity(
        entityType,
        entityId
      );

    return comments.length;
  },
};

export const commentRepository =
  postgresCommentRepository;
