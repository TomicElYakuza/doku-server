"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import NewsSidebar from "../components/news/NewsSidebar";

import {
  newsRepository,
} from "../lib/newsRepository";

import type {
  NewsPost,
} from "../lib/newsStorage";

import {
  canCreate,
} from "../lib/permissions";

function getCategoryClass(
  category: string
) {
  if (category === "Tickets") {
    return "bg-blue-50 text-blue-700";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (category === "System") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-amber-50 text-amber-700";
}

function NewsCard({
  post,
  featured = false,
  opened,
}: {
  post: NewsPost;
  featured?: boolean;
  opened: boolean;
}) {
  return (
    <article
      id={`news-${post.id}`}
      className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition ${
        featured
          ? "p-8"
          : "p-6"
      } ${
        opened
          ? "border-zinc-200"
          : "border-red-200 shadow-red-50"
      }`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(post.category)}`}>
              {post.category}
            </span>

            {post.pinned && (
              <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                Fixiert
              </span>
            )}

            {!opened && (
              <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">
                Neu
              </span>
            )}

            <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
              {post.createdAt}
            </span>
          </div>

          <h2
            className={`font-black tracking-tight mt-5 ${
              featured
                ? "text-4xl"
                : "text-2xl"
            }`}
          >
            {post.title}
          </h2>

          <p
            className={`text-zinc-500 mt-3 leading-relaxed ${
              featured
                ? "text-lg"
                : "text-base"
            }`}
          >
            {post.description}
          </p>

          <p className="text-zinc-600 mt-5 leading-relaxed">
            {post.content}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-zinc-500">
            <span>
              Autor:{" "}
              <span className="font-medium text-zinc-800">
                {post.author}
              </span>
            </span>

            <span
              className={`font-mono ${
                opened
                  ? "text-zinc-400"
                  : "text-red-600 font-semibold"
              }`}
            >
              Beitrag #{post.id}
            </span>
          </div>
        </div>

        <Link
          href={`/news/${post.id}`}
          className="hidden md:inline-flex bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition shrink-0"
        >
          Öffnen
        </Link>
      </div>
    </article>
  );
}

export default function NewsLandingPage() {
  const searchParams =
    useSearchParams();

  const activeCategory =
    searchParams.get("category") || "";

  const [posts, setPosts] =
    useState<NewsPost[]>([]);

  const [openedIds, setOpenedIds] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    loadNewsData();

    function handleNewsUpdated() {
      loadNewsData();
    }

    function handleNewsOpenedUpdated() {
      loadOpenedIds();
    }

    window.addEventListener(
      "newsUpdated",
      handleNewsUpdated
    );

    window.addEventListener(
      "newsOpenedUpdated",
      handleNewsOpenedUpdated
    );

    window.addEventListener(
      "userUpdated",
      handleNewsUpdated
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

      window.removeEventListener(
        "userUpdated",
        handleNewsUpdated
      );
    };
  }, []);

  function loadNewsData() {
    setPosts(
      newsRepository.list()
    );

    loadOpenedIds();
  }

  function loadOpenedIds() {
    setOpenedIds(
      newsRepository.getOpenedIds()
    );
  }

  function handleMarkAllRead() {
    newsRepository.markAllOpened();

    loadOpenedIds();
  }

  function resetSearch() {
    setSearch("");
  }

  const searchedPosts =
    search.trim()
      ? newsRepository.search(
          search
        )
      : posts;

  const visiblePosts =
    activeCategory
      ? searchedPosts.filter(
          (post) =>
            post.category === activeCategory
        )
      : searchedPosts;

  const pinnedPosts =
    newsRepository
      .listPinned()
      .filter(
        (post) =>
          visiblePosts.some(
            (visiblePost) =>
              visiblePost.id === post.id
          )
      );

  const latestPosts =
    newsRepository.listLatest(
      5
    );

  const featuredPost =
    activeCategory || search.trim()
      ? visiblePosts[0]
      : pinnedPosts[0] ||
        visiblePosts[0];

  const normalPosts =
    visiblePosts.filter(
      (post) =>
        post.id !== featuredPost?.id
    );

  const unreadCount =
    posts.filter(
      (post) =>
        !openedIds.includes(
          post.id
        )
    ).length;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <NewsSidebar />

        <div className="min-w-0 space-y-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold">
                News
              </h1>

              <p className="text-zinc-500 mt-2">
                Interne Neuigkeiten, Ankündigungen und wichtige Informationen
              </p>

              {activeCategory && (
                <p className="text-sm text-zinc-500 mt-3">
                  Gefiltert nach Kategorie:{" "}
                  <span className="font-semibold text-zinc-900">
                    {activeCategory}
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="bg-white border border-zinc-200 text-zinc-700 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
                >
                  Alle als gelesen markieren
                </button>
              )}

              {canCreate() && (
                <Link
                  href="/admin/news"
                  className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
                >
                  News verwalten
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  News durchsuchen
                </label>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Suche nach Titel, Inhalt, Kategorie, Autor oder ID..."
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                />
              </div>

              <button
                type="button"
                onClick={resetSearch}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-4 rounded-2xl transition"
              >
                Suche zurücksetzen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                News gesamt
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {posts.length}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                veröffentlichte Meldungen
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Ungelesen
              </p>

              <h2 className="text-4xl font-bold mt-3 text-red-600">
                {unreadCount}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                noch nicht geöffnete Beiträge
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <p className="text-sm text-zinc-500">
                Treffer
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {visiblePosts.length}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                passende Beiträge
              </p>
            </div>
          </div>

          {featuredPost && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-semibold">
                  Hervorgehobene Meldung
                </h2>

                {(activeCategory || search.trim()) && (
                  <Link
                    href="/"
                    onClick={resetSearch}
                    className="text-sm bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                  >
                    Filter entfernen
                  </Link>
                )}
              </div>

              <NewsCard
                post={featuredPost}
                featured
                opened={openedIds.includes(
                  featuredPost.id
                )}
              />
            </div>
          )}

          {!featuredPost && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine News gefunden.
              </p>
            </div>
          )}

          {featuredPost && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Weitere Beiträge
              </h2>

              <div className="grid gap-4">
                {normalPosts.length === 0 && (
                  <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                    <p className="text-zinc-500">
                      Keine weiteren News vorhanden.
                    </p>
                  </div>
                )}

                {normalPosts.map(
                  (post) => (
                    <NewsCard
                      key={post.id}
                      post={post}
                      opened={openedIds.includes(
                        post.id
                      )}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {latestPosts.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                Neueste Beiträge
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
                {latestPosts.map(
                  (post) => (
                    <Link
                      key={post.id}
                      href={`/news/${post.id}`}
                      className="border border-zinc-200 rounded-2xl p-4 hover:bg-zinc-50 transition"
                    >
                      <p className="text-xs text-zinc-500">
                        #{post.id} · {post.category}
                      </p>

                      <p className="font-semibold mt-2 line-clamp-2">
                        {post.title}
                      </p>
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}