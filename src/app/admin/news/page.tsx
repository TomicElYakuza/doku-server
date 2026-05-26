"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  newsRepository,
} from "../../../lib/newsRepository";

import {
  saveNewsCreatedActivity,
  saveNewsDeletedActivity,
  saveNewsUpdatedActivity,
} from "../../../lib/newsActivityHelpers";

import {
  usePermissions,
} from "../../../hooks/usePermissions";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

import type {
  NewsCategory,
  NewsPost,
} from "../../../types/news";

const defaultCategories: NewsCategory[] = [
  "Allgemein",
  "System",
  "Tickets",
  "Wiki",
  "Organisation",
];

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

export default function AdminNewsPage() {
  const {
    user,
    loading:
      permissionsLoading,
    isAdmin,
    hasAnyPermission,
  } =
    usePermissions();

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

  const [mounted, setMounted] =
    useState(false);

  const [posts, setPosts] =
    useState<NewsPost[]>([]);

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [pinnedFilter, setPinnedFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingPostId, setEditingPostId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [content, setContent] =
    useState("");

  const [category, setCategory] =
    useState<NewsCategory>("Allgemein");

  const [author, setAuthor] =
    useState("System");

  const [pinned, setPinned] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    void loadPosts();

    function handleNewsUpdated() {
      void loadPosts();
    }

    window.addEventListener(
      "newsUpdated",
      handleNewsUpdated
    );

    return () => {
      window.removeEventListener(
        "newsUpdated",
        handleNewsUpdated
      );
    };
  }, []);

  async function loadPosts() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextPosts =
        await newsRepository.list();

      setPosts(
        Array.isArray(
          nextPosts
        )
          ? nextPosts
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

  function resetForm() {
    setEditingPostId("");
    setTitle("");
    setDescription("");
    setContent("");
    setCategory("Allgemein");
    setAuthor(
      user?.name ||
        "System"
    );
    setPinned(false);
    setShowForm(false);
  }

  function openCreateForm() {
    if (!canCreateNews) {
      alert(
        "Du hast keine Berechtigung, News zu erstellen."
      );

      return;
    }

    resetForm();

    setShowForm(
      true
    );
  }

  function startEditPost(
    post: NewsPost
  ) {
    if (!canEditNews) {
      alert(
        "Du hast keine Berechtigung, News zu bearbeiten."
      );

      return;
    }

    setEditingPostId(
      post.id
    );

    setTitle(
      post.title
    );

    setDescription(
      post.description
    );

    setContent(
      post.content
    );

    setCategory(
      (post.category ||
        "Allgemein") as NewsCategory
    );

    setAuthor(
      post.author ||
        user?.name ||
        "System"
    );

    setPinned(
      Boolean(
        post.pinned
      )
    );

    setShowForm(
      true
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set([
            ...defaultCategories,
            ...posts.map(
              (post) =>
                String(
                  post.category ||
                    "Allgemein"
                ) as NewsCategory
            ),
          ])
        ),
      [
        posts,
      ]
    );

  const filteredPosts =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return posts.filter(
          (post) => {
            const matchesSearch =
              !query ||
              [
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
                .includes(
                  query
                );

            const matchesCategory =
              !categoryFilter ||
              post.category === categoryFilter;

            const matchesPinned =
              !pinnedFilter ||
              (
                pinnedFilter === "pinned" &&
                post.pinned
              ) ||
              (
                pinnedFilter === "normal" &&
                !post.pinned
              );

            return (
              matchesSearch &&
              matchesCategory &&
              matchesPinned
            );
          }
        );
      },
      [
        posts,
        search,
        categoryFilter,
        pinnedFilter,
      ]
    );

  const pinnedCount =
    posts.filter(
      (post) =>
        post.pinned
    ).length;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      editingPostId &&
      !canEditNews
    ) {
      alert(
        "Du hast keine Berechtigung, News zu bearbeiten."
      );

      return;
    }

    if (
      !editingPostId &&
      !canCreateNews
    ) {
      alert(
        "Du hast keine Berechtigung, News zu erstellen."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      if (editingPostId) {
        const updatedPost =
          await newsRepository.update(
            editingPostId,
            {
              title:
                title.trim(),

              description:
                description.trim(),

              content:
                content.trim(),

              category:
                category ||
                "Allgemein",

              author:
                author.trim() ||
                user?.name ||
                "System",

              pinned,
            }
          );

        if (updatedPost) {
          saveNewsUpdatedActivity(
            updatedPost
          );
        }

        resetForm();

        await loadPosts();

        return;
      }

      const createdPost =
        await newsRepository.create({
          title:
            title.trim(),

          description:
            description.trim(),

          content:
            content.trim(),

          category:
            category ||
            "Allgemein",

          author:
            author.trim() ||
            user?.name ||
            "System",

          pinned,
        });

      saveNewsCreatedActivity(
        createdPost
      );

      resetForm();

      await loadPosts();
    } catch (saveError) {
      console.error(
        saveError
      );

      alert(
        saveError instanceof Error
          ? saveError.message
          : "News konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDeletePost(
    post: NewsPost
  ) {
    if (!canDeleteNews) {
      alert(
        "Du hast keine Berechtigung, News zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `News "${post.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    try {
      saveNewsDeletedActivity(
        post
      );

      await newsRepository.delete(
        post.id
      );

      await loadPosts();
    } catch (deleteError) {
      console.error(
        deleteError
      );

      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "News konnte nicht gelöscht werden."
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("");
    setPinnedFilter("");
  }

  if (!mounted) {
    return null;
  }

  if (permissionsLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <p className="text-zinc-500">
          Berechtigungen werden geladen...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDeniedCard />
    );
  }

  if (!canUseAdminNews) {
    return (
      <AccessDeniedCard />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            News-Verwaltung
          </h1>

          <p className="text-zinc-500 mt-2">
            Neuigkeiten erstellen, bearbeiten, fixieren und löschen.
          </p>
        </div>

        {canCreateNews && (
          <button
            type="button"
            onClick={openCreateForm}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            News erstellen
          </button>
        )}
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={resetFilters}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            News gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {posts.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setPinnedFilter(
              "pinned"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Fixiert
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pinnedCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setPinnedFilter(
              "normal"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Normal
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {posts.length - pinnedCount}
          </h2>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(event) =>
            void handleSubmit(
              event
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold">
              {editingPostId
                ? "News bearbeiten"
                : "News erstellen"}
            </h2>

            <p className="text-zinc-500 mt-1">
              Beitrag wird direkt in PostgreSQL gespeichert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
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
                onChange={(event) =>
                  setCategory(
                    event.target.value as NewsCategory
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Autor
              </label>

              <input
                value={author}
                onChange={(event) =>
                  setAuthor(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="System"
              />
            </div>

            <label className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-5">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) =>
                  setPinned(
                    event.target.checked
                  )
                }
              />

              <span className="font-medium">
                News fixieren
              </span>
            </label>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Kurzbeschreibung
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={3}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Kurze Beschreibung..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Inhalt
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                rows={12}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-y"
                placeholder="Inhalt der News..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {saving
                ? "Speichert..."
                : editingPostId
                  ? "Änderungen speichern"
                  : "News erstellen"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-5">
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
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="News suchen..."
          />

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Kategorien
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={pinnedFilter}
            onChange={(event) =>
              setPinnedFilter(
                event.target.value
              )
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
      </div>

      <div className="space-y-4">
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

        {filteredPosts.map(
          (post) => (
            <div
              key={post.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
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
                    {post.description ||
                      "Keine Beschreibung vorhanden."}
                  </p>

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
                      onClick={() =>
                        startEditPost(
                          post
                        )
                      }
                      className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                    >
                      Bearbeiten
                    </button>
                  )}

                  {canDeleteNews && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleDeletePost(
                          post
                        )
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}