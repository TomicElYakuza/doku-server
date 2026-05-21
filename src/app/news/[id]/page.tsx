"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  newsRepository,
} from "../../../lib/newsRepository";

import {
  canEdit,
} from "../../../lib/permissions";

import NewsFileList from "../../../components/news/NewsFileList";

import type {
  NewsPost,
} from "../../../types/news";

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

export default function NewsDetailPage() {
  const params =
    useParams();

  const id =
    String(
      params.id ||
        ""
    );

  const [post, setPost] =
    useState<NewsPost | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void loadPost();

    function handleNewsUpdated() {
      void loadPost();
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
  }, [
    id,
  ]);

  async function loadPost() {
    if (!id) {
      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const nextPost =
        await newsRepository.findById(
          id
        );

      if (!nextPost) {
        setPost(
          null
        );

        setError(
          "News wurde nicht gefunden."
        );

        return;
      }

      setPost(
        nextPost
      );

      await newsRepository.markOpened(
        nextPost.id
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "News konnte nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <p className="text-zinc-500">
          News wird geladen...
        </p>
      </div>
    );
  }

  if (
    error ||
    !post
  ) {
    return (
      <div className="space-y-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Neuigkeiten
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            News nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-2">
            {error ||
              "Dieser Beitrag existiert nicht."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Neuigkeiten
        </Link>
      </div>

      <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-3 py-1 rounded-full ${getCategoryClass(String(post.category))}`}>
                {post.category ||
                  "Allgemein"}
              </span>

              {post.pinned && (
                <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-full">
                  Fixiert
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mt-5">
              {post.title}
            </h1>

            <p className="text-zinc-500 mt-3">
              {post.description ||
                "Keine Beschreibung vorhanden."}
            </p>
          </div>

          {canEdit() && (
            <Link
              href="/admin/news"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition shrink-0"
            >
              News verwalten
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-zinc-400 mt-6">
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

        <div className="prose prose-zinc max-w-none mt-10 whitespace-pre-wrap leading-relaxed">
          {post.content ||
            post.description ||
            "Kein Inhalt vorhanden."}
        </div>
      </article>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <NewsFileList
          newsId={post.id}
          editable={canEdit()}
        />
      </div>
    </div>
  );
}