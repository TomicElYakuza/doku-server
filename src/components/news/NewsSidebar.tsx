"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  newsRepository,
} from "../../lib/newsRepository";

import type {
  NewsPost,
} from "../../types/news";

type NewsSidebarProps = {
  className?: string;
};

function getCategoryLabel(
  category: string
) {
  if (!category) {
    return "Allgemein";
  }

  return category;
}

function getCategoryClass(
  category: string
) {
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

export default function NewsSidebar({
  className = "",
}: NewsSidebarProps) {
  const [posts, setPosts] =
    useState<NewsPost[]>([]);

  const [openedIds, setOpenedIds] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void loadData();

    function handleNewsUpdated() {
      void loadData();
    }

    function handleNewsOpenedUpdated() {
      void loadOpenedIds();
    }

    window.addEventListener(
      "newsUpdated",
      handleNewsUpdated
    );

    window.addEventListener(
      "newsOpenedUpdated",
      handleNewsOpenedUpdated
    );

    return () => {
      window.removeEventListener(
        "newsUpdated",
        handleNewsUpdated
      );

      window.removeEventListener(
        "newsOpenedUpdated",
        handleNewsOpenedUpdated
      );
    };
  }, []);

  async function loadData() {
    try {
      setLoading(
        true
      );

      const [
        nextPosts,
        nextOpenedIds,
      ] =
        await Promise.all([
          newsRepository.list(),
          newsRepository.getOpenedIds(),
        ]);

      setPosts(
        nextPosts
      );

      setOpenedIds(
        nextOpenedIds
      );
    } catch (error) {
      console.error(
        "News konnten nicht geladen werden:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function loadOpenedIds() {
    try {
      const nextOpenedIds =
        await newsRepository.getOpenedIds();

      setOpenedIds(
        nextOpenedIds
      );
    } catch (error) {
      console.error(
        "Gelesene News konnten nicht geladen werden:",
        error
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
        error
      );
    }
  }

  const pinnedPosts =
    posts.filter(
      (post) =>
        post.pinned
    );

  const latestPosts =
    posts.slice(
      0,
      5
    );

  const unreadPosts =
    posts.filter(
      (post) =>
        !openedIds.includes(
          post.id
        )
    );

  const categories =
    Array.from(
      new Set(
        posts.map(
          (post) =>
            String(
              post.category ||
                "Allgemein"
            )
        )
      )
    );

  return (
    <aside className={`space-y-6 ${className}`}>
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">
              Neuigkeiten
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Aktuelle Beiträge
            </p>
          </div>

          <span className="h-11 w-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
            N
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">
              Beiträge
            </p>

            <p className="text-2xl font-bold mt-1">
              {posts.length}
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4">
            <p className="text-xs text-red-600">
              Ungelesen
            </p>

            <p className="text-2xl font-bold mt-1 text-red-700">
              {unreadPosts.length}
            </p>
          </div>
        </div>

        {unreadPosts.length > 0 && (
          <button
            type="button"
            onClick={() =>
              void handleMarkAllOpened()
            }
            className="w-full mt-5 bg-zinc-900 text-white px-4 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Alle als gelesen markieren
          </button>
        )}

        {loading && (
          <p className="text-sm text-zinc-500 mt-5">
            News werden geladen...
          </p>
        )}
      </div>

      {pinnedPosts.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
          <h3 className="font-semibold">
            Fixiert
          </h3>

          <div className="space-y-3 mt-4">
            {pinnedPosts.slice(
              0,
              4
            ).map(
              (post) => {
                const unread =
                  !openedIds.includes(
                    post.id
                  );

                return (
                  <Link
                    key={post.id}
                    href={`/news/${post.id}`}
                    className={`block rounded-2xl border p-4 transition ${
                      unread
                        ? "border-red-100 bg-red-50/40 hover:bg-red-50"
                        : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[11px] px-2 py-1 rounded-full ${getCategoryClass(String(post.category))}`}>
                        {getCategoryLabel(
                          String(
                            post.category
                          )
                        )}
                      </span>

                      {unread && (
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      )}
                    </div>

                    <p className="font-medium mt-3 line-clamp-2">
                      {post.title}
                    </p>

                    <p className="text-xs text-zinc-500 mt-2">
                      {post.createdAt}
                    </p>
                  </Link>
                );
              }
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Neueste Beiträge
        </h3>

        <div className="space-y-3 mt-4">
          {latestPosts.length === 0 && (
            <p className="text-sm text-zinc-500">
              Noch keine News vorhanden.
            </p>
          )}

          {latestPosts.map(
            (post) => {
              const unread =
                !openedIds.includes(
                  post.id
                );

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className={`block rounded-2xl border p-4 transition ${
                    unread
                      ? "border-red-100 bg-red-50/40 hover:bg-red-50"
                      : "border-zinc-100 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${getCategoryClass(String(post.category))}`}>
                      {getCategoryLabel(
                        String(
                          post.category
                        )
                      )}
                    </span>

                    {unread && (
                      <span className="text-xs font-semibold text-red-600">
                        Neu
                      </span>
                    )}
                  </div>

                  <p className="font-medium mt-3 line-clamp-2">
                    {post.title}
                  </p>

                  <p className="text-xs text-zinc-500 mt-2">
                    {post.createdAt}
                  </p>
                </Link>
              );
            }
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
        <h3 className="font-semibold">
          Kategorien
        </h3>

        <div className="flex flex-wrap gap-2 mt-4">
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500">
              Keine Kategorien vorhanden.
            </p>
          )}

          {categories.map(
            (category) => (
              <Link
                key={category}
                href={`/news?category=${encodeURIComponent(
                  category
                )}`}
                className={`text-xs px-3 py-1 rounded-full transition ${getCategoryClass(category)}`}
              >
                {category}
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}