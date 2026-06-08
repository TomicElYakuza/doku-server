import type {
  Comment,
} from "../../../types/comment";

export type CommentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  author: string | null;
  content: string;
  created_at: string;
};

export function mapCommentRow(
  row: CommentRow
): Comment {
  return {
    id:
      row.id,

    entityType:
      row.entity_type,

    entityId:
      row.entity_id,

    author:
      row.author ||
      "Unbekannt",

    content:
      row.content,

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),
  };
}
