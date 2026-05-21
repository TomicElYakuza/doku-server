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

export function mapWikiPageRow(
  row: WikiPageRow
): WikiPage {
  return {
    slug:
      row.slug,

    title:
      row.title,

    description:
      row.description ||
      "",

    excerpt:
      row.excerpt ||
      row.description ||
      "",

    company:
      row.company ||
      "Intern",

    category:
      row.category ||
      "Allgemein",

    department:
      row.department ||
      row.category ||
      "Allgemein",

    author:
      row.author ||
      "Unbekannt",

    tags:
      Array.isArray(
        row.tags
      )
        ? row.tags
        : [],

    content:
      row.content ||
      "",

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}