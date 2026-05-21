"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  newsRepository,
} from "../../../lib/newsRepository";

import type {
  NewsCategory,
  NewsPost,
} from "../../../types/news";

import {
  readNewsFiles,
  saveNewsFiles,
} from "../../../lib/newsFileHelpers";

import type {
  PendingNewsFile,
} from "../../../lib/newsFileHelpers";

import {
  saveNewsCreatedActivity,
  saveNewsDeletedActivity,
  saveNewsUpdatedActivity,
} from "../../../lib/newsActivityHelpers";

import {
  canCreate,
  canDelete,
  canEdit,
  canViewAdmin,
  getCurrentUser,
} from "../../../lib/permissions";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

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

export default function AdminNewsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [posts, setPosts] =
    useState<NewsPost[]>([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

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
    setMounted(true);

    loadPosts();

    function handleNewsUpdated() {
      loadPosts();
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

  function loadPosts() {
    setPosts(
      newsRepository.list()
    );
  }

  function resetForm() {
    setEditingId("");
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

    resetForm();

    setShowForm(true);
  }

  function openEditForm(
    post: NewsPost
  ) {
    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, News zu bearbeiten."
      );

      return;
    }

    setEditingId(
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
      post.category
    );

    setPinned(
      Boolean(
        post.pinned
      )
    );

    setPendingFiles([]);

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

  function handleSaveNews() {
    if (
      !editingId &&
      !canCreate()
    ) {
      alert(
        "Du hast keine Berechtigung, News zu erstellen."
      );

      return;
    }

    if (
      editingId &&
      !canEdit()
    ) {
      alert(
        "Du hast keine Berechtigung, News zu bearbeiten."
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

    if (editingId) {
      const updatedPost =
        newsRepository.update(
          editingId,
          {
            title:
              title.trim(),

            description:
              description.trim(),

            content:
              content.trim(),

            category,

            pinned,
          }
        );

      if (updatedPost) {
        if (pendingFiles.length > 0) {
          saveNewsFiles(
            updatedPost.id,
            pendingFiles
          );
        }

        saveNewsUpdatedActivity(
          updatedPost
        );
      }

      resetForm();

      return;
    }

    const user =
      getCurrentUser();

    const newPost =
      newsRepository.create({
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

    if (pendingFiles.length > 0) {
      saveNewsFiles(
        newPost.id,
        pendingFiles
      );
    }

    saveNewsCreatedActivity(
      newPost
    );

    resetForm();
  }

  function handleDeleteNews(
    post: NewsPost
  ) {
    if (!canDelete()) {
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

    saveNewsDeletedActivity(
      post
    );

    newsRepository.delete(
      post.id
    );
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard />
    );
  }

  const filteredPosts =
    search.trim()
      ? newsRepository.search(
          search
        )
      : posts;

  const pinnedCount =
    posts.filter(
      (post) =>
        post.pinned
    ).length;

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

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            News-Verwaltung
          </h1>

          <p className="text-zinc-500 mt-2">
            Interne Meldungen erstellen, bearbeiten, löschen und für die Startseite vorbereiten
          </p>
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
                  {editingId
                    ? `News #${editingId} bearbeiten`
                    : "News erstellen"}
                </h2>

                <p className="text-zinc-500 mt-2">
                  Bearbeite die Meldung für die interne News-Startseite.
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
                  rows={8}
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
                  Dateien und Anhänge werden beim Speichern der News zugeordnet.
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
                onClick={handleSaveNews}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                {editingId
                  ? "Änderungen speichern"
                  : "News veröffentlichen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            News gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {posts.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Fixiert
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pinnedCount}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Kategorien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {newsRepository.listCategories().length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Treffer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {filteredPosts.length}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              News suchen
            </label>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Suche nach Titel, Inhalt, Kategorie, Autor oder ID..."
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-4 rounded-2xl transition"
          >
            Suche zurücksetzen
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  ID
                </th>

                <th className="px-5 py-4 font-semibold">
                  Titel
                </th>

                <th className="px-5 py-4 font-semibold">
                  Kategorie
                </th>

                <th className="px-5 py-4 font-semibold">
                  Autor
                </th>

                <th className="px-5 py-4 font-semibold">
                  Datum
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 font-semibold text-right">
                  Aktionen
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-zinc-500"
                  >
                    Keine News gefunden.
                  </td>
                </tr>
              )}

              {filteredPosts.map(
                (post) => (
                  <tr
                    key={post.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                      {post.id}
                    </td>

                    <td className="px-5 py-4 min-w-[300px]">
                      <Link
                        href={`/news/${post.id}`}
                        className="font-semibold hover:text-zinc-600 transition"
                      >
                        {post.title}
                      </Link>

                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                        {post.description}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(post.category)}`}>
                        {post.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {post.author}
                    </td>

                    <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                      {post.createdAt}
                    </td>

                    <td className="px-5 py-4">
                      {post.pinned ? (
                        <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                          Fixiert
                        </span>
                      ) : (
                        <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/news/${post.id}`}
                          className="bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
                        >
                          Öffnen
                        </Link>

                        {canEdit() && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                post
                              )
                            }
                            className="bg-zinc-900 text-white px-3 py-2 rounded-xl hover:bg-zinc-700 transition"
                          >
                            Bearbeiten
                          </button>
                        )}

                        {canDelete() && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteNews(
                                post
                              )
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}