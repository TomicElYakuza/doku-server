import type { NewsPost } from "../../../types/news";

export type NewsRow = {
  id: number | string;
  title: string;
  description: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  pinned: boolean | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
};

export function mapNewsRow(row: NewsRow): NewsPost {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    content: row.content || "",
    category: row.category || "",
    author: row.author || "Unbekannt",
    pinned: Boolean(row.pinned),
    createdAt: new Date(row.created_at).toLocaleString(),
  };
}
