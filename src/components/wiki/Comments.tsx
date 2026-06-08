"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  activityRepository,
} from "../../lib/activityRepository";
import {
  commentRepository,
} from "../../lib/commentRepository";
import type {
  Comment,
} from "../../types/comment";

type CommentsProps = {
  pageSlug: string;
};

export default function Comments({
  pageSlug,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadComments();

    function handleCommentsUpdated() {
      void loadComments();
    }

    window.addEventListener(
      "commentsUpdated",
      handleCommentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "commentsUpdated",
        handleCommentsUpdated,
      );
    };
  }, [
    pageSlug,
  ]);

  async function loadComments() {
    if (!pageSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const nextComments = await commentRepository.listByEntity(
        "wiki",
        pageSlug,
      );

      setComments(Array.isArray(nextComments) ? nextComments : []);
    } catch (error) {
      console.error(
        "Kommentare konnten nicht geladen werden:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) {
      alert("Bitte einen Kommentar eingeben.");
      return;
    }

    try {
      setSaving(true);

      const createdComment = await commentRepository.create({
        entityType: "wiki",
        entityId: pageSlug,
        author: "System",
        content: content.trim(),
      });

      void activityRepository.create({
        type: "created",
        title: "Wiki-Kommentar erstellt",
        description: `Kommentar zu Wiki-Seite "${pageSlug}" wurde erstellt.`,
        entityType: "wiki",
        entityId: pageSlug,
        userName: createdComment.author,
        userEmail: "",
        user: createdComment.author,
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          commentId: createdComment.id,
          pageSlug,
        },
      });

      setContent("");
      await loadComments();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Kommentar konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(comment: Comment) {
    const confirmed = confirm("Kommentar wirklich löschen?");

    if (!confirmed) {
      return;
    }

    try {
      await commentRepository.delete(comment.id);

      void activityRepository.create({
        type: "deleted",
        title: "Wiki-Kommentar gelöscht",
        description: `Kommentar zu Wiki-Seite "${pageSlug}" wurde gelöscht.`,
        entityType: "wiki",
        entityId: pageSlug,
        userName: "System",
        userEmail: "",
        user: "System",
        companyId: "",
        departmentId: "",
        company: "Intern",
        department: "",
        metadata: {
          commentId: comment.id,
          pageSlug,
        },
      });

      await loadComments();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Kommentar konnte nicht gelöscht werden.",
      );
    }
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-black">
              Kommentare
            </h2>
            <p className="text-zinc-500 mt-1">
              Diskussion und Hinweise zu dieser Wiki-Seite.
            </p>
          </div>

          <span className="rounded-full app-accent-soft app-accent-text px-4 py-2 text-sm font-bold">
            {comments.length} Kommentare
          </span>
        </div>

        <div className="mt-6 bg-zinc-50 border border-zinc-100 rounded-3xl p-5">
          <label className="block mb-2 font-bold">
            Neuer Kommentar
          </label>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none bg-white"
            placeholder="Kommentar schreiben..."
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="mt-3 app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
          >
            {saving ? "Speichert..." : "Kommentar speichern"}
          </button>
        </div>

        <div className="space-y-4 mt-8">
          {loading && (
            <div className="bg-zinc-50 rounded-2xl p-5 text-zinc-500">
              Kommentare werden geladen...
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="border border-dashed border-zinc-200 rounded-3xl p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
                💬
              </div>

              <p className="font-black mt-4">
                Noch keine Kommentare
              </p>
              <p className="text-zinc-500 mt-1">
                Hinweise und Diskussionen erscheinen hier.
              </p>
            </div>
          )}

          {comments.map((comment) => (
            <article
              key={comment.id}
              className="border border-zinc-200 rounded-3xl p-5 bg-white hover:border-indigo-200 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center font-black shrink-0">
                    {(comment.author || "S").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-black text-zinc-950">
                      {comment.author || "System"}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {comment.createdAt || "-"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(comment)}
                  className="text-sm text-red-600 hover:text-red-500 font-bold"
                >
                  Löschen
                </button>
              </div>

              <p className="text-zinc-700 mt-4 whitespace-pre-wrap leading-7">
                {comment.content}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
