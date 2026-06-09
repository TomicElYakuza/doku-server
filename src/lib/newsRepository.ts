import { requestJson } from "./apiClient";
import type { NewsPost } from "../types/news";
import type { TaxonomyItem } from "../types/taxonomy";

export type NewsPostInput = {
  title?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
  publishedAt?: string;
};

export type NewsPostUpdateInput = Partial<NewsPostInput>;

type NewsListFilters = {
  category?: string;
  search?: string;
  pinned?: boolean;
};

export type NewsRepository = {
  list: (filters?: NewsListFilters) => Promise<NewsPost[]>;
  getById: (id: string) => Promise<NewsPost | null>;
  findById: (id: string) => Promise<NewsPost | null>;
  create: (post: NewsPostInput) => Promise<NewsPost>;
  update: (id: string, updates: NewsPostUpdateInput) => Promise<NewsPost>;
  delete: (id: string) => Promise<void>;
  listByCategory: (category: string) => Promise<NewsPost[]>;
  listCategories: () => Promise<string[]>;
  count: () => Promise<number>;
  countByCategory: (category: string) => Promise<number>;
  getOpenedIds: () => Promise<string[]>;
  markOpened: (id: string) => Promise<void>;
  markAllOpened: () => Promise<void>;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizePostPayload(payload: NewsPostInput): NewsPostInput {
  const excerpt = normalizeText(payload.excerpt || payload.description);

  return {
    title: normalizeText(payload.title),
    excerpt,
    description: excerpt,
    content: normalizeText(payload.content),
    category: normalizeText(payload.category),
    author: normalizeText(payload.author),
    pinned: Boolean(payload.pinned),
    publishedAt: normalizeText(payload.publishedAt),
  };
}

function normalizeUpdatePayload(
  updates: NewsPostUpdateInput,
): NewsPostUpdateInput {
  const payload: NewsPostUpdateInput = {};

  if (updates.title !== undefined) {
    payload.title = normalizeText(updates.title);
  }

  if (updates.excerpt !== undefined || updates.description !== undefined) {
    const excerpt = normalizeText(updates.excerpt || updates.description);

    payload.excerpt = excerpt;
    payload.description = excerpt;
  }

  if (updates.content !== undefined) {
    payload.content = normalizeText(updates.content);
  }

  if (updates.category !== undefined) {
    payload.category = normalizeText(updates.category);
  }

  if (updates.author !== undefined) {
    payload.author = normalizeText(updates.author);
  }

  if (updates.pinned !== undefined) {
    payload.pinned = Boolean(updates.pinned);
  }

  if (updates.publishedAt !== undefined) {
    payload.publishedAt = normalizeText(updates.publishedAt);
  }

  return payload;
}

function buildQuery(filters?: NewsListFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.category?.trim()) {
    searchParams.set("category", filters.category.trim());
  }

  if (filters?.search?.trim()) {
    searchParams.set("search", filters.search.trim());
  }

  if (typeof filters?.pinned === "boolean") {
    searchParams.set("pinned", String(filters.pinned));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const postgresNewsRepository: NewsRepository = {
  async list(filters) {
    const query = buildQuery(filters);

    return requestJson<NewsPost[]>(`/api/news${query}`);
  },

  async getById(id: string) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<NewsPost>(
        `/api/news/${encodeURIComponent(String(id))}`,
      );
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async findById(id: string) {
    return postgresNewsRepository.getById(id);
  },

  async create(post: NewsPostInput) {
    const payload = normalizePostPayload(post);

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.excerpt) {
      throw new Error("Kurzbeschreibung ist erforderlich.");
    }

    if (!payload.content) {
      throw new Error("Inhalt ist erforderlich.");
    }

    if (!payload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    return requestJson<NewsPost>("/api/news", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, updates: NewsPostUpdateInput) {
    if (!id) {
      throw new Error("News-ID fehlt.");
    }

    const payload = normalizeUpdatePayload(updates);

    if (updates.title !== undefined && !payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (
      (updates.excerpt !== undefined || updates.description !== undefined) &&
      !payload.excerpt
    ) {
      throw new Error("Kurzbeschreibung ist erforderlich.");
    }

    if (updates.content !== undefined && !payload.content) {
      throw new Error("Inhalt ist erforderlich.");
    }

    if (updates.category !== undefined && !payload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    return requestJson<NewsPost>(
      `/api/news/${encodeURIComponent(String(id))}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  async delete(id: string) {
    if (!id) {
      throw new Error("News-ID fehlt.");
    }

    await requestJson<{ ok: boolean }>(
      `/api/news/${encodeURIComponent(String(id))}`,
      {
        method: "DELETE",
      },
    );
  },

  async listByCategory(category: string) {
    return postgresNewsRepository.list({
      category: String(category),
    });
  },

  async listCategories() {
    try {
      const items = await requestJson<TaxonomyItem[]>(
        "/api/taxonomy?target=news&type=category&status=active",
      );

      return Array.from(
        new Set(
          items
            .map((item) => String(item.name || "").trim())
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second));
    } catch (error) {
      console.error(error);

      const posts = await postgresNewsRepository.list();

      return Array.from(
        new Set(
          posts
            .map((post) => String(post.category || "").trim())
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second));
    }
  },

  async count() {
    const posts = await postgresNewsRepository.list();

    return posts.length;
  },

  async countByCategory(category: string) {
    const posts = await postgresNewsRepository.listByCategory(category);

    return posts.length;
  },

  async getOpenedIds() {
    try {
      const result = await requestJson<{
        openedIds?: string[];
      }>("/api/news/opened");

      return Array.isArray(result.openedIds)
        ? result.openedIds.map((id) => String(id))
        : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async markOpened(id: string) {
    if (!id) {
      return;
    }

    await requestJson<{ ok: boolean }>("/api/news/opened", {
      method: "POST",
      body: JSON.stringify({
        id: String(id),
      }),
    });
  },

  async markAllOpened() {
    await requestJson<{ ok: boolean }>("/api/news/opened", {
      method: "POST",
      body: JSON.stringify({
        all: true,
      }),
    });
  },
};

export const newsRepository = postgresNewsRepository;