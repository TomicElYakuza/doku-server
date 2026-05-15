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

export default function Comments({
  slug,
}: {
  slug: string;
}) {
  const [comments, setComments] =
    useState<any[]>([]);

  const [text, setText] =
    useState("");

  function loadComments() {
    const allComments =
      getComments();

    setComments(
      allComments[slug] || []
    );
  }

  useEffect(() => {
    loadComments();
  }, [slug]);

  function handleAddComment() {
    if (!text.trim()) {
      return;
    }

    const user =
      getUser()?.name ||
      "Unbekannt";

    const comment = {
      text,

      user,

      createdAt:
        new Date().toLocaleString(),
    };

    saveComment(slug, comment);

    saveActivity({
      type: "commented",

      title: slug,

      user,

      createdAt:
        new Date().toLocaleString(),
    });

    setText("");

    loadComments();
  }

  function handleDeleteComment(
    index: number
  ) {
    const confirmed = confirm(
      "Kommentar wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    deleteComment(slug, index);

    loadComments();
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 mt-8">
      <h2 className="text-2xl font-bold">
        Kommentare
      </h2>

      <p className="text-zinc-500 mt-2">
        Fragen, Hinweise oder Ergänzungen zum Dokument
      </p>

      <div className="mt-6">
        <textarea
          value={text}
          onChange={(e) =>
            setText(e.target.value)
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
              key={index}
              className="border border-zinc-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-semibold">
                    {comment.user}
                  </p>

                  <p className="text-sm text-zinc-500 mt-1">
                    {comment.createdAt}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleDeleteComment(
                      index
                    )
                  }
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Löschen
                </button>
              </div>

              <p className="mt-4 text-zinc-700 whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}