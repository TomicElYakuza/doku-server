import type { TaxonomyItem } from "../../../types/taxonomy";

export type TaxonomyItemRow = {
  id: string;
  type: string;
  target: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

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

export function mapTaxonomyItemRow(row: TaxonomyItemRow): TaxonomyItem {
  return {
    id: String(row.id),
    type: row.type === "tag" ? "tag" : "category",
    target:
      row.target === "global"
        ? "global"
        : row.target === "news"
          ? "news"
          : row.target === "wiki"
            ? "wiki"
            : "ticket",
    name: normalizeText(row.name),
    slug: normalizeText(row.slug),
    description: normalizeText(row.description),
    color: normalizeText(row.color),
    parentId: row.parent_id ? String(row.parent_id) : "",
    sortOrder: Number(row.sort_order || 0),
    status:
      row.status === "inactive"
        ? "inactive"
        : row.status === "archived"
          ? "archived"
          : "active",
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}