export type WikiPage = {
  slug?: string;
  title?: string;
  description?: string;
  excerpt?: string;
  company?: string;
  category?: string;
  department?: string;
  author?: string;
  updatedAt?: string;
  createdAt?: string;
  tags?: string[];
  content?: string;
  [key: string]: unknown;
};

export type WikiCreateInput =
  WikiPage;

export type WikiUpdateInput =
  Partial<WikiPage>;