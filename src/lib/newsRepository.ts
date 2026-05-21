import {
  requestJson,
} from "./apiClient";

import type {
  NewsCategory,
  NewsCreateInput,
  NewsPost,
  NewsUpdateInput,
} from "../types/news";

export type NewsRepository = {
  list: () => Promise<NewsPost[]>;
  search: (query: string) => Promise<NewsPost[]>;
  findById: (id: string) => Promise<NewsPost | null>;
  create: (post: NewsCreateInput) => Promise<NewsPost>;
  update: (
    id: string,
    updates: NewsUpdateInput
  ) => Promise<NewsPost | null>;
  delete: (id: string) => Promise<void>;
  saveAll: (posts: NewsPost[]) => Promise<void>;

  listByCategory: (category: NewsCategory | string) => Promise<NewsPost[]>;
  listCategories: () => Promise<Array<NewsCategory | string>>;
  listPinned: () => Promise<NewsPost[]>;
  listLatest: (limit?: number) => Promise<NewsPost[]>;

  countAll: () => Promise<number>;
  countByCategory: (category: NewsCategory | string) => Promise<number>;
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

  window.dispatchEvent(
    new Event(
      "newsUpdated"
    )
  );
}

function dispatchNewsOpenedUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "newsOpenedUpdated"
    )
  );
}

function normalizeQuery(
  query: string
) {
  return query
    .trim()
    .toLowerCase();
}

function postMatchesQuery(
  post: NewsPost,
  query: string
) {
  const normalizedQuery =
    normalizeQuery(
      query
    );

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

  return haystack.includes(
    normalizedQuery
  );
}

function getUserEmail(
  value?: string
) {
  return (
    value?.trim().toLowerCase() ||
    "anonymous"
  );
}

export const postgresNewsRepository: NewsRepository = {
  async list() {
    return requestJson<NewsPost[]>(
      "/api/news"
    );
  },

  async search(
    query: string
  ) {
    const posts =
      await postgresNewsRepository.list();

    return posts.filter(
      (post) =>
        postMatchesQuery(
          post,
          query
        )
    );
  },

  async findById(
    id: string
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<NewsPost>(
        `/api/news/${encodeURIComponent(
          id
        )}`
      );
    } catch {
      return null;
    }
  },

  async create(
    post: NewsCreateInput
  ) {
    const createdPost =
      await requestJson<NewsPost>(
        "/api/news",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              post
            ),
        }
      );

    dispatchNewsUpdated();

    return createdPost;
  },

  async update(
    id: string,
    updates: NewsUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedPost =
      await requestJson<NewsPost>(
        `/api/news/${encodeURIComponent(
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

    dispatchNewsUpdated();

    return updatedPost;
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
      `/api/news/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchNewsUpdated();
  },

  async saveAll(
    posts: NewsPost[]
  ) {
    await Promise.all(
      posts.map(
        async (post) => {
          if (post.id) {
            await postgresNewsRepository.update(
              post.id,
              post
            );

            return;
          }

          await postgresNewsRepository.create(
            post
          );
        }
      )
    );

    dispatchNewsUpdated();
  },

  async listByCategory(
    category: NewsCategory | string
  ) {
    return requestJson<NewsPost[]>(
      `/api/news?category=${encodeURIComponent(
        String(
          category
        )
      )}`
    );
  },

  async listCategories() {
    const posts =
      await postgresNewsRepository.list();

    return Array.from(
      new Set(
        posts
          .map(
            (post) =>
              post.category
          )
          .filter(Boolean)
      )
    );
  },

  async listPinned() {
    return requestJson<NewsPost[]>(
      "/api/news?pinned=true"
    );
  },

  async listLatest(
    limit = 5
  ) {
    const posts =
      await postgresNewsRepository.list();

    return posts.slice(
      0,
      limit
    );
  },

  async countAll() {
    const posts =
      await postgresNewsRepository.list();

    return posts.length;
  },

  async countByCategory(
    category: NewsCategory | string
  ) {
    const posts =
      await postgresNewsRepository.listByCategory(
        category
      );

    return posts.length;
  },

  async countPinned() {
    const posts =
      await postgresNewsRepository.listPinned();

    return posts.length;
  },

  async getOpenedIds(
    userEmail?: string
  ) {
    return requestJson<string[]>(
      `/api/news/opened?userEmail=${encodeURIComponent(
        getUserEmail(
          userEmail
        )
      )}`
    );
  },

  async markOpened(
    id: string,
    userEmail?: string
  ) {
    await requestJson<{
      ok: boolean;
    }>(
      "/api/news/opened",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            id,
            userEmail:
              getUserEmail(
                userEmail
              ),
          }),
      }
    );

    dispatchNewsOpenedUpdated();
  },

  async markAllOpened(
    userEmail?: string
  ) {
    await requestJson<{
      ok: boolean;
    }>(
      "/api/news/opened",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            all:
              true,

            userEmail:
              getUserEmail(
                userEmail
              ),
          }),
      }
    );

    dispatchNewsOpenedUpdated();
  },

  async countUnread(
    userEmail?: string
  ) {
    const [
      posts,
      openedIds,
    ] =
      await Promise.all([
        postgresNewsRepository.list(),
        postgresNewsRepository.getOpenedIds(
          userEmail
        ),
      ]);

    return posts.filter(
      (post) =>
        !openedIds.includes(
          post.id
        )
    ).length;
  },
};

export const newsRepository =
  postgresNewsRepository;