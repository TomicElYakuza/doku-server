"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import { newsRepository } from "../../../lib/newsRepository";
import { canEdit } from "../../../lib/permissions";
import NewsFileList from "../../../components/news/NewsFileList";
import PageHero from "../../../components/PageHero";
import type { NewsPost } from "../../../types/news";

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

    window.addEventListener("newsUpdated", handleNewsUpdated);

    return () => {
      window.removeEventListener("newsUpdated", handleNewsUpdated);
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
      <div className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            News wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <Link
          href="/news"
          className="inline-flex text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Zurück zu Neuigkeiten
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">
            News nicht gefunden
          </h1>
          <p className="text-zinc-500 mt-2">
            {error || "Dieser Beitrag existiert nicht."}
          </p>
        </div>
      </div>
    );
  }

  const postCategory = getPostCategory(post);

  return (
    <div className="space-y-8">
      <Link
        href="/news"
        className="inline-flex text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Zurück zu Neuigkeiten
      </Link>

      <PageHero
        eyebrow="News"
        title={post.title}
        description={post.description || "Keine Kurzbeschreibung vorhanden."}
        badges={[
          ...(postCategory
            ? [
                {
                  label: postCategory,
                },
              ]
            : []),
          ...(post.pinned
            ? [
                {
                  label: "Fixiert",
                },
              ]
            : []),
          {
            label: `Autor: ${getPostAuthor(post)}`,
          },
          {
            label: `Erstellt: ${post.createdAt}`,
          },
          ...(markingOpened
            ? [
                {
                  label: "Wird als gelesen markiert",
                },
              ]
            : []),
        ]}
        actions={
          canEdit() && (
            <Link
              href="/admin/news"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              News verwalten
            </Link>
          )
        }
      />

      <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
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

        <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-5">
          <span>
            Autor: {getPostAuthor(post)}
          </span>
          <span>
            Erstellt: {post.createdAt}
          </span>
        </div>

        <div className="prose prose-zinc max-w-none mt-8 whitespace-pre-wrap leading-8 text-zinc-700">
          {getPostContent(post)}
        </div>
      </article>

      <NewsFileList
        newsId={post.id}
        editable={canEdit()}
      />
    </div>
  );
}