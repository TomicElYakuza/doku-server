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

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeTags(tags: string[] | null) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

export function mapWikiPageRow(
  row: WikiPageRow,
): WikiPage {
  const description = normalizeText(row.description);
  const excerpt = normalizeText(row.excerpt) || description;

  return {
    slug: normalizeText(row.slug),
    title: normalizeText(row.title),
    description,
    excerpt,
    company: normalizeText(row.company) || "Intern",
    category: normalizeText(row.category),
    department: normalizeText(row.department),
    author: normalizeText(row.author) || "System",
    tags: normalizeTags(row.tags),
    content: String(row.content || ""),
    createdAt: new Date(row.created_at).toLocaleString(),
    updatedAt: new Date(row.updated_at).toLocaleString(),
  };
}