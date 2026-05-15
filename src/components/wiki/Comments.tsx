"use client";

import { useEffect, useState } from "react";

import {
  getComments,
  saveComment,
  deleteComment,
} from "../../lib/commentStorage";

import {
  getUser,
} from "../../lib/userStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  isAdmin,
  canComment,
} from "../../lib/permissions";

export default function Comments({
  slug,
}: {
  slug: string;
}) {
  const [comments, setComments] =
    useState<any[]>([]);

  const [text, setText] =
    useState("");

  const [user, setUser] =
    useState<any>(null);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    setUser(getUser());

    loadComments();

    function handleCommentsUpdated() {
      loadComments();
    }

    function handleUserUpdated() {
      setUser(getUser());
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
    const allComments =
      getComments();

    const pageComments =
      allComments[slug];

    if (!Array.isArray(pageComments)) {
      setComments([]);

      return;
    }

    setComments(pageComments);
  }

  function handleAddComment() {
    if (!canComment()) {
      alert(
        "Du hast keine Berechtigung zum Kommentieren."
      );

      return;
    }

    if (!text.trim()) {
      alert(
        "Bitte einen Kommentar eingeben."
      );

      return;
    }

    const currentUser =
      getUser();

    const comment = {
      text:
        text.trim(),

      user:
        currentUser?.name ||
        "Unbekannt",

      role:
        currentUser?.role ||
        "viewer",

      createdAt:
        new Date().toLocaleString(),
    };

    saveComment(
      slug,
      comment
    );

    saveActivity({
      type: "commented",

      title:
        slug,

      user:
        currentUser?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    setText("");
  }

  function canDeleteComment(
    comment: any
  ) {
    if (isAdmin()) {
      return true;
    }

    return (
      user?.name &&
      comment.user === user.name
    );
  }

  function handleDeleteComment(
    index: number
  ) {
    const comment =
      comments[index];

    if (!comment) {
      return;
    }

    if (
      !canDeleteComment(
        comment
      )
    ) {
      alert(
        "Du darfst diesen Kommentar nicht löschen."
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
        slug,

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
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 mt-8">
      <h2 className="text-2xl font-bold">
        Kommentare
      </h2>

      <p className="text-zinc-500 mt-2">
        Fragen, Hinweise oder Ergänzungen zum Dokument
      </p>

      {/* COMMENT FORM */}
      {canComment() ? (
        <div className="mt-6">
          <textarea
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            rows={4}
            placeholder="Kommentar schreiben..."
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
          />

          <button
            onClick={handleAddComment}
            className="mt-4 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Kommentar speichern
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
          <p className="text-sm text-zinc-500">
            Du hast keine Berechtigung zum Kommentieren.
          </p>
        </div>
      )}

      {/* COMMENT LIST */}
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
              key={`${comment.createdAt || "comment"}-${index}`}
              className="border border-zinc-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold shrink-0">
                    {comment.user?.charAt(0) ||
                      "?"}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {comment.user ||
                        "Unbekannt"}
                    </p>

                    <p className="text-sm text-zinc-500 mt-1">
                      {comment.createdAt ||
                        "Unbekannt"}
                    </p>

                    {comment.role && (
                      <p className="text-xs text-zinc-400 mt-1 capitalize">
                        {comment.role}
                      </p>
                    )}
                  </div>
                </div>

                {canDeleteComment(
                  comment
                ) && (
                  <button
                    onClick={() =>
                      handleDeleteComment(
                        index
                      )
                    }
                    className="text-sm text-red-600 hover:text-red-500 shrink-0"
                  >
                    Löschen
                  </button>
                )}
              </div>

              <p className="mt-4 text-zinc-700 whitespace-pre-wrap break-words">
                {comment.text ||
                  "Kein Text"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}