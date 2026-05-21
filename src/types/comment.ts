export type Comment = {
  id: string;
  entityType: string;
  entityId: string;
  author: string;
  content: string;
  createdAt: string;
};

export type CommentCreateInput = Omit<
  Comment,
  "id" | "createdAt"
>;

export type CommentUpdateInput =
  Partial<
    Pick<
      Comment,
      "author" | "content"
    >
  >;