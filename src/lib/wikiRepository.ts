import {
  clearPages,
  getStoredPages,
  resetWikiInitialization,
  resetWikiPages,
  savePages,
} from "./wikiStorage";

export type WikiPage = {
  slug?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  company?: string;
  department?: string;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type WikiCreateInput =
  WikiPage;

export type WikiUpdateInput =
  Partial<WikiPage>;

export type WikiRepository = {
  list: () => WikiPage[];
  search: (query: string) => WikiPage[];
  findBySlug: (slug: string) => WikiPage | null;
  create: (page: WikiCreateInput) => WikiPage;
  update: (
    slug: string,
    updates: WikiUpdateInput
  ) => WikiPage | null;
  delete: (slug: string) => void;
  saveAll: (pages: WikiPage[]) => void;
  clear: () => void;
  reset: () => void;
  resetInitialization: () => void;

  listByCategory: (category: string) => WikiPage[];
  listByCompany: (company: string) => WikiPage[];
  listByDepartment: (department: string) => WikiPage[];
  listByTag: (tag: string) => WikiPage[];
  listCategories: () => string[];
  listTags: () => string[];

  countAll: () => number;
};

function normalizeSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
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

function normalizePage(
  page: WikiPage
): WikiPage {
  const now =
    new Date().toLocaleString();

  const title =
    String(
      page.title ||
        "Unbenannte Seite"
    );

  return {
    ...page,

    slug:
      page.slug ||
      createSlug(
        title
      ),

    title,

    content:
      page.content ||
      "",

    excerpt:
      page.excerpt ||
      "",

    category:
      page.category ||
      "Allgemein",

    company:
      page.company ||
      "Intern",

    department:
      page.department ||
      "Allgemein",

    tags:
      Array.isArray(
        page.tags
      )
        ? page.tags
        : [],

    createdAt:
      page.createdAt ||
      now,

    updatedAt:
      page.updatedAt ||
      now,
  };
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

export const localWikiRepository: WikiRepository = {
  list() {
    return getStoredPages() as WikiPage[];
  },

  search(
    query: string
  ) {
    return localWikiRepository
      .list()
      .filter(
        (page) =>
          pageMatchesQuery(
            page,
            query
          )
      );
  },

  findBySlug(
    slug: string
  ) {
    const normalizedSlug =
      normalizeSlug(
        slug
      );

    return (
      localWikiRepository
        .list()
        .find(
          (page) =>
            normalizeSlug(
              String(
                page.slug ||
                  ""
              )
            ) === normalizedSlug
        ) || null
    );
  },

  create(
    page: WikiCreateInput
  ) {
    const pages =
      localWikiRepository.list();

    const newPage =
      normalizePage(
        page
      );

    savePages([
      newPage,
      ...pages,
    ]);

    return newPage;
  },

  update(
    slug: string,
    updates: WikiUpdateInput
  ) {
    let updatedPage:
      | WikiPage
      | null =
      null;

    const normalizedSlug =
      normalizeSlug(
        slug
      );

    const updatedPages =
      localWikiRepository
        .list()
        .map(
          (page) => {
            if (
              normalizeSlug(
                String(
                  page.slug ||
                    ""
                )
              ) !== normalizedSlug
            ) {
              return page;
            }

            const nextPage =
              normalizePage({
                ...page,
                ...updates,
                slug:
                  page.slug,
                createdAt:
                  page.createdAt,
                updatedAt:
                  new Date().toLocaleString(),
              });

            updatedPage =
              nextPage;

            return nextPage;
          }
        );

    savePages(
      updatedPages
    );

    return updatedPage;
  },

  delete(
    slug: string
  ) {
    const normalizedSlug =
      normalizeSlug(
        slug
      );

    savePages(
      localWikiRepository
        .list()
        .filter(
          (page) =>
            normalizeSlug(
              String(
                page.slug ||
                  ""
              )
            ) !== normalizedSlug
        )
    );
  },

  saveAll(
    pages: WikiPage[]
  ) {
    savePages(
      pages
    );
  },

  clear() {
    clearPages();
  },

  reset() {
    resetWikiPages();
  },

  resetInitialization() {
    resetWikiInitialization();
  },

  listByCategory(
    category: string
  ) {
    return localWikiRepository
      .list()
      .filter(
        (page) =>
          page.category === category
      );
  },

  listByCompany(
    company: string
  ) {
    return localWikiRepository
      .list()
      .filter(
        (page) =>
          page.company === company
      );
  },

  listByDepartment(
    department: string
  ) {
    return localWikiRepository
      .list()
      .filter(
        (page) =>
          page.department === department
      );
  },

  listByTag(
    tag: string
  ) {
    return localWikiRepository
      .list()
      .filter(
        (page) =>
          page.tags?.includes(
            tag
          )
      );
  },

  listCategories() {
    return Array.from(
      new Set(
        localWikiRepository
          .list()
          .map(
            (page) =>
              String(
                page.category ||
                  "Allgemein"
              )
          )
      )
    );
  },

  listTags() {
    return Array.from(
      new Set(
        localWikiRepository
          .list()
          .flatMap(
            (page) =>
              page.tags ||
              []
          )
      )
    );
  },

  countAll() {
    return localWikiRepository.list().length;
  },
};

export const wikiRepository =
  localWikiRepository;