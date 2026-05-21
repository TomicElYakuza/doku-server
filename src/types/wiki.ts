export type WikiPage = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  company: string;
  category: string;
  department: string;
  author: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type WikiCreateInput =
  Partial<
    Omit<
      WikiPage,
      "createdAt" | "updatedAt"
    >
  > & {
    title: string;
  };

export type WikiUpdateInput =
  Partial<
    Omit<
      WikiPage,
      "createdAt" | "updatedAt"
    >
  >;