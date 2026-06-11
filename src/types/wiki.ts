export type WikiStatus =
  | "draft"
  | "published"
  | "archived";

export type WikiVisibility =
  | "global"
  | "company"
  | "department";

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
  status: WikiStatus;
  visibility: WikiVisibility;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WikiCreateInput = Partial<
  Omit<WikiPage, "createdAt" | "updatedAt">
> & {
  title: string;
};

export type WikiUpdateInput = Partial<
  Omit<WikiPage, "createdAt" | "updatedAt">
>;


export type WikiVersion = {
  id: string;
  wikiSlug: string;
  title: string;
  description: string;
  company: string;
  category: string;
  department: string;
  content: string;
  tags: string[];
  status: WikiStatus;
  visibility: WikiVisibility;
  pinned: boolean;
  createdAt: string;
};
