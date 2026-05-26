"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  newsRepository,
} from "../../lib/newsRepository";

import {
  usePermissions,
} from "../../hooks/usePermissions";

import type {
  NewsPost,
} from "../../types/news";

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

export default function NewsLandingPage() {
  const searchParams =
    useSearchParams();

  const {
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

  const canManageNews =
    isAdmin ||
    hasAnyPermission([
      "news.manage",
      "news.create",
      "news.edit",
      "news.delete",
    ]);

  const [posts, setPosts] =
    useState<NewsPost[]>([]);

  const [openedIds, setOpenedIds] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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

      setError(
        ""
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
        Array.isArray(
          nextPosts
        )
          ? nextPosts
          : []
      );

      setOpenedIds(
        Array.isArray(
          nextOpenedIds
        )
          ? nextOpenedIds
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "News konnten nicht geladen werden."
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
        Array.isArray(
          nextOpenedIds
        )
          ? nextOpenedIds
          : []
      );
    } catch (loadError) {
      console.error(
        loadError
      );
    }
  }

  async function handleMarkAllOpened() {
    try {
      await newsRepository.markAllOpened();

      await loadData();
    } catch (markError) {
      console.error(
        markError
      );

      alert(
        markError instanceof Error
          ? markError.message
          : "News konnten nicht als gelesen markiert werden."
      );
    }
  }

  const categoryFilter =
    searchParams.get(
      "category"
    ) ||
    "";

  const categories =
    useMemo(
      () =>
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
        ).sort(
          (a, b) =>
            a.localeCompare(
              b
            )
        ),
      [
        posts,
      ]
    );

  const filteredPosts =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return posts.filter(
          (post) => {
            const category =
              String(
                post.category ||
                "Allgemein"
              );

            const matchesCategory =
              !categoryFilter ||
              category === categoryFilter;

            const matchesSearch =
              !query ||
              [
                post.title,
                post.description,
                post.content,
                post.author,
                post.category,
                post.createdAt,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            return (
              matchesCategory &&
              matchesSearch
            );
          }
        );
      },
      [
        posts,
        search,
        categoryFilter,
      ]
    );

  const pinnedPosts =
    filteredPosts.filter(
      (post) =>
        post.pinned
    );

  const normalPosts =
    filteredPosts.filter(
      (post) =>
        !post.pinned
    );

  const unreadCount =
    posts.filter(
      (post) =>
        !openedIds.includes(
          post.id
        )
    ).length;

  function renderNewsCard(
    post: NewsPost
  ) {
    const unread =
      !openedIds.includes(
        post.id
      );

    return (
      <Link
        key={post.id}
        href={`/news/${encodeURIComponent(
          post.id
        )}`}
        className="block bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
      >
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(
            String(
              post.category ||
              "Allgemein"
            )
          )}`}>
            {post.category ||
              "Allgemein"}
          </span>

          {post.pinned && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
              Fixiert
            </span>
          )}

          {unread && (
            <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">
              Neu
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold mt-4">
          {post.title}
        </h3>

        <p className="text-zinc-500 mt-2 line-clamp-2">
          {post.description ||
            "Keine Beschreibung vorhanden."}
        </p>

        <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
          <span>
            {post.author ||
              "Unbekannt"}
          </span>

          <span>
            {post.createdAt}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Neuigkeiten
          </h1>

          <p className="text-zinc-500 mt-2">
            Aktuelle Informationen, Änderungen und interne Mitteilungen.
          </p>

          {categoryFilter && (
            <p className="text-sm text-zinc-400 mt-2">
              Kategorie:{" "}
              <span className="font-medium text-zinc-600">
                {categoryFilter}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() =>
                void handleMarkAllOpened()
              }
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Alle als gelesen markieren
            </button>
          )}

          {canManageNews && (
            <Link
              href="/admin/news"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              News verwalten
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Beiträge
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {posts.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Ungelesen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {unreadCount}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Fixiert
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              posts.filter(
                (post) =>
                  post.pinned
              ).length
            }
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Kategorien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {categories.length}
          </h2>
        </div>
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Inhalt, Kategorie oder Autor.
            </p>
          </div>

          {(search || categoryFilter) && (
            <button
              type="button"
              onClick={() =>
                setSearch(
                  ""
                )
              }
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Suche zurücksetzen
            </button>
          )}
        </div>

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          placeholder="News durchsuchen..."
        />

        <div className="flex flex-wrap gap-2">
          <Link
            href="/news"
            className={`px-4 py-2 rounded-xl transition ${
              !categoryFilter
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 hover:bg-zinc-200"
            }`}
          >
            Alle
          </Link>

          {categories.map(
            (category) => (
              <Link
                key={category}
                href={`/news?category=${encodeURIComponent(
                  category
                )}`}
                className={`px-4 py-2 rounded-xl transition ${
                  categoryFilter === category
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                {category}
              </Link>
            )
          )}
        </div>

        <p className="text-sm text-zinc-500">
          {filteredPosts.length} von {posts.length} News gefunden.
        </p>
      </section>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            News werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold">
            Keine News gefunden
          </h2>

          <p className="text-zinc-500 mt-2">
            Es gibt noch keine passenden Beiträge.
          </p>
        </div>
      )}

      {pinnedPosts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Fixiert
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {pinnedPosts.map(
              renderNewsCard
            )}
          </div>
        </section>
      )}

      {normalPosts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Alle Neuigkeiten
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {normalPosts.map(
              renderNewsCard
            )}
          </div>
        </section>
      )}
    </div>
  );
}