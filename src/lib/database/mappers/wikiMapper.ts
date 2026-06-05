import type {
  WikiPage,
} from "../../../types/wiki";

export type WikiPageRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  excerpt: string | null;
  company: string | null;
  category: string | null;
  department: string | null;
  author: string | null;
  tags: string[] | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function normalizeTags(tags: string[] | null) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

export function mapWikiPageRow(
  row: WikiPageRow,
): WikiPage {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    excerpt: row.excerpt || row.description || "",
    company: row.company || "Intern",
    category: row.category || "",
    department: row.department || "Allgemein",
    author: row.author || "Unbekannt",
    tags: normalizeTags(row.tags),
    content: row.content || "",
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}