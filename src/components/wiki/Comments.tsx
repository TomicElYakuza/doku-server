"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  deleteComment,
  getCommentsForPage,
  saveComment,
} from "../../lib/commentStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  getUser,
} from "../../lib/userStorage";

import {
  canComment,
  isAdmin,
} from "../../lib/permissions";

import {
  getStoredPages,
} from "../../lib/wikiStorage";

type CommentsProps = {
  slug: string;
};

export default function Comments({
  slug,
}: CommentsProps) {
  const [mounted, setMounted] =
    useState(false);

  const [comments, setComments] =
    useState<any[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [allowedToComment, setAllowedToComment] =
    useState(false);

  const [admin, setAdmin] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    setAllowedToComment(
      canComment()
    );

    setAdmin(isAdmin());

    loadComments();

    function handleCommentsUpdated() {
      loadComments();
    }

    function handleUserUpdated() {
      setAllowedToComment(
        canComment()
      );

      setAdmin(isAdmin());
    }

    window.addEventListener(
      "commentsUpdated",
      handleCommentsUpdated
    );

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "commentsUpdated",
        handleCommentsUpdated
      );

      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );
    };
  }, [slug]);

  function loadComments() {
    setComments(
      getCommentsForPage(slug)
    );
  }

  function getCurrentCompany() {
    const pages =
      getStoredPages();

    const page =
      pages.find(
        (item: any) =>
          item.slug === slug
      );

    return (
      page?.company ||
      "Intern"
    );
  }

  function handleAddComment() {
    if (!allowedToComment) {
      alert(
        "Du hast keine Berechtigung zu kommentieren."
      );

      return;
    }

    if (!commentText.trim()) {
      alert(
        "Bitte einen Kommentar eingeben."
      );

      return;
    }

    const user =
      getUser();

    const text =
      commentText.trim();

    saveComment(slug, {
      text,

      user:
        user?.name ||
        "Unbekannt",

      role:
        user?.role ||
        "viewer",

      createdAt:
        new Date().toLocaleString(),
    });

    saveActivity({
      type: "commented",

      title:
        text,

      company:
        getCurrentCompany(),

      user:
        user?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    setCommentText("");
  }

  function handleDeleteComment(
    comment: any,
    index: number
  ) {
    if (!admin) {
      alert(
        "Nur Admins dürfen Kommentare löschen."
      );

      return;
    }

    const confirmed = confirm(
      "Kommentar wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    deleteComment(
      slug,
      index
    );

    saveActivity({
      type: "commentDeleted",

      title:
        comment?.text ||
        "Kommentar gelöscht",

      company:
        getCurrentCompany(),

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mt-6">
      <h2 className="text-2xl font-semibold">
        Kommentare
      </h2>

      <p className="text-zinc-500 mt-2">
        Rückfragen, Hinweise und Ergänzungen zum Dokument.
      </p>

      {allowedToComment && (
        <div className="mt-6">
          <textarea
            value={commentText}
            onChange={(event) =>
              setCommentText(
                event.target.value
              )
            }
            rows={4}
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
            placeholder="Kommentar schreiben..."
          />

          <button
            onClick={handleAddComment}
            className="mt-3 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Kommentar speichern
          </button>
        </div>
      )}

      {!allowedToComment && (
        <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
          <p className="text-zinc-500">
            Du hast keine Berechtigung, Kommentare zu schreiben.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {comments.length === 0 && (
          <p className="text-zinc-500">
            Noch keine Kommentare vorhanden.
          </p>
        )}

        {comments.map(
          (
            comment: any,
            index: number
          ) => (
            <div
              key={`${comment.createdAt}-${index}`}
              className="border border-zinc-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {comment.user ||
                      "Unbekannt"}
                  </p>

                  <p className="text-sm text-zinc-500 mt-1">
                    {comment.role ||
                      "viewer"}{" "}
                    ·{" "}
                    {comment.createdAt ||
                      "Unbekannt"}
                  </p>
                </div>

                {admin && (
                  <button
                    onClick={() =>
                      handleDeleteComment(
                        comment,
                        index
                      )
                    }
                    className="text-sm bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                  >
                    Löschen
                  </button>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-zinc-700">
                {comment.text}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}