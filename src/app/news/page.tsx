"use client";

import {
  usePermissions,
} from "../../hooks/usePermissions";

import AccessDeniedCard from "../../components/AccessDeniedCard";

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

import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  newsRepository,
} from "../../lib/newsRepository";
import {
  canManageSystem,
} from "../../lib/permissions";
import type {
  NewsPost,
} from "../../types/news";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

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

function formatTextPreview(
  value: string,
  maxLength = 180,
) {
  const text = value
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getPostCategory(post: NewsPost) {
  return String(post.category || "");
}

function getPostDate(post: NewsPost) {
  const value =
    post.publishedAt || post.createdAt;

  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default function NewsLandingPage() {

  const {
    loading: permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const canViewNews =
    isAdmin ||
    hasAnyPermission([
      "news.view",
    ]);

  const canManageNews =
    isAdmin ||
    hasAnyPermission([
      "news.create",
      "news.edit",
      "news.delete",
    ]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryFilter = searchParams.get("category") || "";

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
      setCategoriesLoading(true);
      setError("");

      const [
        nextPosts,
        nextOpenedIds,
        nextCategories,
      ] = await Promise.all([
        newsRepository.list(),
        newsRepository.getOpenedIds(),
        newsRepository.listCategories(),
      ]);

      setPosts(Array.isArray(nextPosts) ? nextPosts : []);
      setOpenedIds(
        Array.isArray(nextOpenedIds) ? nextOpenedIds : [],
      );
      setCategories(
        Array.isArray(nextCategories)
          ? nextCategories.filter(Boolean)
          : [],
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "News konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
      setCategoriesLoading(false);
    }
  }

  async function loadOpenedIds() {
    try {
      const nextOpenedIds = await newsRepository.getOpenedIds();

      setOpenedIds(
        Array.isArray(nextOpenedIds) ? nextOpenedIds : [],
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

  const visibleCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories,
          ...posts
            .map((post) => getPostCategory(post))
            .filter(Boolean),
        ]),
      ).sort((first, second) => first.localeCompare(second)),
    [
      categories,
      posts,
    ],
  );

  const filteredPosts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return posts.filter((post) => {
      const postCategory = getPostCategory(post);

      const matchesCategory =
        !categoryFilter ||
        postCategory === categoryFilter;

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
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [
    posts,
    search,
    categoryFilter,
  ]);

  const pinnedPosts = useMemo(
    () => filteredPosts.filter((post) => post.pinned),
    [
      filteredPosts,
    ],
  );

  const normalPosts = useMemo(
    () => filteredPosts.filter((post) => !post.pinned),
    [
      filteredPosts,
    ],
  );

  const unreadCount = useMemo(
    () => posts.filter((post) => !openedIds.includes(post.id)).length,
    [
      posts,
      openedIds,
    ],
  );

  const pinnedCount = useMemo(
    () => posts.filter((post) => post.pinned).length,
    [
      posts,
    ],
  );

  function resetFilters() {
    setSearch("");
    router.push("/news");
  }

  function handleCategoryChange(value: string) {
    if (!value) {
      router.push("/news");
      return;
    }

    router.push(`/news?category=${encodeURIComponent(value)}`);
  }

  function renderPostCard(
    post: NewsPost,
    variant: "pinned" | "normal",
  ) {
    const unread = !openedIds.includes(post.id);
    const postCategory = getPostCategory(post);

    return (
      <article
        key={post.id}
        className={`bg-white border rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative ${
          variant === "pinned"
            ? "border-indigo-200"
            : "border-zinc-200"
        }`}
      >
        <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {postCategory && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${getCategoryClass(
                      postCategory,
                    )}`}
                  >
                    {postCategory}
                  </span>
                )}

                {variant === "pinned" && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    Fixiert
                  </span>
                )}

                <span
                  className={
                    unread
                      ? "text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold"
                      : "text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full font-bold"
                  }
                >
                  {unread ? "Neu" : "Gelesen"}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-[-0.03em] text-zinc-950 mt-4 line-clamp-2">
                {post.title}
              </h2>

              <p className="text-zinc-500 mt-3 leading-7 line-clamp-2">
                {post.description || "Keine Beschreibung vorhanden."}
              </p>

              {post.content && (
                <p className="text-sm text-zinc-400 mt-4 leading-7 line-clamp-3">
                  {formatTextPreview(post.content)}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-5 text-sm text-zinc-500">
                <span>
                  Autor:{" "}
                  <strong className="text-zinc-700">
                    {post.author || "Unbekannt"}
                  </strong>
                </span>

                <span>
                  Erstellt:{" "}
                  <strong className="text-zinc-700">
                    {getPostDate(post)}
                  </strong>
                </span>
              </div>
            </div>

            <Link
              href={`/news/${post.id}`}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow shrink-0 text-center"
            >
              Öffnen
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (permissionsLoading) {
    return (
      <LoadingState
        title="Berechtigungen werden geprüft..."
        description="Dein News-Zugriff wird vorbereitet."
      />
    );
  }

  if (!canViewNews) {
    return (
      <AccessDeniedCard
        title="News nicht freigegeben"
        description="Dein Benutzer hat keine Berechtigung für die News. Ein Administrator kann das Recht news.view vergeben."
        backHref="/forbidden"
        backLabel="Zur Fehlerseite"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis News"
        title="News"
        description="Aktuelle interne Meldungen, Systeminformationen und wichtige Beiträge aus dem Workspace."
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
            label: `${visibleCategories.length} Kategorien`,
          },
        ]}
        actions={
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllOpened()}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                Alle als gelesen markieren
              </button>
            )}

            {canManageNews && (
              <Link
                href="/admin/news"
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
              >
                News verwalten
              </Link>
            )}
          </>
        }
      />

      {loading && (
        <LoadingState
          title="News werden geladen..."
          description="Beiträge, Kategorien und Lesestatus werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="News konnten nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadData()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              icon="👁️"
              tone="orange"
            />

            <StatCard
              label="Fixiert"
              value={pinnedCount}
              description="Priorisierte Beiträge"
              icon="⭐"
              tone="indigo"
            />

            <StatCard
              label="Kategorien"
              value={visibleCategories.length}
              description="Aktive Gruppierung"
              icon="🏷️"
              tone="blue"
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
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
                    Suche zurücksetzen
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
                    handleCategoryChange(event.target.value)
                  }
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Kategorien
                  </option>

                  {visibleCategories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {categoriesLoading && (
                <p className="text-sm text-zinc-500 mt-4">
                  Kategorien werden geladen...
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-5">
                {visibleCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCategoryChange(item)}
                    className={`text-sm px-4 py-2 rounded-full border transition font-bold ${
                      categoryFilter === item
                        ? "app-accent-bg text-white border-transparent app-brand-shadow"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
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
            </div>
          </section>

          {filteredPosts.length === 0 && (
            <EmptyState
              icon="📰"
              title="Keine News gefunden"
              description="Es gibt noch keine passenden Beiträge. Passe Suche oder Kategorie an."
              action={
                canManageSystem() ? (
                  <Link
                    href="/admin/news"
                    className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                  >
                    News verwalten
                  </Link>
                ) : undefined
              }
            />
          )}

          {pinnedPosts.length > 0 && (
            <section className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    Fixiert
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Wichtige Beiträge und Systemmeldungen.
                  </p>
                </div>

                <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                  {pinnedPosts.length}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                    Alle weiteren Beiträge aus dem Intranet.
                  </p>
                </div>

                <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
                  {normalPosts.length}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {normalPosts.map((post) =>
                  renderPostCard(post, "normal"),
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}