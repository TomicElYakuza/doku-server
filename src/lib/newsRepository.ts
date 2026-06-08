import { requestJson } from "./apiClient";
import type {
  NewsCreateInput,
  NewsPost,
  NewsUpdateInput,
} from "../types/news";
import type { TaxonomyItem } from "../types/taxonomy";

type NewsFilters = {
  category?: string;
  pinned?: boolean;
};

export type NewsRepository = {
  list: (filters?: NewsFilters) => Promise<NewsPost[]>;
  search: (query: string) => Promise<NewsPost[]>;
  findById: (id: string) => Promise<NewsPost | null>;
  create: (post: NewsCreateInput) => Promise<NewsPost>;
  update: (
    id: string,
    updates: NewsUpdateInput,
  ) => Promise<NewsPost | null>;
  delete: (id: string) => Promise<void>;
  saveAll: (posts: NewsPost[]) => Promise<void>;
  listByCategory: (category: string) => Promise<NewsPost[]>;
  listCategories: () => Promise<string[]>;
  getCategories: () => Promise<string[]>;
  listPinned: () => Promise<NewsPost[]>;
  listLatest: (limit?: number) => Promise<NewsPost[]>;
  countAll: () => Promise<number>;
  countByCategory: (category: string) => Promise<number>;
  countPinned: () => Promise<number>;
  getOpenedIds: (userEmail?: string) => Promise<string[]>;
  markOpened: (id: string, userEmail?: string) => Promise<void>;
  markAllOpened: (userEmail?: string) => Promise<void>;
  countUnread: (userEmail?: string) => Promise<number>;
};

function dispatchNewsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("newsUpdated"));
}

function dispatchNewsOpenedUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("newsOpenedUpdated"));
}

function buildQuery(filters?: NewsFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.category?.trim()) {
    searchParams.set("category", filters.category.trim());
  }

  if (typeof filters?.pinned === "boolean") {
    searchParams.set("pinned", String(filters.pinned));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizePayload(
  payload: NewsCreateInput | NewsUpdateInput,
) {
  return {
    id:
      "id" in payload
        ? normalizeText(payload.id) || undefined
        : undefined,
    title: normalizeText(payload.title),
    description: normalizeText(payload.description),
    content: String(payload.content || ""),
    category: normalizeText(payload.category),
    author: normalizeText(payload.author) || "System",
    pinned: Boolean(payload.pinned),
  };
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function postMatchesQuery(
  post: NewsPost,
  query: string,
) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    post.id,
    post.title,
    post.description,
    post.content,
    post.category,
    post.author,
    post.createdAt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getUserEmail(value?: string) {
  return value?.trim().toLowerCase() || "anonymous";
}

export const postgresNewsRepository: NewsRepository = {
  async list(filters?: NewsFilters) {
    const query = buildQuery(filters);

    return requestJson<NewsPost[]>(`/api/news${query}`);
  },

  async search(query: string) {
    const posts = await postgresNewsRepository.list();

    return posts.filter((post) =>
      postMatchesQuery(post, query),
    );
  },

  async findById(id: string) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<NewsPost>(
        `/api/news/${encodeURIComponent(id)}`,
      );
    } catch {
      return null;
    }
  },

  async create(post: NewsCreateInput) {
    const payload = normalizePayload(post);

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const createdPost = await requestJson<NewsPost>(
      "/api/news",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchNewsUpdated();

    return createdPost;
  },

  async update(
    id: string,
    updates: NewsUpdateInput,
  ) {
    if (!id) {
      return null;
    }

    const payload = normalizePayload(updates);

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
      throw new Error("Kategorie ist erforderlich.");
    }

    const updatedPost = await requestJson<NewsPost>(
      `/api/news/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    dispatchNewsUpdated();

    return updatedPost;
  },

  async delete(id: string) {
    if (!id) {
      return;
    }

    await requestJson<{ ok: boolean }>(
      `/api/news/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    dispatchNewsUpdated();
  },

  async saveAll(posts: NewsPost[]) {
    await Promise.all(
      posts.map(async (post) => {
        if (post.id) {
          await postgresNewsRepository.update(post.id, post);
          return;
        }

        await postgresNewsRepository.create(post);
      }),
    );

    dispatchNewsUpdated();
  },

  async listByCategory(category: string) {
    return postgresNewsRepository.list({
      category: String(category),
    });
  },

  async listCategories() {
    const items = await requestJson<TaxonomyItem[]>(
      "/api/taxonomy?target=news&type=category&status=active",
    );

    return items
      .map((item) => item.name)
      .filter(Boolean)
      .sort((first, second) =>
        first.localeCompare(second),
      );
  },

  async getCategories() {
    return postgresNewsRepository.listCategories();
  },

  async listPinned() {
    return postgresNewsRepository.list({
      pinned: true,
    });
  },

  async listLatest(limit = 5) {
    const posts = await postgresNewsRepository.list();

    return posts.slice(0, limit);
  },

  async countAll() {
    const posts = await postgresNewsRepository.list();

    return posts.length;
  },

  async countByCategory(category: string) {
    const posts =
      await postgresNewsRepository.listByCategory(category);

    return posts.length;
  },

  async countPinned() {
    const posts = await postgresNewsRepository.listPinned();

    return posts.length;
  },

  async getOpenedIds(userEmail?: string) {
    return requestJson<string[]>(
      `/api/news/opened?userEmail=${encodeURIComponent(
        getUserEmail(userEmail),
      )}`,
    );
  },

  async markOpened(
    id: string,
    userEmail?: string,
  ) {
    if (!id) {
      return;
    }

    await requestJson<{ ok: boolean }>(
      "/api/news/opened",
      {
        method: "POST",
        body: JSON.stringify({
          id,
          userEmail: getUserEmail(userEmail),
        }),
      },
    );

    dispatchNewsOpenedUpdated();
  },

  async markAllOpened(userEmail?: string) {
    await requestJson<{ ok: boolean }>(
      "/api/news/opened",
      {
        method: "POST",
        body: JSON.stringify({
          all: true,
          userEmail: getUserEmail(userEmail),
        }),
      },
    );

    dispatchNewsOpenedUpdated();
  },

  async countUnread(userEmail?: string) {
    const [posts, openedIds] = await Promise.all([
      postgresNewsRepository.list(),
      postgresNewsRepository.getOpenedIds(userEmail),
    ]);

    return posts.filter(
      (post) => !openedIds.includes(post.id),
    ).length;
  },
};

export const newsRepository = postgresNewsRepository;
