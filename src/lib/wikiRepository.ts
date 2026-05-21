import {
  requestJson,
} from "./apiClient";

import type {
  WikiCreateInput,
  WikiPage,
  WikiUpdateInput,
} from "../types/wiki";

export type WikiRepository = {
  list: () => Promise<WikiPage[]>;
  search: (query: string) => Promise<WikiPage[]>;
  findBySlug: (slug: string) => Promise<WikiPage | null>;
  create: (page: WikiCreateInput) => Promise<WikiPage>;
  update: (
    slug: string,
    updates: WikiUpdateInput
  ) => Promise<WikiPage | null>;
  delete: (slug: string) => Promise<void>;
  saveAll: (pages: WikiPage[]) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => Promise<void>;
  resetInitialization: () => Promise<void>;

  listByCategory: (category: string) => Promise<WikiPage[]>;
  listByCompany: (company: string) => Promise<WikiPage[]>;
  listByDepartment: (department: string) => Promise<WikiPage[]>;
  listByTag: (tag: string) => Promise<WikiPage[]>;
  listCategories: () => Promise<string[]>;
  listTags: () => Promise<string[]>;

  countAll: () => Promise<number>;
};

function dispatchWikiPagesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "wikiPagesUpdated"
    )
  );
}

function pageMatchesQuery(
  page: WikiPage,
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    page.slug,
    page.title,
    page.content,
    page.excerpt,
    page.description,
    page.category,
    page.company,
    page.department,
    page.tags?.join(" "),
    page.createdAt,
    page.updatedAt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedQuery
  );
}

export const postgresWikiRepository: WikiRepository = {
  async list() {
    return requestJson<WikiPage[]>(
      "/api/wiki-pages"
    );
  },

  async search(
    query: string
  ) {
    const pages =
      await postgresWikiRepository.list();

    return pages.filter(
      (page) =>
        pageMatchesQuery(
          page,
          query
        )
    );
  },

  async findBySlug(
    slug: string
  ) {
    if (!slug) {
      return null;
    }

    try {
      return await requestJson<WikiPage>(
        `/api/wiki-pages/${encodeURIComponent(
          slug
        )}`
      );
    } catch {
      return null;
    }
  },

  async create(
    page: WikiCreateInput
  ) {
    const createdPage =
      await requestJson<WikiPage>(
        "/api/wiki-pages",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              page
            ),
        }
      );

    dispatchWikiPagesUpdated();

    return createdPage;
  },

  async update(
    slug: string,
    updates: WikiUpdateInput
  ) {
    if (!slug) {
      return null;
    }

    const updatedPage =
      await requestJson<WikiPage>(
        `/api/wiki-pages/${encodeURIComponent(
          slug
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

    dispatchWikiPagesUpdated();

    return updatedPage;
  },

  async delete(
    slug: string
  ) {
    if (!slug) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/wiki-pages/${encodeURIComponent(
        slug
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchWikiPagesUpdated();
  },

  async saveAll(
    pages: WikiPage[]
  ) {
    await Promise.all(
      pages.map(
        async (page) => {
          if (page.slug) {
            await postgresWikiRepository.update(
              page.slug,
              page
            );

            return;
          }

          await postgresWikiRepository.create(
            page
          );
        }
      )
    );

    dispatchWikiPagesUpdated();
  },

  async clear() {
    throw new Error(
      "clear ist für PostgreSQL-Wiki nicht direkt verfügbar."
    );
  },

  async reset() {
    throw new Error(
      "reset ist für PostgreSQL-Wiki nicht direkt verfügbar."
    );
  },

  async resetInitialization() {
    return;
  },

  async listByCategory(
    category: string
  ) {
    return requestJson<WikiPage[]>(
      `/api/wiki-pages?category=${encodeURIComponent(
        category
      )}`
    );
  },

  async listByCompany(
    company: string
  ) {
    return requestJson<WikiPage[]>(
      `/api/wiki-pages?company=${encodeURIComponent(
        company
      )}`
    );
  },

  async listByDepartment(
    department: string
  ) {
    return requestJson<WikiPage[]>(
      `/api/wiki-pages?department=${encodeURIComponent(
        department
      )}`
    );
  },

  async listByTag(
    tag: string
  ) {
    return requestJson<WikiPage[]>(
      `/api/wiki-pages?tag=${encodeURIComponent(
        tag
      )}`
    );
  },

  async listCategories() {
    const pages =
      await postgresWikiRepository.list();

    return Array.from(
      new Set(
        pages.map(
          (page) =>
            String(
              page.category ||
                page.department ||
                "Allgemein"
            )
        )
      )
    );
  },

  async listTags() {
    const pages =
      await postgresWikiRepository.list();

    return Array.from(
      new Set(
        pages.flatMap(
          (page) =>
            page.tags ||
            []
        )
      )
    );
  },

  async countAll() {
    const pages =
      await postgresWikiRepository.list();

    return pages.length;
  },
};

export const wikiRepository =
  postgresWikiRepository;