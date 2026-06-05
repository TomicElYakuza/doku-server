export type NewsPost = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  pinned: boolean;
  createdAt: string;
};

export type NewsCreateInput = Omit<NewsPost, "id" | "createdAt">;

export type NewsUpdateInput = Partial<Omit<NewsPost, "id" | "createdAt">>;