"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
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

function getPostDescription(post: NewsPost) {
  return (
    post.description ||
    "Keine Beschreibung vorhanden."
  );
}

function getPostAuthor(post: NewsPost) {
  return (
    post.author ||
    "System"
  );
}

function formatTextPreview(
  value: string,
  maxLength = 190,
) {
  const text = value
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getReadingTime(post: NewsPost) {
  const text = [
    post.title,
    post.description,
    post.content,
  ]
    .filter(Boolean)
    .join(" ");

  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 180));
}

export default function NewsLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryFilter =
    searchParams.get("category") || "";

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
      setError("");

      const [
        nextPosts,
        nextOpenedIds,
      ] = await Promise.all([
        newsRepository.list(),
        newsRepository.getOpenedIds(),
      ]);

      setPosts(Array.isArray(nextPosts) ? nextPosts : []);
      setOpenedIds(Array.isArray(nextOpenedIds) ? nextOpenedIds : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "News konnten nicht geladen werden.",
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
    } catch (loadError) {
      console.error(loadError);
    }
  }

  async function handleMarkAllOpened() {
    try {
      await newsRepository.markAllOpened();
      await loadData();
    } catch (markError) {
      console.error(markError);

      alert(
        markError instanceof Error
          ? markError.message
          : "News konnten nicht als gelesen markiert werden.",
      );
    }
  }

  function handleCategoryFilter(nextCategory: string) {
    if (!nextCategory) {
      router.push("/news");
      return;
    }

    router.push(
      `/news?category=${encodeURIComponent(nextCategory)}`,
    );
  }

  function resetFilters() {
    setSearch("");
    router.push("/news");
  }

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

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const category = getPostCategory(post);

      const matchesCategory =
        !categoryFilter ||
        category === categoryFilter;

      const matchesSearch =
        !query ||
        [
          post.id,
          post.title,
          post.description,
          post.content,
          post.author,
          category,
          post.createdAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [
    posts,
    search,
    categoryFilter,
  ]);

  const pinnedPosts = useMemo(
    () =>
      filteredPosts.filter((post) => post.pinned),
    [
      filteredPosts,
    ],
  );

  const normalPosts = useMemo(
    () =>
      filteredPosts.filter((post) => !post.pinned),
    [
      filteredPosts,
    ],
  );

  const unreadCount = useMemo(
    () =>
      posts.filter((post) => !openedIds.includes(post.id)).length,
    [
      posts,
      openedIds,
    ],
  );

  const pinnedCount = useMemo(
    () =>
      posts.filter((post) => post.pinned).length,
    [
      posts,
    ],
  );

  const latestPost = posts[0];

  function renderPostCard(
    post: NewsPost,
    variant: "pinned" | "normal",
  ) {
    const unread = !openedIds.includes(post.id);
    const category = getPostCategory(post);
    const readingTime = getReadingTime(post);

    return (
      <Link
        key={post.id}
        href={`/news/${post.id}`}
        className={`group relative overflow-hidden block border rounded-3xl p-6 shadow-sm hover:shadow-md transition ${
          variant === "pinned"
            ? "bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(37,99,235,0.04)),#ffffff] border-indigo-100"
            : "bg-white border-zinc-200 hover:border-indigo-200"
        }`}
      >
        {variant === "pinned" && (
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />
        )}

        <div className="relative">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${getCategoryClass(
                  category,
                )}`}
              >
                {category}
              </span>
            )}

            {variant === "pinned" && (
              <span className="text-xs app-accent-bg text-white px-3 py-1 rounded-full font-bold">
                Fixiert
              </span>
            )}

            {unread && (
              <span className="text-xs app-accent-bg text-white px-3 py-1 rounded-full font-bold app-brand-shadow">
                Neu
              </span>
            )}

            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              {readingTime} Min. Lesen
            </span>
          </div>

          <h2 className="text-2xl font-black text-zinc-950 mt-5 group-hover:app-accent-text transition line-clamp-2">
            {post.title}
          </h2>

          <p className="text-zinc-500 mt-3 leading-7 line-clamp-3">
            {getPostDescription(post)}
          </p>

          {post.content && (
            <p className="text-sm text-zinc-400 mt-3 line-clamp-2">
              {formatTextPreview(post.content)}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-3">
              <p className="text-xs text-zinc-500">
                Autor
              </p>
              <p className="font-bold mt-1 line-clamp-1">
                {getPostAuthor(post)}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-3">
              <p className="text-xs text-zinc-500">
                Erstellt
              </p>
              <p className="font-bold mt-1 line-clamp-1">
                {post.createdAt || "-"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-3">
              <p className="text-xs text-zinc-500">
                Status
              </p>
              <p className="font-bold mt-1">
                {unread ? "Ungelesen" : "Gelesen"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-zinc-100">
            <span className="text-sm font-bold app-accent-text">
              Beitrag öffnen →
            </span>

            <span className="text-xs text-zinc-400">
              ID: {post.id}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Unternehmensnews"
        title="News"
        description="Aktuelle Meldungen, wichtige Informationen und interne Updates für den Velunis Workspace."
        badges={[
          {
            label: `${posts.length} Beiträge`,
          },
          {
            label: `${unreadCount} ungelesen`,
          },
          {
            label: `${pinnedCount} fixiert`,
          },
          {
            label: latestPost
              ? `Neueste: ${latestPost.createdAt}`
              : "Noch keine News",
          },
        ]}
        actions={
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllOpened()}
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
              >
                Alle als gelesen markieren
              </button>
            )}

            {canManageSystem() && (
              <Link
                href="/admin/news"
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                News verwalten
              </Link>
            )}
          </>
        }
      />

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="News gesamt"
          value={posts.length}
          description="Alle sichtbaren Beiträge"
          icon="📰"
          active={!search && !categoryFilter}
          onClick={resetFilters}
        />

        <StatCard
          label="Ungelesen"
          value={unreadCount}
          description="Noch nicht geöffnet"
          icon="✨"
          tone="blue"
        />

        <StatCard
          label="Fixiert"
          value={pinnedCount}
          description="Priorisierte Beiträge"
          icon="📌"
          tone="indigo"
        />

        <StatCard
          label="Kategorien"
          value={categories.length}
          description="Aktive News-Bereiche"
          icon="🗂️"
          tone="purple"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold">
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
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            placeholder="News durchsuchen..."
          />

          <select
            value={categoryFilter}
            onChange={(event) =>
              handleCategoryFilter(event.target.value)
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <span className="text-sm text-zinc-500">
            {filteredPosts.length} von {posts.length} News gefunden.
          </span>

          {search && (
            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
              Suche: {search}
            </span>
          )}

          {categoryFilter && (
            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
              Kategorie: {categoryFilter}
            </span>
          )}
        </div>
      </section>

      {!loading && !error && filteredPosts.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
            🔎
          </div>
          <h2 className="text-xl font-semibold mt-5">
            Keine News gefunden
          </h2>
          <p className="text-zinc-500 mt-2">
            Es gibt noch keine passenden Beiträge.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow font-bold"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      {pinnedPosts.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                Fixiert
              </h2>
              <p className="text-zinc-500 mt-1">
                Wichtige Beiträge mit Priorität.
              </p>
            </div>

            <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
              {pinnedPosts.length} Beiträge
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {pinnedPosts.map((post) =>
              renderPostCard(post, "pinned"),
            )}
          </div>
        </section>
      )}

      {normalPosts.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                Alle Neuigkeiten
              </h2>
              <p className="text-zinc-500 mt-1">
                Aktuelle interne Meldungen und Updates.
              </p>
            </div>

            <span className="rounded-full bg-zinc-100 text-zinc-700 px-4 py-2 text-sm font-bold">
              {normalPosts.length} Beiträge
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {normalPosts.map((post) =>
              renderPostCard(post, "normal"),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
