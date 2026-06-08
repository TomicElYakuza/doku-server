import type { TaxonomyItem } from "../../../types/taxonomy";

export type TaxonomyItemRow = {
  id: string;
  type: string;
  target: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export function mapTaxonomyItemRow(row: TaxonomyItemRow): TaxonomyItem {
  return {
    id: String(row.id),
    type: row.type === "tag" ? "tag" : "category",
    target:
      row.target === "wiki" ||
      row.target === "news" ||
      row.target === "global"
        ? row.target
        : "ticket",
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    parentId: row.parent_id || "",
    sortOrder: Number(row.sort_order || 0),
    status:
      row.status === "inactive" || row.status === "archived"
        ? row.status
        : "active",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
