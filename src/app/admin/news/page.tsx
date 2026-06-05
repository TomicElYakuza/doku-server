"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import { newsRepository } from "../../../lib/newsRepository";
import {
  saveNewsCreatedActivity,
  saveNewsDeletedActivity,
  saveNewsUpdatedActivity,
} from "../../../lib/newsActivityHelpers";
import { usePermissions } from "../../../hooks/usePermissions";
import type { NewsPost } from "../../../types/news";

type PinnedFilter = "" | "pinned" | "normal";

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
  return String(post.category || "");
}

function getPostDescription(post: NewsPost) {
  return post.description || "Keine Kurzbeschreibung vorhanden.";
}

function getPostContent(post: NewsPost) {
  return post.content || "";
}

function getPostAuthor(post: NewsPost) {
  return post.author || "System";
}

export default function AdminNewsPage() {
  const {
    user,
    loading: permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const canManageNews =
    isAdmin ||
    hasAnyPermission([
      "news.manage",
    ]);

  const canCreateNews =
    canManageNews ||
    hasAnyPermission([
      "news.create",
    ]);

  const canEditNews =
    canManageNews ||
    hasAnyPermission([
      "news.edit",
    ]);

  const canDeleteNews =
    canManageNews ||
    hasAnyPermission([
      "news.delete",
    ]);

  const canUseAdminNews =
    canManageNews ||
    canCreateNews ||
    canEditNews ||
    canDeleteNews;

  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [pinnedFilter, setPinnedFilter] = useState<PinnedFilter>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("System");
  const [pinned, setPinned] = useState(false);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadData();

    function handleNewsUpdated() {
      void loadData();
    }

    window.addEventListener("newsUpdated", handleNewsUpdated);

    return () => {
      window.removeEventListener("newsUpdated", handleNewsUpdated);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setCategoriesLoading(true);
      setError("");

      const [
        nextPosts,
        nextCategories,
      ] = await Promise.all([
        newsRepository.list(),
        newsRepository.listCategories(),
      ]);

      const normalizedCategories = Array.isArray(nextCategories)
        ? nextCategories.filter(Boolean)
        : [];

      setPosts(Array.isArray(nextPosts) ? nextPosts : []);
      setCategories(normalizedCategories);

      if (!category && normalizedCategories.length > 0) {
        setCategory(normalizedCategories[0]);
      }
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
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const postCategory = getPostCategory(post);

      const matchesSearch =
        !query ||
        [
          post.id,
          post.title,
          post.description,
          post.content,
          post.category,
          post.author,
          post.createdAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !categoryFilter ||
        postCategory === categoryFilter;

      const matchesPinned =
        !pinnedFilter ||
        (pinnedFilter === "pinned" && post.pinned) ||
        (pinnedFilter === "normal" && !post.pinned);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPinned
      );
    });
  }, [
    posts,
    search,
    categoryFilter,
    pinnedFilter,
  ]);

  const pinnedCount = useMemo(
    () => posts.filter((post) => post.pinned).length,
    [
      posts,
    ],
  );

  const normalCount = posts.length - pinnedCount;

  function getDefaultCategory() {
    return visibleCategories[0] || "";
  }

  function resetForm() {
    setEditingPostId("");
    setTitle("");
    setDescription("");
    setContent("");
    setCategory(getDefaultCategory());
    setAuthor(user?.name || "System");
    setPinned(false);
  }

  function openCreateForm() {
    if (!canCreateNews) {
      alert("Du hast keine Berechtigung, News zu erstellen.");
      return;
    }

    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function startEditPost(post: NewsPost) {
    if (!canEditNews) {
      alert("Du hast keine Berechtigung, News zu bearbeiten.");
      return;
    }

    setEditingPostId(post.id);
    setTitle(post.title);
    setDescription(post.description);
    setContent(post.content);
    setCategory(getPostCategory(post));
    setAuthor(post.author || user?.name || "System");
    setPinned(Boolean(post.pinned));
    setModalOpen(true);
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setPinnedFilter("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (editingPostId && !canEditNews) {
      alert("Du hast keine Berechtigung, News zu bearbeiten.");
      return;
    }

    if (!editingPostId && !canCreateNews) {
      alert("Du hast keine Berechtigung, News zu erstellen.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Kategorie aus dem Admin Backend auswählen.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category: category.trim(),
        author: author.trim() || user?.name || "System",
        pinned,
      };

      if (editingPostId) {
        const updatedPost = await newsRepository.update(
          editingPostId,
          payload,
        );

        if (updatedPost) {
          saveNewsUpdatedActivity(updatedPost);
        }

        closeModal();
        await loadData();
        setMessage("News-Beitrag wurde gespeichert.");
        return;
      }

      const createdPost = await newsRepository.create(payload);
      saveNewsCreatedActivity(createdPost);

      closeModal();
      await loadData();
      setMessage("News-Beitrag wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "News konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePost(post: NewsPost) {
    if (!canDeleteNews) {
      alert("Du hast keine Berechtigung, News zu löschen.");
      return;
    }

    const confirmed = confirm(
      `News "${post.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      saveNewsDeletedActivity(post);
      await newsRepository.delete(post.id);
      await loadData();

      setMessage("News-Beitrag wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "News konnte nicht gelöscht werden.",
      );
    }
  }

  if (!mounted) {
    return null;
  }

  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Berechtigungen werden geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !canUseAdminNews) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">
            Zugriff verweigert
          </h1>
          <p className="text-zinc-500 mt-2">
            Du hast keine Berechtigung für die News-Verwaltung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title={editingPostId ? "News bearbeiten" : "News erstellen"}
        description="News-Kategorien kommen aus dem Admin Backend über die zentrale Taxonomie."
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="bg-zinc-100 hover:bg-zinc-200 px-5 py-3 rounded-2xl transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="admin-news-form"
              disabled={saving || visibleCategories.length === 0}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Speichert..."
                : editingPostId
                  ? "Änderungen speichern"
                  : "News erstellen"}
            </button>
          </>
        }
      >
        <form
          id="admin-news-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          {visibleCategories.length === 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h3 className="font-semibold text-amber-800">
                Keine News-Kategorien vorhanden
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                Lege zuerst im Admin Backend unter Kategorien & Tags
                mindestens eine aktive Kategorie für News an.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Titel der News"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                disabled={visibleCategories.length === 0}
              >
                <option value="">
                  Kategorie wählen
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

            <div>
              <label className="block mb-2 font-medium">
                Autor
              </label>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="System"
              />
            </div>

            <label className="flex gap-3 items-start bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                className="h-5 w-5 mt-1"
              />
              <span>
                <span className="block font-medium">
                  News fixieren
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  Fixierte Beiträge werden oben hervorgehoben.
                </span>
              </span>
            </label>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Kurzbeschreibung
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Kurze Beschreibung..."
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block mb-2 font-medium">
                Inhalt
              </label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={12}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y"
                placeholder="Inhalt der News..."
              />
            </div>
          </div>
        </form>
      </AppModal>

      <PageHero
        eyebrow="Admin Backend"
        title="News-Verwaltung"
        description="Neuigkeiten erstellen, bearbeiten, fixieren und löschen. Kategorien kommen aus dem Admin Backend."
        badges={[
          {
            label: `${posts.length} Beiträge`,
          },
          {
            label: `${pinnedCount} fixiert`,
          },
          {
            label: `${visibleCategories.length} Kategorien`,
          },
        ]}
        actions={
          canCreateNews && (
            <button
              type="button"
              onClick={openCreateForm}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              News erstellen
            </button>
          )
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            News werden geladen...
          </p>
        </div>
      )}

      {categoriesLoading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Kategorien werden geladen...
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-medium">
            {message}
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

      {visibleCategories.length === 0 && !categoriesLoading && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-amber-800">
            Keine News-Kategorien vorhanden
          </h2>
          <p className="text-amber-700 mt-2">
            Lege im Admin Backend unter Kategorien & Tags aktive
            News-Kategorien an, bevor neue News erstellt werden.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="News gesamt"
          value={posts.length}
          description="Alle Beiträge"
          icon=""
          active={!categoryFilter && !pinnedFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Fixiert"
          value={pinnedCount}
          description="Oben hervorgehobene Beiträge"
          icon=""
          tone="orange"
          active={pinnedFilter === "pinned"}
          onClick={() => setPinnedFilter("pinned")}
        />
        <StatCard
          label="Normal"
          value={normalCount}
          description="Nicht fixierte Beiträge"
          icon=""
          tone="blue"
          active={pinnedFilter === "normal"}
          onClick={() => setPinnedFilter("normal")}
        />
        <StatCard
          label="Gefiltert"
          value={filteredPosts.length}
          description="Nach Suche und Filtern"
          icon=""
          tone="indigo"
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Inhalt, Kategorie oder Autor.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="News suchen..."
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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

          <select
            value={pinnedFilter}
            onChange={(event) =>
              setPinnedFilter(event.target.value as PinnedFilter)
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Beiträge
            </option>
            <option value="pinned">
              Nur fixiert
            </option>
            <option value="normal">
              Nicht fixiert
            </option>
          </select>
        </div>

        <p className="text-sm text-zinc-500 mt-5">
          {filteredPosts.length} von {posts.length} News gefunden.
        </p>
      </section>

      <section className="space-y-4">
        {filteredPosts.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine News gefunden
            </h2>
            <p className="text-zinc-500 mt-2">
              Erstelle einen Beitrag oder passe die Filter an.
            </p>
          </div>
        )}

        {filteredPosts.map((post) => {
          const postCategory = getPostCategory(post);

          return (
            <div
              key={post.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {postCategory && (
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(
                          postCategory,
                        )}`}
                      >
                        {postCategory}
                      </span>
                    )}

                    {post.pinned && (
                      <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                        Fixiert
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {post.title}
                  </h2>

                  <p className="text-zinc-500 mt-2 line-clamp-2">
                    {getPostDescription(post)}
                  </p>

                  {getPostContent(post) && (
                    <p className="text-zinc-400 mt-2 line-clamp-2">
                      {getPostContent(post)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
                    <span>
                      Autor: {getPostAuthor(post)}
                    </span>
                    <span>
                      Erstellt: {post.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link
                    href={`/news/${post.id}`}
                    className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                  >
                    Öffnen
                  </Link>

                  {canEditNews && (
                    <button
                      type="button"
                      onClick={() => startEditPost(post)}
                      className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                    >
                      Bearbeiten
                    </button>
                  )}

                  {canDeleteNews && (
                    <button
                      type="button"
                      onClick={() => void handleDeletePost(post)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}