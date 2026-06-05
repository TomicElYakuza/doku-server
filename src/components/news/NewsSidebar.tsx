"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { newsRepository } from "../../lib/newsRepository";
import type { NewsPost } from "../../types/news";

type NewsSidebarProps = {
  className?: string;
};

function getCategoryClass(category: string) {
  if (category === "System") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "Tickets") {
    return "bg-orange-100 text-orange-700";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getPostCategory(post: NewsPost) {
  return String(post.category || "");
}

export default function NewsSidebar({
  className = "",
}: NewsSidebarProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();

    function handleNewsUpdated() {
      void loadData();
    }

    function handleNewsOpenedUpdated() {
      void loadOpenedIds();
    }

    window.addEventListener("newsUpdated", handleNewsUpdated);
    window.addEventListener(
      "newsOpenedUpdated",
      handleNewsOpenedUpdated,
    );

    return () => {
      window.removeEventListener("newsUpdated", handleNewsUpdated);
      window.removeEventListener(
        "newsOpenedUpdated",
        handleNewsOpenedUpdated,
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        nextPosts,
        nextOpenedIds,
      ] = await Promise.all([
        newsRepository.list(),
        newsRepository.getOpenedIds(),
      ]);

      setPosts(Array.isArray(nextPosts) ? nextPosts : []);
      setOpenedIds(
        Array.isArray(nextOpenedIds)
          ? nextOpenedIds
          : [],
      );
    } catch (error) {
      console.error("News konnten nicht geladen werden:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOpenedIds() {
    try {
      const nextOpenedIds = await newsRepository.getOpenedIds();

      setOpenedIds(
        Array.isArray(nextOpenedIds)
          ? nextOpenedIds
          : [],
      );
    } catch (error) {
      console.error(
        "Gelesene News konnten nicht geladen werden:",
        error,
      );
    }
  }

  async function handleMarkAllOpened() {
    try {
      await newsRepository.markAllOpened();
      await loadData();
    } catch (error) {
      console.error(
        "News konnten nicht als gelesen markiert werden:",
        error,
      );
    }
  }

  const pinnedPosts = useMemo(
    () => posts.filter((post) => post.pinned),
    [
      posts,
    ],
  );

  const latestPosts = useMemo(
    () => posts.slice(0, 5),
    [
      posts,
    ],
  );

  const unreadPosts = useMemo(
    () =>
      posts.filter(
        (post) => !openedIds.includes(post.id),
      ),
    [
      posts,
      openedIds,
    ],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          posts
            .map((post) => getPostCategory(post))
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [
      posts,
    ],
  );

  return (
    <aside className={`space-y-6 ${className}`}>
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Neuigkeiten
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Aktuelle Beiträge
            </p>
          </div>

          {unreadPosts.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
              Neu
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-zinc-50 rounded-2xl p-4">
            <p className="text-xs text-zinc-500">
              Beiträge
            </p>
            <p className="text-2xl font-bold mt-1">
              {posts.length}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4">
            <p className="text-xs text-zinc-500">
              Ungelesen
            </p>
            <p className="text-2xl font-bold mt-1">
              {unreadPosts.length}
            </p>
          </div>
        </div>

        {unreadPosts.length > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllOpened()}
            className="w-full mt-5 bg-zinc-900 text-white px-4 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Alle als gelesen markieren
          </button>
        )}

        {loading && (
          <p className="text-sm text-zinc-400 mt-5">
            News werden geladen...
          </p>
        )}
      </section>

      {pinnedPosts.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-semibold">
            Fixiert
          </h3>

          <div className="space-y-3 mt-4">
            {pinnedPosts.slice(0, 4).map((post) => {
              const unread = !openedIds.includes(post.id);
              const postCategory = getPostCategory(post);

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="block border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    {postCategory && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getCategoryClass(
                          postCategory,
                        )}`}
                      >
                        {postCategory}
                      </span>
                    )}

                    {unread && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Neu
                      </span>
                    )}
                  </div>

                  <p className="font-medium mt-3 line-clamp-2">
                    {post.title}
                  </p>

                  <p className="text-xs text-zinc-400 mt-2">
                    {post.createdAt}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold">
          Neueste Beiträge
        </h3>

        <div className="space-y-3 mt-4">
          {latestPosts.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine News vorhanden.
            </p>
          )}

          {latestPosts.map((post) => {
            const unread = !openedIds.includes(post.id);
            const postCategory = getPostCategory(post);

            return (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="block border border-zinc-100 rounded-2xl p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex flex-wrap gap-2">
                  {postCategory && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getCategoryClass(
                        postCategory,
                      )}`}
                    >
                      {postCategory}
                    </span>
                  )}

                  {unread && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Neu
                    </span>
                  )}
                </div>

                <p className="font-medium mt-3 line-clamp-2">
                  {post.title}
                </p>

                <p className="text-xs text-zinc-400 mt-2">
                  {post.createdAt}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold">
          Kategorien
        </h3>

        <div className="flex flex-wrap gap-2 mt-4">
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500">
              Keine Kategorien vorhanden.
            </p>
          )}

          {categories.map((category) => (
            <Link
              key={category}
              href={`/news?category=${encodeURIComponent(category)}`}
              className={`text-sm px-3 py-2 rounded-full ${getCategoryClass(
                category,
              )}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}