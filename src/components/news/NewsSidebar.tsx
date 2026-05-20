"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  getLatestNewsPosts,
  getNewsCategories,
  getNewsPosts,
  getNewsPostsByCategory,
  getOpenedNewsPostIds,
} from "@/lib/newsStorage";

function SectionTitle({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold app-accent-text uppercase mb-3">
      <span className="text-base leading-none">
        {icon}
      </span>

      <span>
        {title}
      </span>
    </h3>
  );
}

function getLinkClass(
  active: boolean
) {
  if (active) {
    return "flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 text-white transition";
  }

  return "flex items-center justify-between gap-3 p-3 rounded-xl text-zinc-700 hover:bg-zinc-100 transition";
}

export default function NewsSidebar() {
  const searchParams =
    useSearchParams();

  const activeCategory =
    searchParams.get("category") || "";

  const [openedIds, setOpenedIds] =
    useState<string[]>([]);

  useEffect(() => {
    loadOpenedIds();

    function handleNewsOpenedUpdated() {
      loadOpenedIds();
    }

    window.addEventListener(
      "newsOpenedUpdated",
      handleNewsOpenedUpdated
    );

    return () => {
      window.removeEventListener(
        "newsOpenedUpdated",
        handleNewsOpenedUpdated
      );
    };
  }, []);

  function loadOpenedIds() {
    setOpenedIds(
      getOpenedNewsPostIds()
    );
  }

  const posts =
    getNewsPosts();

  const categories =
    getNewsCategories();

  const latestPosts =
    getLatestNewsPosts(
      5
    );

  return (
    <aside className="w-72 bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6 h-fit">
      <h2 className="text-xl font-bold mb-6">
        News
      </h2>

      <div className="mb-8">
        <Link
          href="/"
          className={getLinkClass(
            !activeCategory
          )}
        >
          <span>
            📰 Alle News
          </span>

          <span className="text-xs opacity-80">
            {posts.length}
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <SectionTitle
          icon="◌"
          title="Kategorien"
        />

        <div className="flex flex-col gap-1">
          {categories.map(
            (category) => (
              <Link
                key={category}
                href={`/?category=${encodeURIComponent(
                  category
                )}`}
                className={getLinkClass(
                  activeCategory === category
                )}
              >
                <span>
                  {category}
                </span>

                <span className="text-xs opacity-80">
                  {
                    getNewsPostsByCategory(
                      category
                    ).length
                  }
                </span>
              </Link>
            )
          )}
        </div>
      </div>

      <div>
        <SectionTitle
          icon="🕒"
          title="Neueste Beiträge"
        />

        <div className="flex flex-col gap-1">
          {latestPosts.map(
            (post) => {
              const opened =
                openedIds.includes(
                  post.id
                );

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className={`block p-3 rounded-xl transition ${
                    opened
                      ? "text-zinc-700 hover:bg-zinc-100"
                      : "text-zinc-800 bg-red-50/40 hover:bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`font-mono text-xs mt-0.5 ${
                        opened
                          ? "text-zinc-400"
                          : "text-red-600"
                      }`}
                    >
                      #{post.id}
                    </span>

                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">
                        {post.title}
                      </p>

                      <p className="text-xs text-zinc-400 mt-1">
                        {post.createdAt}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </div>
    </aside>
  );
}