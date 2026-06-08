"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import NewsFileList from "../../../components/news/NewsFileList";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  newsRepository,
} from "../../../lib/newsRepository";
import {
  canEdit,
} from "../../../lib/permissions";
import type {
  NewsPost,
} from "../../../types/news";

function getCategoryClass(category: string) {
  if (category === "System") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (category === "Tickets") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (category === "Wiki") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (category === "Organisation") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (category) {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

function getPostCategory(post: NewsPost) {
  return String(post.category || "").trim();
}

function getPostAuthor(post: NewsPost) {
  return post.author || "Unbekannt";
}

function getPostContent(post: NewsPost) {
  return post.content || post.description || "Kein Inhalt vorhanden.";
}

function getReadingTime(text: string) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (words === 0) {
    return "0 Min.";
  }

  return `${Math.max(1, Math.ceil(words / 220))} Min.`;
}

function formatContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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

  const postContent = useMemo(
    () => (post ? getPostContent(post) : ""),
    [
      post,
    ],
  );

  const contentParagraphs = useMemo(
    () => formatContent(postContent),
    [
      postContent,
    ],
  );

  const postCategory = post ? getPostCategory(post) : "";

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>

          <h1 className="text-2xl font-black mt-6">
            News wird geladen
          </h1>

          <p className="text-zinc-500 mt-2">
            Der Beitrag wird aus PostgreSQL geladen.
          </p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="News"
          title="News nicht gefunden"
          description={error || "Dieser Beitrag existiert nicht oder wurde entfernt."}
          badges={[
            {
              label: "Fehler",
            },
            {
              label: id || "Keine ID",
            },
          ]}
          actions={
            <Link
              href="/news"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              ZurÃ¼ck zu Neuigkeiten
            </Link>
          }
        />

        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Beitrag nicht verfÃ¼gbar
          </h2>
          <p className="text-red-600 mt-2">
            {error || "Dieser Beitrag konnte nicht geladen werden."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="News Detail"
        title={post.title}
        description={post.description || "Interner News-Beitrag im Velunis Workspace."}
        badges={[
          {
            label: postCategory || "Nicht zugeordnet",
          },
          {
            label: post.pinned ? "Fixiert" : "Normal",
          },
          {
            label: `Autor: ${getPostAuthor(post)}`,
          },
          {
            label: post.createdAt || "Kein Datum",
          },
        ]}
        actions={
          <>
            <Link
              href="/news"
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              ZurÃ¼ck zu Neuigkeiten
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Kategorie"
          value={postCategory || "Nicht zugeordnet"}
          description="News-Bereich"
          icon="ðŸ“°"
          tone="blue"
        />

        <StatCard
          label="Autor"
          value={getPostAuthor(post)}
          description="VerÃ¶ffentlicht von"
          icon="ðŸ‘¤"
          tone="indigo"
        />

        <StatCard
          label="Lesedauer"
          value={getReadingTime(postContent)}
          description="GeschÃ¤tzt"
          icon="â±ï¸"
          tone="purple"
        />

        <StatCard
          label="Status"
          value={post.pinned ? "Fixiert" : "Normal"}
          description={markingOpened ? "Wird markiert..." : "Gelesen erfasst"}
          icon={post.pinned ? "ðŸ“Œ" : "âœ“"}
          tone={post.pinned ? "orange" : "green"}
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <article className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full app-accent-bg opacity-10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap gap-2">
              {postCategory && (
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-bold ${getCategoryClass(
                    postCategory,
                  )}`}
                >
                  {postCategory}
                </span>
              )}

              {post.pinned && (
                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full font-bold">
                  Fixiert
                </span>
              )}

              <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1 rounded-full font-bold">
                News #{post.id}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-6">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-xl text-zinc-500 leading-8 mt-5">
                {post.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-zinc-100">
              <div className="h-11 w-11 rounded-2xl app-accent-bg text-white flex items-center justify-center font-black app-brand-shadow">
                {getPostAuthor(post).charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-black text-zinc-950">
                  {getPostAuthor(post)}
                </p>
                <p className="text-sm text-zinc-500">
                  Erstellt am {post.createdAt || "-"}
                </p>
              </div>
            </div>

            <div className="prose prose-zinc max-w-none mt-10">
              {contentParagraphs.length > 0 ? (
                <div className="space-y-5">
                  {contentParagraphs.map((paragraph, index) => (
                    <p
                      key={`${post.id}-paragraph-${index}`}
                      className="text-zinc-700 leading-8 text-lg whitespace-pre-wrap"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">
                  Kein Inhalt vorhanden.
                </p>
              )}
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Beitrag
            </h2>
            <p className="text-zinc-500 mt-1">
              Metadaten zu dieser News.
            </p>

            <div className="space-y-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  ID
                </p>
                <p className="font-black mt-1 break-all">
                  {post.id}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Kategorie
                </p>
                <p className="font-black mt-1">
                  {postCategory || "Nicht zugeordnet"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Autor
                </p>
                <p className="font-black mt-1">
                  {getPostAuthor(post)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="text-xs text-zinc-500">
                  Erstellt
                </p>
                <p className="font-black mt-1">
                  {post.createdAt || "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Aktionen
              </h2>
              <p className="text-zinc-500 mt-1">
                Schneller Zugriff auf News und Verwaltung.
              </p>

              <div className="space-y-3 mt-6">
                <Link
                  href="/news"
                  className="flex items-center justify-between gap-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 transition font-bold"
                >
                  <span>Zur News-Ãœbersicht</span>
                  <span>â†’</span>
                </Link>

                {canEdit() && (
                  <Link
                    href="/admin/news"
                    className="flex items-center justify-between gap-4 app-accent-bg text-white rounded-2xl p-4 transition font-bold app-brand-shadow"
                  >
                    <span>News verwalten</span>
                    <span>â†’</span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </aside>
      </section>

      <NewsFileList
        newsId={post.id}
        editable={canEdit()}
      />
    </div>
  );
}
