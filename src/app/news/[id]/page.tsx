"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import NewsFileList from "../../../components/news/NewsFileList";
import PageHero from "../../../components/PageHero";
import {
  canEdit,
} from "../../../lib/permissions";
import {
  newsRepository,
} from "../../../lib/newsRepository";
import type {
  NewsPost,
} from "../../../types/news";

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

function getPostAuthor(post: NewsPost) {
  return post.author || "Unbekannt";
}

function getPostContent(post: NewsPost) {
  return post.content || post.description || "Kein Inhalt vorhanden.";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("de-AT");
  } catch {
    return value;
  }
}

export default function NewsDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingOpened, setMarkingOpened] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadPost();

    function handleNewsUpdated() {
      void loadPost();
    }

    window.addEventListener(
      "newsUpdated",
      handleNewsUpdated,
    );

    return () => {
      window.removeEventListener(
        "newsUpdated",
        handleNewsUpdated,
      );
    };
  }, [
    id,
  ]);

  async function loadPost() {
    if (!id) {
      setLoading(false);
      setError("Keine News-ID vorhanden.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const nextPost = await newsRepository.findById(id);

      if (!nextPost) {
        setPost(null);
        setError("News wurde nicht gefunden.");
        return;
      }

      setPost(nextPost);

      try {
        setMarkingOpened(true);
        await newsRepository.markOpened(nextPost.id);
      } catch (openedError) {
        console.error(openedError);
      } finally {
        setMarkingOpened(false);
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "News konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <LoadingState
        title="News wird geladen..."
        description="Der Beitrag und seine Anhänge werden vorbereitet."
      />
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon="📰"
          title="News nicht gefunden"
          description={error || "Dieser Beitrag existiert nicht."}
          action={
            <Link
              href="/news"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Zurück zu Neuigkeiten
            </Link>
          }
        />
      </div>
    );
  }

  const postCategory = getPostCategory(post);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis News"
        title={post.title}
        description={post.description || "Interner News-Beitrag"}
        badges={[
          {
            label: postCategory || "Nicht gesetzt",
          },
          {
            label: `Autor: ${getPostAuthor(post)}`,
          },
          {
            label: `Erstellt: ${formatDate(post.createdAt)}`,
          },
          {
            label: post.pinned ? "Fixiert" : "Normal",
          },
        ]}
        actions={
          <>
            <Link
              href="/news"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Zurück zu News
            </Link>

            {canEdit() && (
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

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 xl:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
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

                {post.pinned && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    Fixiert
                  </span>
                )}

                {markingOpened && (
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full font-bold">
                    Wird als gelesen markiert...
                  </span>
                )}
              </div>

              <h1 className="text-3xl xl:text-5xl font-black tracking-[-0.06em] text-zinc-950 mt-5">
                {post.title}
              </h1>

              <p className="text-zinc-500 leading-7 mt-4 max-w-4xl">
                {post.description || "Keine Kurzbeschreibung vorhanden."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 shrink-0 min-w-[260px]">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Autor
                </p>

                <p className="font-black text-zinc-950 mt-1">
                  {getPostAuthor(post)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Erstellt
                </p>

                <p className="font-black text-zinc-950 mt-1">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 xl:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <article className="relative prose prose-zinc max-w-none">
          <div className="whitespace-pre-wrap text-zinc-700 leading-8 text-lg">
            {getPostContent(post)}
          </div>
        </article>
      </section>

      <NewsFileList
        newsId={post.id}
        editable={canEdit()}
      />
    </div>
  );
}
