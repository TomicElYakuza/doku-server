"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  commentRepository,
} from "../../lib/commentRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

import type {
  Comment,
} from "../../types/comment";

type TicketCommentsProps = {
  ticketId: string;
  editable?: boolean;
};

export default function TicketComments({
  ticketId,
  editable = true,
}: TicketCommentsProps) {
  const [comments, setComments] =
    useState<Comment[]>([]);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    void loadComments();

    function handleCommentsUpdated() {
      void loadComments();
    }

    window.addEventListener(
      "commentsUpdated",
      handleCommentsUpdated
    );

    return () => {
      window.removeEventListener(
        "commentsUpdated",
        handleCommentsUpdated
      );
    };
  }, [
    ticketId,
  ]);

  async function loadComments() {
    if (!ticketId) {
      return;
    }

    try {
      setLoading(
        true
      );

      const nextComments =
        await commentRepository.listByEntity(
          "ticket",
          ticketId
        );

      setComments(
        nextComments
      );
    } catch (error) {
      console.error(
        "Ticket-Kommentare konnten nicht geladen werden:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleSubmit() {
    if (!editable) {
      alert(
        "Du hast keine Berechtigung, Kommentare zu erstellen."
      );

      return;
    }

    if (!content.trim()) {
      alert(
        "Bitte einen Kommentar eingeben."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const createdComment =
        await commentRepository.create({
          entityType:
            "ticket",

          entityId:
            ticketId,

          author:
            "System",

          content:
            content.trim(),
        });

      void activityRepository.create({
        type:
          "created",

        title:
          "Ticket-Kommentar erstellt",

        description:
          `Kommentar zu Ticket #${ticketId} wurde erstellt.`,

        entityType:
          "ticket",

        entityId:
          ticketId,

        userName:
          createdComment.author,

        userEmail:
          "",

        user:
          createdComment.author,

        companyId:
          "",

        departmentId:
          "",

        company:
          "Intern",

        department:
          "Keine Abteilung",

        metadata: {
          commentId:
            createdComment.id,

          ticketId,
        },
      });

      setContent("");

      await loadComments();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Kommentar konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleDelete(
    comment: Comment
  ) {
    if (!editable) {
      alert(
        "Du hast keine Berechtigung, Kommentare zu lÃ¶schen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Kommentar wirklich lÃ¶schen?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await commentRepository.delete(
        comment.id
      );

      void activityRepository.create({
        type:
          "deleted",

        title:
          "Ticket-Kommentar gelÃ¶scht",

        description:
          `Kommentar zu Ticket #${ticketId} wurde gelÃ¶scht.`,

        entityType:
          "ticket",

        entityId:
          ticketId,

        userName:
          "System",

        userEmail:
          "",

        user:
          "System",

        companyId:
          "",

        departmentId:
          "",

        company:
          "Intern",

        department:
          "Keine Abteilung",

        metadata: {
          commentId:
            comment.id,

          ticketId,
        },
      });

      await loadComments();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Kommentar konnte nicht gelÃ¶scht werden."
      );
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Kommentare
          </h2>

          <p className="text-zinc-500 mt-1">
            RÃ¼ckfragen, Notizen und Bearbeitungsverlauf zum Ticket.
          </p>
        </div>

        <span className="bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm">
          {comments.length}
        </span>
      </div>

      {editable && (
        <div className="mt-6">
          <textarea
            value={content}
            onChange={(event) =>
              setContent(
                event.target.value
              )
            }
            rows={4}
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
            placeholder="Kommentar schreiben..."
          />

          <button
            type="button"
            onClick={() =>
              void handleSubmit()
            }
            disabled={saving}
            className="mt-3 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {saving
              ? "Speichert..."
              : "Kommentar speichern"}
          </button>
        </div>
      )}

      <div className="space-y-4 mt-8">
        {loading && (
          <p className="text-zinc-500">
            Kommentare werden geladen...
          </p>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-zinc-500">
            Noch keine Kommentare vorhanden.
          </p>
        )}

        {comments.map(
          (comment) => (
            <div
              key={comment.id}
              className="border border-zinc-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {comment.author}
                  </p>

                  <p className="text-sm text-zinc-400 mt-1">
                    {comment.createdAt}
                  </p>
                </div>

                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(
                        comment
                      )
                    }
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    LÃ¶schen
                  </button>
                )}
              </div>

              <p className="text-zinc-700 mt-4 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
