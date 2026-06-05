import type {
  TaxonomyItem,
  TaxonomyStatus,
  TaxonomyTarget,
  TaxonomyType,
} from "../../../types/taxonomy";

export type TaxonomyItemRow = {
  id: string | number;
  type: string;
  target: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | number | null;
  sort_order: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapTaxonomyItemRow(
  row: TaxonomyItemRow
): TaxonomyItem {
  return {
    id:
      String(
        row.id
      ),

    type:
      row.type as TaxonomyType,

    target:
      row.target as TaxonomyTarget,

    name:
      row.name,

    slug:
      row.slug,

    description:
      row.description ||
      "",

    parentId:
      row.parent_id
        ? String(
            row.parent_id
          )
        : "",

    sortOrder:
      Number(
        row.sort_order ||
          0
      ),

    status:
      row.status as TaxonomyStatus,

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