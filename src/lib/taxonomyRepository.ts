import {
  requestJson,
} from "./apiClient";

import type {
  TaxonomyCreateInput,
  TaxonomyItem,
  TaxonomyTarget,
  TaxonomyType,
  TaxonomyUpdateInput,
} from "../types/taxonomy";

export type TaxonomyRepository = {
  list: () => Promise<TaxonomyItem[]>;
  listByTarget: (target: TaxonomyTarget) => Promise<TaxonomyItem[]>;
  listByType: (type: TaxonomyType) => Promise<TaxonomyItem[]>;
  listByTargetAndType: (
    target: TaxonomyTarget,
    type: TaxonomyType
  ) => Promise<TaxonomyItem[]>;
  listActiveByTargetAndType: (
    target: TaxonomyTarget,
    type: TaxonomyType
  ) => Promise<TaxonomyItem[]>;
  create: (item: TaxonomyCreateInput) => Promise<TaxonomyItem>;
  update: (
    id: string,
    updates: TaxonomyUpdateInput
  ) => Promise<TaxonomyItem | null>;
  delete: (id: string) => Promise<void>;
  getPathLabel: (
    itemId: string,
    items: TaxonomyItem[]
  ) => string;
};

function dispatchTaxonomyUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "taxonomyUpdated"
    )
  );
}

function buildQuery(
  params: Record<string, string>
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(
    params
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (value) {
        searchParams.set(
          key,
          value
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}

export const taxonomyRepository: TaxonomyRepository = {
  async list() {
    return requestJson<TaxonomyItem[]>(
      "/api/taxonomy"
    );
  },

  async listByTarget(
    target: TaxonomyTarget
  ) {
    return requestJson<TaxonomyItem[]>(
      `/api/taxonomy${buildQuery({
        target,
      })}`
    );
  },

  async listByType(
    type: TaxonomyType
  ) {
    return requestJson<TaxonomyItem[]>(
      `/api/taxonomy${buildQuery({
        type,
      })}`
    );
  },

  async listByTargetAndType(
    target: TaxonomyTarget,
    type: TaxonomyType
  ) {
    return requestJson<TaxonomyItem[]>(
      `/api/taxonomy${buildQuery({
        target,
        type,
      })}`
    );
  },

  async listActiveByTargetAndType(
    target: TaxonomyTarget,
    type: TaxonomyType
  ) {
    return requestJson<TaxonomyItem[]>(
      `/api/taxonomy${buildQuery({
        target,
        type,
        status:
          "active",
      })}`
    );
  },

  async create(
    item: TaxonomyCreateInput
  ) {
    const createdItem =
      await requestJson<TaxonomyItem>(
        "/api/taxonomy",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              item
            ),
        }
      );

    dispatchTaxonomyUpdated();

    return createdItem;
  },

  async update(
    id: string,
    updates: TaxonomyUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedItem =
      await requestJson<TaxonomyItem>(
        `/api/taxonomy/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    dispatchTaxonomyUpdated();

    return updatedItem;
  },

  async delete(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/taxonomy/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchTaxonomyUpdated();
  },

  getPathLabel(
    itemId: string,
    items: TaxonomyItem[]
  ) {
    const item =
      items.find(
        (currentItem) =>
          currentItem.id === itemId
      );

    if (!item) {
      return "";
    }

    const path = [
      item.name,
    ];

    let currentParentId =
      item.parentId;

    let guard =
      0;

    while (
      currentParentId &&
      guard < 20
    ) {
      const parent =
        items.find(
          (currentItem) =>
            currentItem.id === currentParentId
        );

      if (!parent) {
        break;
      }

      path.unshift(
        parent.name
      );

      currentParentId =
        parent.parentId;

      guard +=
        1;
    }

    return path.join(
      " > "
    );
  },
};
