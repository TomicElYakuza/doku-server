import type {
  NewsCategory,
  NewsPost,
} from "../../../types/news";

export type NewsRow = {
  id: number | string;
  title: string;
  description: string | null;
  content: string | null;
  category: string;
  author: string | null;
  pinned: boolean;
  created_at: string;
};

export function mapNewsRow(
  row: NewsRow
): NewsPost {
  return {
    id:
      String(
        row.id
      ),

    title:
      row.title,

    description:
      row.description ||
      "",

    content:
      row.content ||
      "",

    category:
      row.category as NewsCategory,

    author:
      row.author ||
      "Unbekannt",

    pinned:
      Boolean(
        row.pinned
      ),

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),
  };
}