export type TaxonomyType =
  | "category"
  | "tag";

export type TaxonomyTarget =
  | "ticket"
  | "wiki"
  | "global";

export type TaxonomyStatus =
  | "active"
  | "inactive"
  | "archived";

export type TaxonomyItem = {
  id: string;
  type: TaxonomyType;
  target: TaxonomyTarget;
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
  status: TaxonomyStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaxonomyCreateInput = Omit<
  TaxonomyItem,
  "id" | "createdAt" | "updatedAt"
>;

export type TaxonomyUpdateInput = Partial<
  Omit<
    TaxonomyItem,
    "id" | "createdAt" | "updatedAt"
  >
>;