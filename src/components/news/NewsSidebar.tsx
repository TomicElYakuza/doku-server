"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
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

function getCategoryLabel(category: string) {
  const normalized = String(category || "").trim();

  return normalized || "Nicht gesetzt";
}

function getCategoryClass(category: string) {
  if (category === "System") {
    return "bg-blue-50 text-blue-700 border border-blue-100";
  }

  if (category === "Tickets") {
    return "bg-orange-50 text-orange-700 border border-orange-100";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  return "bg-zinc-100 text-zinc-700 border border-zinc-200";
}

function getPostCategory(post: NewsPost) {
  return String(post.category || "").trim();
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

    window.addEventListener(
      "newsUpdated",
      handleNewsUpdated,
    );
    window.addEventListener(
      "newsOpenedUpdated",
      handleNewsOpenedUpdated,
    );

    return () => {
      window.removeEventListener(
        "newsUpdated",
        handleNewsUpdated,
      );
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
      setOpenedIds(Array.isArray(nextOpenedIds) ? nextOpenedIds : []);
    } catch (error) {
      console.error(
        "News konnten nicht geladen werden:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadOpenedIds() {
    try {
      const nextOpenedIds =
        await newsRepository.getOpenedIds();

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
    () =>
      posts.filter((post) => post.pinned),
    [
      posts,
    ],
  );

  const latestPosts = useMemo(
    () =>
      posts.slice(0, 5),
    [
      posts,
    ],
  );

  const unreadPosts = useMemo(
    () =>
      posts.filter((post) => !openedIds.includes(post.id)),
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
            .map(getPostCategory)
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [
      posts,
    ],
  );

  return (
    <aside className={`space-y-6 ${className}`}>
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-black">
                News
              </p>
              <h2 className="text-2xl font-black mt-1">
                Neuigkeiten
              </h2>
              <p className="text-zinc-500 mt-1">
                Aktuelle BeitrÃ¤ge im Ãœberblick.
              </p>
            </div>

            <div className="h-12 w-12 rounded-2xl app-accent-bg text-white flex items-center justify-center text-xl app-brand-shadow">
              ðŸ“°
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                BeitrÃ¤ge
              </p>
              <p className="text-2xl font-black mt-1">
                {posts.length}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4">
              <p className="text-xs text-zinc-500">
                Ungelesen
              </p>
              <p className="text-2xl font-black mt-1">
                {unreadPosts.length}
              </p>
            </div>
          </div>

          {unreadPosts.length > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllOpened()}
              className="w-full mt-5 app-accent-bg text-white px-4 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Alle als gelesen markieren
            </button>
          )}

          {loading && (
            <div className="mt-5 bg-zinc-50 rounded-2xl p-4">
              <p className="text-zinc-500">
                News werden geladen...
              </p>
            </div>
          )}
        </div>
      </section>

      {pinnedPosts.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-black">
            Fixiert
          </h3>
          <p className="text-zinc-500 mt-1">
            Wichtige BeitrÃ¤ge.
          </p>

          <div className="space-y-3 mt-5">
            {pinnedPosts.slice(0, 4).map((post) => {
              const unread = !openedIds.includes(post.id);
              const category = getPostCategory(post);

              return (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="block bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition"
                >
                  <div className="flex flex-wrap gap-2">
                    {category && (
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-bold ${getCategoryClass(
                          category,
                        )}`}
                      >
                        {getCategoryLabel(category)}
                      </span>
                    )}

                    {unread && (
                      <span className="text-[11px] app-accent-bg text-white px-2 py-1 rounded-full font-bold">
                        Neu
                      </span>
                    )}
                  </div>

                  <h4 className="font-black mt-3 line-clamp-2">
                    {post.title}
                  </h4>

                  <p className="text-xs text-zinc-500 mt-2">
                    {post.createdAt}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-black">
          Neueste BeitrÃ¤ge
        </h3>
        <p className="text-zinc-500 mt-1">
          Die letzten Meldungen.
        </p>

        {latestPosts.length === 0 && !loading && (
          <div className="mt-5 border border-dashed border-zinc-200 rounded-2xl p-5 text-center">
            <p className="text-zinc-500">
              Noch keine News vorhanden.
            </p>
          </div>
        )}

        <div className="space-y-3 mt-5">
          {latestPosts.map((post) => {
            const unread = !openedIds.includes(post.id);
            const category = getPostCategory(post);

            return (
              <Link
                key={post.id}
                href={`/news/${post.id}`}
                className="block border border-zinc-100 hover:border-indigo-200 rounded-2xl p-4 transition"
              >
                <div className="flex flex-wrap gap-2">
                  {category && (
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full font-bold ${getCategoryClass(
                        category,
                      )}`}
                    >
                      {getCategoryLabel(category)}
                    </span>
                  )}

                  {unread && (
                    <span className="text-[11px] app-accent-bg text-white px-2 py-1 rounded-full font-bold">
                      Neu
                    </span>
                  )}
                </div>

                <h4 className="font-black mt-3 line-clamp-2">
                  {post.title}
                </h4>

                <p className="text-xs text-zinc-500 mt-2">
                  {post.createdAt}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-black">
          Kategorien
        </h3>
        <p className="text-zinc-500 mt-1">
          News nach Bereichen filtern.
        </p>

        {categories.length === 0 && (
          <div className="mt-5 border border-dashed border-zinc-200 rounded-2xl p-5 text-center">
            <p className="text-zinc-500">
              Noch keine News-Kategorien vorhanden.
            </p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/news?category=${encodeURIComponent(category)}`}
                className={`text-xs px-3 py-2 rounded-full font-bold transition hover:scale-[1.02] ${getCategoryClass(
                  category,
                )}`}
              >
                {getCategoryLabel(category)}
              </Link>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
