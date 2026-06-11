import {
  requestJson,
} from "./apiClient";
import type {
  WikiCreateInput,
  WikiPage,
  WikiStatus,
  WikiUpdateInput,
  WikiVersion,
  WikiVisibility,
} from "../types/wiki";

type WikiFilters = {
  company?: string;
  department?: string;
  category?: string;
  tag?: string;
  status?: WikiStatus | "all";
  visibility?: WikiVisibility | "all";
  pinned?: boolean;
};

export type WikiRepository = {
  list: (filters?: WikiFilters) => Promise<WikiPage[]>;
  search: (query: string) => Promise<WikiPage[]>;
  findBySlug: (slug: string) => Promise<WikiPage | null>;
  listVersions: (slug: string) => Promise<WikiVersion[]>;
  restoreVersion: (
    slug: string,
    versionId: string,
  ) => Promise<void>;
  create: (page: WikiCreateInput) => Promise<WikiPage>;
  update: (
    slug: string,
    updates: WikiUpdateInput,
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
    new Event("wikiPagesUpdated"),
  );
}

function buildQuery(filters?: WikiFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.company?.trim()) {
    searchParams.set("company", filters.company.trim());
  }

  if (filters?.department?.trim()) {
    searchParams.set("department", filters.department.trim());
  }

  if (filters?.category?.trim()) {
    searchParams.set("category", filters.category.trim());
  }

  if (filters?.tag?.trim()) {
    searchParams.set("tag", filters.tag.trim());
  }

  if (filters?.status && filters.status !== "all") {
    searchParams.set("status", filters.status);
  }

  if (filters?.visibility && filters.visibility !== "all") {
    searchParams.set("visibility", filters.visibility);
  }

  if (typeof filters?.pinned === "boolean") {
    searchParams.set("pinned", filters.pinned ? "true" : "false");
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizeTags(tags?: string[]) {
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

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeStatus(value: unknown): WikiStatus {
  const status = String(value || "").trim();

  if (status === "draft" || status === "published" || status === "archived") {
    return status;
  }

  return "published";
}

function normalizeVisibility(value: unknown): WikiVisibility {
  const visibility = String(value || "").trim();

  if (visibility === "global" || visibility === "company" || visibility === "department") {
    return visibility;
  }

  return "company";
}

function normalizeCreatePayload(page: WikiCreateInput) {
  return {
    slug: normalizeText(page.slug),
    title: normalizeText(page.title),
    description: normalizeText(page.description),
    excerpt: normalizeText(page.excerpt || page.description),
    company: normalizeText(page.company) || "Intern",
    category: normalizeText(page.category),
    department: normalizeText(page.department),
    author: normalizeText(page.author) || "System",
    tags: normalizeTags(page.tags),
    content: String(page.content || ""),
    status: normalizeStatus(page.status),
    visibility: normalizeVisibility(page.visibility),
    pinned: Boolean(page.pinned),
  };
}

function normalizeUpdatePayload(updates: WikiUpdateInput) {
  return {
    slug: updates.slug !== undefined ? normalizeText(updates.slug) : undefined,
    title: updates.title !== undefined ? normalizeText(updates.title) : undefined,
    description: updates.description !== undefined ? normalizeText(updates.description) : undefined,
    excerpt: updates.excerpt !== undefined ? normalizeText(updates.excerpt) : undefined,
    company: updates.company !== undefined ? normalizeText(updates.company) || "Intern" : undefined,
    category: updates.category !== undefined ? normalizeText(updates.category) : undefined,
    department: updates.department !== undefined ? normalizeText(updates.department) : undefined,
    author: updates.author !== undefined ? normalizeText(updates.author) || "System" : undefined,
    tags: updates.tags !== undefined ? normalizeTags(updates.tags) : undefined,
    content: updates.content !== undefined ? String(updates.content || "") : undefined,
    status: updates.status !== undefined ? normalizeStatus(updates.status) : undefined,
    visibility: updates.visibility !== undefined ? normalizeVisibility(updates.visibility) : undefined,
    pinned: updates.pinned !== undefined ? Boolean(updates.pinned) : undefined,
  };
}

function pageMatchesQuery(
  page: WikiPage,
  query: string,
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
    page.status,
    page.visibility,
    page.tags?.join(" "),
    page.createdAt,
    page.updatedAt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export const postgresWikiRepository: WikiRepository = {
  async list(filters?: WikiFilters) {
    const query = buildQuery(filters);

    return requestJson<WikiPage[]>(
      `/api/wiki-pages${query}`,
    );
  },

  async search(query: string) {
    const pages = await postgresWikiRepository.list();

    return pages.filter((page) =>
      pageMatchesQuery(
        page,
        query,
      ),
    );
  },

  async findBySlug(slug: string) {
    if (!slug) {
      return null;
    }

    try {
      return await requestJson<WikiPage>(
        `/api/wiki-pages/${encodeURIComponent(slug)}`,
      );
    } catch {
      return null;
    }
  },

  async listVersions(slug: string) {
    if (!slug) {
      return [];
    }

    return requestJson<WikiVersion[]>(
      `/api/wiki-pages/${encodeURIComponent(slug)}/versions`,
    );
  },

  async restoreVersion(
    slug: string,
    versionId: string,
  ) {
    if (!slug || !versionId) {
      return;
    }

    await requestJson<{ ok: boolean }>(
      `/api/wiki-pages/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}/restore`,
      {
        method: "POST",
      },
    );

    dispatchWikiPagesUpdated();
  },

  async create(page: WikiCreateInput) {
    const payload = normalizeCreatePayload(page);

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.category) {
      throw new Error("Wiki-Kategorie ist erforderlich.");
    }

    const createdPage = await requestJson<WikiPage>(
      "/api/wiki-pages",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchWikiPagesUpdated();

    return createdPage;
  },

  async update(
    slug: string,
    updates: WikiUpdateInput,
  ) {
    if (!slug) {
      return null;
    }

    const payload = normalizeUpdatePayload(updates);

    if (
      updates.title !== undefined &&
      !payload.title
    ) {
      throw new Error("Titel ist erforderlich.");
    }

    if (
      updates.category !== undefined &&
      !payload.category
    ) {
      throw new Error("Wiki-Kategorie ist erforderlich.");
    }

    const updatedPage = await requestJson<WikiPage>(
      `/api/wiki-pages/${encodeURIComponent(slug)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    dispatchWikiPagesUpdated();

    return updatedPage;
  },

  async delete(slug: string) {
    if (!slug) {
      return;
    }

    await requestJson<{ ok: boolean }>(
      `/api/wiki-pages/${encodeURIComponent(slug)}`,
      {
        method: "DELETE",
      },
    );

    dispatchWikiPagesUpdated();
  },

  async saveAll(pages: WikiPage[]) {
    await Promise.all(
      pages.map(async (page) => {
        if (page.slug) {
          await postgresWikiRepository.update(
            page.slug,
            page,
          );
          return;
        }

        await postgresWikiRepository.create(page);
      }),
    );

    dispatchWikiPagesUpdated();
  },

  async clear() {
    throw new Error(
      "clear ist für PostgreSQL-Wiki nicht direkt verfügbar.",
    );
  },

  async reset() {
    throw new Error(
      "reset ist für PostgreSQL-Wiki nicht direkt verfügbar.",
    );
  },

  async resetInitialization() {
    return;
  },

  async listByCategory(category: string) {
    return postgresWikiRepository.list({
      category,
    });
  },

  async listByCompany(company: string) {
    return postgresWikiRepository.list({
      company,
    });
  },

  async listByDepartment(department: string) {
    return postgresWikiRepository.list({
      department,
    });
  },

  async listByTag(tag: string) {
    return postgresWikiRepository.list({
      tag,
    });
  },

  async listCategories() {
    const pages = await postgresWikiRepository.list();

    return Array.from(
      new Set(
        pages
          .map((page) => page.category)
          .map((category) => String(category || "").trim())
          .filter(Boolean),
      ),
    ).sort((first, second) => first.localeCompare(second));
  },

  async listTags() {
    const pages = await postgresWikiRepository.list();

    return Array.from(
      new Set(
        pages.flatMap((page) => normalizeTags(page.tags)),
      ),
    ).sort((first, second) => first.localeCompare(second));
  },

  async countAll() {
    const pages = await postgresWikiRepository.list();

    return pages.length;
  },
};

export const wikiRepository = postgresWikiRepository;
