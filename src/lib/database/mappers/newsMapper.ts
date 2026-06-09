import type { NewsPost } from "../../../types/news";

export type NewsPostRow = {
  id: string | number;
  title: string;
  description: string | null;
  excerpt?: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  pinned: boolean | null;
  published_at: string | Date | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

export type NewsRow = NewsPostRow;

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeDate(value: unknown) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function mapNewsPostRow(row: NewsPostRow): NewsPost {
  const description = normalizeText(row.description || row.excerpt);

  return {
    id: String(row.id),
    title: normalizeText(row.title),
    excerpt: description,
    description,
    content: normalizeText(row.content),
    category: normalizeText(row.category),
    author: normalizeText(row.author),
    pinned: Boolean(row.pinned),
    publishedAt: normalizeDate(row.published_at),
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}

export function mapNewsRow(row: NewsRow): NewsPost {
  return mapNewsPostRow(row);
}