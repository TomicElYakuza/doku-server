import type {
  WikiPage,
  WikiStatus,
  WikiVisibility,
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
  status: string | null;
  visibility: string | null;
  pinned: boolean | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
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

function normalizeText(value: string | null) {
  return String(value || "").trim();
}

function normalizeStatus(value: string | null): WikiStatus {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }

  return "published";
}

function normalizeVisibility(value: string | null): WikiVisibility {
  if (value === "global" || value === "company" || value === "department") {
    return value;
  }

  return "company";
}

export function mapWikiPageRow(row: WikiPageRow): WikiPage {
  const description = normalizeText(row.description);

  return {
    slug: row.slug,
    title: row.title,
    description,
    excerpt: normalizeText(row.excerpt) || description,
    company: normalizeText(row.company) || "Intern",
    category: normalizeText(row.category),
    department: normalizeText(row.department),
    author: normalizeText(row.author) || "Unbekannt",
    tags: normalizeTags(row.tags),
    content: row.content || "",
    status: normalizeStatus(row.status),
    visibility: normalizeVisibility(row.visibility),
    pinned: Boolean(row.pinned),
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}
