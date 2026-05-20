import {
  createNewsPost,
  deleteNewsPost,
  getLatestNewsPosts,
  getNewsCategories,
  getNewsPostById,
  getNewsPosts,
  getNewsPostsByCategory,
  getOpenedNewsPostIds,
  getPinnedNewsPosts,
  markAllNewsPostsOpened,
  markNewsPostOpened,
  resetNewsPosts,
  saveNewsPosts,
  searchNewsPosts,
  updateNewsPost,
} from "./newsStorage";

import type {
  NewsPost,
} from "./newsStorage";

export type NewsPostCreateInput = Omit<
  NewsPost,
  "id" | "createdAt"
>;

export type NewsPostUpdateInput =
  Partial<NewsPost>;

export type NewsRepository = {
  list: () => NewsPost[];
  search: (query: string) => NewsPost[];
  listPinned: () => NewsPost[];
  listLatest: (limit?: number) => NewsPost[];
  listCategories: () => string[];
  listByCategory: (category: string) => NewsPost[];
  findById: (id: string) => NewsPost | null;
  create: (post: NewsPostCreateInput) => NewsPost;
  update: (
    id: string,
    updates: NewsPostUpdateInput
  ) => NewsPost | null;
  delete: (id: string) => void;
  saveAll: (posts: NewsPost[]) => void;
  reset: () => void;
  getOpenedIds: () => string[];
  markOpened: (id: string) => void;
  markAllOpened: () => void;
};

export const localNewsRepository: NewsRepository = {
  list() {
    return getNewsPosts();
  },

  search(query: string) {
    return searchNewsPosts(
      query
    );
  },

  listPinned() {
    return getPinnedNewsPosts();
  },

  listLatest(limit = 5) {
    return getLatestNewsPosts(
      limit
    );
  },

  listCategories() {
    return getNewsCategories();
  },

  listByCategory(category: string) {
    return getNewsPostsByCategory(
      category
    );
  },

  findById(id: string) {
    return getNewsPostById(
      id
    );
  },

  create(post: NewsPostCreateInput) {
    return createNewsPost(
      post
    );
  },

  update(
    id: string,
    updates: NewsPostUpdateInput
  ) {
    return updateNewsPost(
      id,
      updates
    );
  },

  delete(id: string) {
    deleteNewsPost(
      id
    );
  },

  saveAll(posts: NewsPost[]) {
    saveNewsPosts(
      posts
    );
  },

  reset() {
    resetNewsPosts();
  },

  getOpenedIds() {
    return getOpenedNewsPostIds();
  },

  markOpened(id: string) {
    markNewsPostOpened(
      id
    );
  },

  markAllOpened() {
    markAllNewsPostsOpened();
  },
};

export const newsRepository =
  localNewsRepository;