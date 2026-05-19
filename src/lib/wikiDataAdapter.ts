import {
  applyPagination,
  createErrorResult,
  createLocalStorageAdapterMeta,
  createSuccessListResult,
  createSuccessResult,
  matchesSearchQuery,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataAdapterQuery,
} from "./dataAdapter";

export type WikiAdapterPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  status: string;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  author?: string;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY =
  "dms_wiki_pages";

function dispatchWikiPagesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("wikiPagesUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `wiki-${crypto.randomUUID()}`;
  }

  return `wiki-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTags(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (item) =>
        String(item).trim()
    )
    .filter(Boolean);
}

function normalizePage(
  page: Partial<WikiAdapterPage>
): WikiAdapterPage {
  const now =
    new Date().toLocaleString();

  const title =
    page.title ||
    "Unbenannte Seite";

  return {
    id:
      page.id ||
      createId(),

    title,

    slug:
      page.slug ||
      createSlug(title),

    content:
      page.content ||
      "",

    category:
      page.category ||
      "Allgemein",

    status:
      page.status ||
      "published",

    companyId:
      page.companyId ||
      "",

    departmentId:
      page.departmentId ||
      "",

    company:
      page.company ||
      "Intern",

    department:
      page.department ||
      "Allgemein",

    author:
      page.author ||
      "",

    tags:
      normalizeTags(
        page.tags
      ),

    createdAt:
      page.createdAt ||
      now,

    updatedAt:
      page.updatedAt ||
      now,
  };
}

function getWikiPages(): WikiAdapterPage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (page) =>
        normalizePage(
          page
        )
    );
  } catch {
    return [];
  }
}

function saveWikiPages(
  pages: WikiAdapterPage[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      pages.map(
        (page) =>
          normalizePage(
            page
          )
      )
    )
  );

  dispatchWikiPagesUpdated();
}

function getWikiPageById(
  id: string
): WikiAdapterPage | null {
  return (
    getWikiPages().find(
      (page) =>
        page.id === id
    ) || null
  );
}

function createWikiPage(
  data: Omit<
    WikiAdapterPage,
    "id" | "createdAt" | "updatedAt"
  >
): WikiAdapterPage {
  const now =
    new Date().toLocaleString();

  const page =
    normalizePage({
      ...data,

      id:
        createId(),

      createdAt:
        now,

      updatedAt:
        now,
    });

  saveWikiPages([
    page,
    ...getWikiPages(),
  ]);

  return page;
}

function updateWikiPage(
  id: string,
  data: Partial<WikiAdapterPage>
): WikiAdapterPage | null {
  const pages =
    getWikiPages();

  let updatedPage:
    | WikiAdapterPage
    | null = null;

  const nextPages =
    pages.map(
      (page) => {
        if (page.id !== id) {
          return page;
        }

        updatedPage =
          normalizePage({
            ...page,
            ...data,

            id:
              page.id,

            createdAt:
              page.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        return updatedPage;
      }
    );

  saveWikiPages(
    nextPages
  );

  return updatedPage;
}

function deleteWikiPage(
  id: string
) {
  saveWikiPages(
    getWikiPages().filter(
      (page) =>
        page.id !== id
    )
  );
}

function filterWikiPages(
  pages: WikiAdapterPage[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return pages;
  }

  return pages.filter(
    (page) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            page.title,
            page.slug,
            page.content,
            page.category,
            page.company,
            page.department,
            page.author,
            page.tags?.join(" "),
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        page.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        page.departmentId === query.departmentId;

      const matchesStatus =
        !query.status ||
        page.status === query.status;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesStatus
      );
    }
  );
}

export const wikiLocalStorageAdapter: DataAdapter<WikiAdapterPage> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "wikiPage",
        STORAGE_KEY
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const pages =
          getWikiPages();

        const filteredPages =
          filterWikiPages(
            pages,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredPages,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Wiki-Seiten konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getWikiPageById(
            id
          )
        );
      } catch {
        return createErrorResult<WikiAdapterPage | null>(
          "Wiki-Seite konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const page =
          createWikiPage(
            data
          );

        return createSuccessResult(
          page
        );
      } catch {
        return createErrorResult<WikiAdapterPage>(
          "Wiki-Seite konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<WikiAdapterPage>
    ) {
      try {
        const page =
          updateWikiPage(
            id,
            data
          );

        return createSuccessResult(
          page
        );
      } catch {
        return createErrorResult<WikiAdapterPage | null>(
          "Wiki-Seite konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteWikiPage(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Wiki-Seite konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getWikiAdapter() {
  return wikiLocalStorageAdapter;
}