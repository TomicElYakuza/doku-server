export type {
  NewsCategory,
  NewsPost,
} from "../lib/newsStorage";

export type NewsCreateInput = Omit<
  import("../lib/newsStorage").NewsPost,
  "id" | "createdAt"
>;

export type NewsUpdateInput =
  Partial<
    Omit<
      import("../lib/newsStorage").NewsPost,
      "id" | "createdAt"
    >
  >;