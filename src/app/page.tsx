"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import NewsSidebar from "../components/news/NewsSidebar";

import {
  createNewsPost,
  getLatestNewsPosts,
  getNewsPosts,
  getNewsPostsByCategory,
  getOpenedNewsPostIds,
  getPinnedNewsPosts,
} from "../lib/newsStorage";

import type {
  NewsCategory,
  NewsPost,
} from "../lib/newsStorage";

import {
  readNewsFiles,
  saveNewsFiles,
} from "../lib/newsFileHelpers";

import type {
  PendingNewsFile,
} from "../lib/newsFileHelpers";

import {
  saveNewsCreatedActivity,
} from "../lib/newsActivityHelpers";

import {
  canCreate,
  getCurrentUser,
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

  const [showForm, setShowForm] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [content, setContent] =
    useState("");

  const [category, setCategory] =
    useState<NewsCategory>("Allgemein");

  const [pinned, setPinned] =
    useState(false);

  const [pendingFiles, setPendingFiles] =
    useState<PendingNewsFile[]>([]);

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
      getNewsPosts()
    );

    loadOpenedIds();
  }

  function loadOpenedIds() {
    setOpenedIds(
      getOpenedNewsPostIds()
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setContent("");
    setCategory("Allgemein");
    setPinned(false);
    setPendingFiles([]);
    setShowForm(false);
  }

  function openCreateForm() {
    if (!canCreate()) {
      alert(
        "Du hast keine Berechtigung, News zu erstellen."
      );

      return;
    }

    setShowForm(true);
  }

  async function handleNewsFilesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      await readNewsFiles(
        event.target.files
      );

    setPendingFiles(
      (currentFiles) => [
        ...currentFiles,
        ...files,
      ]
    );

    event.target.value =
      "";
  }

  function removePendingFile(
    index: number
  ) {
    setPendingFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_file, fileIndex) =>
            fileIndex !== index
        )
    );
  }

  function handleCreateNews() {
    if (!canCreate()) {
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

    if (!description.trim()) {
      alert(
        "Bitte eine Kurzbeschreibung eingeben."
      );

      return;
    }

    if (!content.trim()) {
      alert(
        "Bitte einen Inhalt eingeben."
      );

      return;
    }

    const user =
      getCurrentUser();

    const newPost =
      createNewsPost({
        title:
          title.trim(),

        description:
          description.trim(),

        content:
          content.trim(),

        category,

        author:
          user?.name ||
          "Unbekannt",

        pinned,
      });

    saveNewsCreatedActivity(
      newPost
    );

    if (pendingFiles.length > 0) {
      saveNewsFiles(
        newPost.id,
        pendingFiles
      );
    }

    resetForm();
  }

  const visiblePosts =
    activeCategory
      ? posts.filter(
          (post) =>
            post.category === activeCategory
        )
      : posts;

  const pinnedPosts =
    getPinnedNewsPosts();

  const latestPosts =
    getLatestNewsPosts(
      3
    );

  const featuredPost =
    activeCategory
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

            {canCreate() && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
              >
                News erstellen
              </button>
            )}
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 px-4 py-8 backdrop-blur-sm">
              <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      News erstellen
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      Erstelle eine interne Meldung für die Startseite.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-11 w-11 rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition"
                    aria-label="Fenster schließen"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                  <div className="md:col-span-2">
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
                      <option value="Allgemein">
                        Allgemein
                      </option>

                      <option value="System">
                        System
                      </option>

                      <option value="Tickets">
                        Tickets
                      </option>

                      <option value="Wiki">
                        Wiki
                      </option>

                      <option value="Organisation">
                        Organisation
                      </option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-5 py-4">
                    <span>
                      <span className="block font-medium">
                        Fixieren
                      </span>

                      <span className="block text-sm text-zinc-500 mt-1">
                        Beitrag als wichtige Meldung markieren.
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(event) =>
                        setPinned(
                          event.target.checked
                        )
                      }
                      className="h-5 w-5"
                    />
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
                      placeholder="Kurze Zusammenfassung..."
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
                      rows={7}
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                      placeholder="Vollständiger Inhalt der News..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 font-medium">
                      Dateien & Anhänge
                    </label>

                    <input
                      type="file"
                      multiple
                      onChange={handleNewsFilesChange}
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
                    />

                    <p className="text-sm text-zinc-500 mt-2">
                      Dateien und Anhänge werden beim Veröffentlichen der News zugeordnet.
                    </p>

                    {pendingFiles.length > 0 && (
                      <div className="grid gap-2 mt-4">
                        {pendingFiles.map(
                          (file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {file.name}
                                </p>

                                <p className="text-xs text-zinc-500">
                                  {Math.round(
                                    file.size / 1024
                                  )} KB
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removePendingFile(
                                    index
                                  )
                                }
                                className="text-sm bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
                              >
                                Entfernen
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
                  >
                    Abbrechen
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNews}
                    className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
                  >
                    News veröffentlichen
                  </button>
                </div>
              </div>
            </div>
          )}

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
                Neueste
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {latestPosts.length}
              </h2>

              <p className="text-sm text-zinc-500 mt-2">
                aktuelle Einträge
              </p>
            </div>
          </div>

          {featuredPost && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-semibold">
                  Hervorgehobene Meldung
                </h2>

                {activeCategory && (
                  <Link
                    href="/"
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
        </div>
      </div>
    </div>
  );
}