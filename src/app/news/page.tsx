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
  canManageSystem,
} from "../../lib/permissions";

import PageHero from "../../components/PageHero";

import StatCard from "../../components/StatCard";

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

function formatTextPreview(
  value: string,
  maxLength = 180
) {
  const text =
    value
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(
    0,
    maxLength
  )}...`;
}

export default function NewsLandingPage() {
  const searchParams =
    useSearchParams();

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
    useMemo(
      () =>
        filteredPosts.filter(
          (post) =>
            post.pinned
        ),
      [
        filteredPosts,
      ]
    );

  const normalPosts =
    useMemo(
      () =>
        filteredPosts.filter(
          (post) =>
            !post.pinned
        ),
      [
        filteredPosts,
      ]
    );

  const unreadCount =
    useMemo(
      () =>
        posts.filter(
          (post) =>
            !openedIds.includes(
              post.id
            )
        ).length,
      [
        posts,
        openedIds,
      ]
    );

  function resetFilters() {
    setSearch(
      ""
    );
  }

  function renderPostCard(
    post: NewsPost,
    variant: "pinned" | "normal"
  ) {
    const unread =
      !openedIds.includes(
        post.id
      );

    return (
      <Link
        key={post.id}
        href={`/news/${post.id}`}
        className="block bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
      >
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div className="min-w-0">
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

              {variant === "pinned" && (
                <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                  Fixiert
                </span>
              )}

              {unread && (
                <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  Neu
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold mt-4">
              {post.title}
            </h2>

            <p className="text-zinc-500 mt-2">
              {post.description ||
                "Keine Beschreibung vorhanden."}
            </p>

            {post.content && (
              <p className="text-sm text-zinc-500 mt-4">
                {formatTextPreview(
                  post.content
                )}
              </p>
            )}

            <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
              <span>
                Autor:{" "}
                {post.author ||
                  "Unbekannt"}
              </span>

              <span>
                Erstellt:{" "}
                {post.createdAt}
              </span>
            </div>
          </div>

          <span className="shrink-0 bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm">
            Öffnen
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Neuigkeiten"
        title="News"
        description="Aktuelle Informationen, Änderungen und interne Mitteilungen."
        badges={[
          {
            label:
              `${posts.length} Beiträge`,
          },
          {
            label:
              `${unreadCount} ungelesen`,
          },
          {
            label:
              `${posts.filter(
                (post) =>
                  post.pinned
              ).length} fixiert`,
          },
          {
            label:
              `${categories.length} Kategorien`,
          },
        ]}
        actions={(
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void handleMarkAllOpened()
                }
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Alle als gelesen markieren
              </button>
            )}

            {canManageSystem() && (
              <Link
                href="/admin/news"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition"
              >
                News verwalten
              </Link>
            )}
          </>
        )}
      />

      {categoryFilter && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Aktiver Kategorie-Filter:{" "}
            <span className="font-semibold text-zinc-900">
              {categoryFilter}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Beiträge"
          value={posts.length}
          description="Alle News"
          icon="📰"
          active={!categoryFilter && !search}
          onClick={resetFilters}
        />

        <StatCard
          label="Ungelesen"
          value={unreadCount}
          description="Noch nicht geöffnet"
          icon="📬"
          tone="green"
        />

        <StatCard
          label="Fixiert"
          value={
            posts.filter(
              (post) =>
                post.pinned
            ).length
          }
          description="Priorisierte Beiträge"
          icon="📌"
          tone="indigo"
        />

        <StatCard
          label="Kategorien"
          value={categories.length}
          description="News-Bereiche"
          icon="🏷️"
          tone="blue"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Inhalt, Autor oder Kategorie.
            </p>
          </div>

          {(search || categoryFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Suche zurücksetzen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="News durchsuchen..."
          />

          <Link
            href="/news"
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-4 transition ${
              !categoryFilter
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 hover:bg-zinc-200"
            }`}
          >
            Alle Kategorien
          </Link>

          <select
            value={categoryFilter}
            onChange={(event) => {
              const value =
                event.target.value;

              if (!value) {
                window.location.href =
                  "/news";

                return;
              }

              window.location.href =
                `/news?category=${encodeURIComponent(
                  value
                )}`;
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Kategorie wählen
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {categories.map(
            (category) => (
              <Link
                key={category}
                href={`/news?category=${encodeURIComponent(
                  category
                )}`}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  categoryFilter === category
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {category}
              </Link>
            )
          )}
        </div>

        <p className="text-sm text-zinc-500 mt-5">
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">
              Fixiert
            </h2>

            <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
              {pinnedPosts.length}
            </span>
          </div>

          {pinnedPosts.map(
            (post) =>
              renderPostCard(
                post,
                "pinned"
              )
          )}
        </section>
      )}

      {normalPosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">
              Alle Neuigkeiten
            </h2>

            <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
              {normalPosts.length}
            </span>
          </div>

          {normalPosts.map(
            (post) =>
              renderPostCard(
                post,
                "normal"
              )
          )}
        </section>
      )}
    </div>
  );
}