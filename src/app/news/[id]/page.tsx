"use client";

import Link from "next/link";

import {
  use,
  useEffect,
  useState,
} from "react";

import {
  newsRepository,
} from "../../../lib/newsRepository";

import type {
  NewsCategory,
  NewsPost,
} from "../../../lib/newsStorage";

import {
  canDelete,
  canEdit,
} from "../../../lib/permissions";

type NewsDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default function NewsDetailPage({
  params,
}: NewsDetailPageProps) {
  const {
    id,
  } = use(
    params
  );

  const [mounted, setMounted] =
    useState(false);

  const [post, setPost] =
    useState<NewsPost | null>(null);

  const [showEditForm, setShowEditForm] =
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

  useEffect(() => {
    setMounted(true);

    loadPost();
  }, [
    id,
  ]);

  function loadPost() {
    const foundPost =
        newsRepository.findById(
    id
  );

    setPost(
      foundPost
    );

    if (foundPost) {
      newsRepository.markOpened(
        foundPost.id
    );

      setTitle(
        foundPost.title
      );

      setDescription(
        foundPost.description
      );

      setContent(
        foundPost.content
      );

      setCategory(
        foundPost.category
      );

      setPinned(
        Boolean(
          foundPost.pinned
        )
      );
    }
  }

  function handleSaveNews() {
    if (!post) {
      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, diese News zu bearbeiten."
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

    const updatedPost =
    newsRepository.update(
    post.id,
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
      setPost(
        updatedPost
      );
    }

    setShowEditForm(
      false
    );
  }

  function handleDeleteNews() {
    if (!post) {
      return;
    }

    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, diese News zu löschen."
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

    newsRepository.delete(
    post.id
    );

    window.location.href =
      "/";
  }

  if (!mounted) {
    return null;
  }

  if (!post) {
    return (
      <div className="space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu News
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            News nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Dieser Beitrag existiert nicht oder wurde entfernt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu News
        </Link>

        <div className="flex flex-wrap gap-3">
          {canEdit() && (
            <button
              type="button"
              onClick={() =>
                setShowEditForm(
                  true
                )
              }
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Bearbeiten
            </button>
          )}

          {canDelete() && (
            <button
              type="button"
              onClick={handleDeleteNews}
              className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
            >
              Löschen
            </button>
          )}
        </div>
      </div>

      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  News bearbeiten
                </h2>

                <p className="text-zinc-500 mt-2">
                  Änderungen am Beitrag übernehmen.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditForm(
                    false
                  )
                }
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
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-zinc-200">
              <button
                type="button"
                onClick={() =>
                  setShowEditForm(
                    false
                  )
                }
                className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleSaveNews}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}

      <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(post.category)}`}>
            {post.category}
          </span>

          {post.pinned && (
            <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
              Fixiert
            </span>
          )}

          <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
            {post.createdAt}
          </span>
        </div>

        <h1 className="text-5xl font-black tracking-tight mt-6">
          {post.title}
        </h1>

        <p className="text-xl text-zinc-500 mt-4 leading-relaxed">
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mt-6 border-b border-zinc-200 pb-6">
          <span>
            Autor:{" "}
            <span className="font-medium text-zinc-800">
              {post.author}
            </span>
          </span>

          <span className="font-mono text-zinc-400">
            Beitrag #{post.id}
          </span>
        </div>

        <div className="mt-8 text-zinc-700 leading-relaxed text-lg whitespace-pre-wrap">
          {post.content}
        </div>
      </article>
    </div>
  );
}