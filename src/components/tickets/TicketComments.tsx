"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  canDelete,
  canEdit,
  getCurrentUser,
} from "../../lib/permissions";

import {
  createTicketComment,
  deleteTicketComment,
  getTicketCommentsByTicketId,
  updateTicketComment,
} from "../../lib/ticketCommentStorage";

import type {
  TicketComment,
} from "../../lib/ticketCommentStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  areTicketCommentsEnabled,
} from "../../lib/featureFlags";

type TicketCommentsProps = {
  ticketId: string;
};

export default function TicketComments({
  ticketId,
}: TicketCommentsProps) {
  const [comments, setComments] =
    useState<TicketComment[]>([]);

  const [commentsEnabled, setCommentsEnabled] =
    useState(true);

  const [text, setText] =
    useState("");

  const [editingId, setEditingId] =
    useState("");

  const [editingText, setEditingText] =
    useState("");

  useEffect(() => {
    loadComments();

    setCommentsEnabled(
      areTicketCommentsEnabled()
    );

    function handleCommentsUpdated() {
      loadComments();
    }

    function handleSettingsUpdated() {
      setCommentsEnabled(
        areTicketCommentsEnabled()
      );
    }

    window.addEventListener(
      "ticketCommentsUpdated",
      handleCommentsUpdated
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketCommentsUpdated",
        handleCommentsUpdated
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, [ticketId]);

  function loadComments() {
    setComments(
      getTicketCommentsByTicketId(
        ticketId
      )
    );
  }

  function writeActivity(
    type:
      | "ticket_comment_created"
      | "ticket_comment_updated"
      | "ticket_comment_deleted",
    title: string,
    description: string
  ) {
    const user =
      getCurrentUser();

    saveActivity({
      type,

      title,

      description,

      entityId:
        ticketId,

      entityType:
        "ticket",

      userName:
        user?.name ||
        "Unbekannt",

      userEmail:
        user?.email ||
        "",

      user:
        user?.name ||
        "Unbekannt",

      companyId:
        user?.companyId ||
        "",

      departmentId:
        user?.departmentId ||
        "",

      company:
        user?.company ||
        "Intern",

      department:
        user?.department ||
        "Allgemein",

      metadata:
        {
          ticketId,
        },
    });
  }

  function handleCreateComment() {
    if (!commentsEnabled) {
      alert(
        "Ticket-Kommentare sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, Kommentare zu schreiben."
      );

      return;
    }

    if (!text.trim()) {
      alert(
        "Bitte einen Kommentar eingeben."
      );

      return;
    }

    const user =
      getCurrentUser();

    createTicketComment({
      ticketId,

      text:
        text.trim(),

      author:
        user?.name ||
        "Unbekannt",

      authorEmail:
        user?.email ||
        "",

      companyId:
        user?.companyId ||
        "",

      departmentId:
        user?.departmentId ||
        "",

      company:
        user?.company ||
        "Intern",

      department:
        user?.department ||
        "Allgemein",
    });

    writeActivity(
      "ticket_comment_created",
      "Ticket-Kommentar erstellt",
      text.trim()
    );

    setText("");

    loadComments();
  }

  function startEditComment(
    comment: TicketComment
  ) {
    setEditingId(
      comment.id
    );

    setEditingText(
      comment.text
    );
  }

  function cancelEditComment() {
    setEditingId("");

    setEditingText("");
  }

  function handleUpdateComment(
    comment: TicketComment
  ) {
    if (!commentsEnabled) {
      alert(
        "Ticket-Kommentare sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, Kommentare zu bearbeiten."
      );

      return;
    }

    if (!editingText.trim()) {
      alert(
        "Bitte einen Kommentar eingeben."
      );

      return;
    }

    updateTicketComment(
      comment.id,
      {
        text:
          editingText.trim(),
      }
    );

    writeActivity(
      "ticket_comment_updated",
      "Ticket-Kommentar aktualisiert",
      editingText.trim()
    );

    cancelEditComment();

    loadComments();
  }

  function handleDeleteComment(
    comment: TicketComment
  ) {
    if (!commentsEnabled) {
      alert(
        "Ticket-Kommentare sind in den Einstellungen deaktiviert."
      );

      return;
    }

    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Kommentare zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Kommentar wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteTicketComment(
      comment.id
    );

    writeActivity(
      "ticket_comment_deleted",
      "Ticket-Kommentar gelöscht",
      comment.text
    );

    loadComments();
  }

  if (!commentsEnabled) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Kommentare
        </h2>

        <p className="text-zinc-500 mt-2">
          Ticket-Kommentare sind aktuell in den Einstellungen deaktiviert.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">
            Kommentare
          </h2>

          <p className="text-zinc-500 mt-2">
            Rückfragen, interne Notizen und Updates zu diesem Ticket
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-zinc-500">
            Anzahl
          </p>

          <p className="font-semibold mt-1">
            {comments.length}
          </p>
        </div>
      </div>

      {canEdit() && (
        <div className="mt-6 border border-zinc-200 rounded-2xl p-5">
          <label className="block mb-2 font-medium">
            Neuer Kommentar
          </label>

          <textarea
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            rows={4}
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
            placeholder="Kommentar schreiben..."
          />

          <button
            onClick={handleCreateComment}
            className="mt-4 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Kommentar speichern
          </button>
        </div>
      )}

      {!canEdit() && (
        <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
          <p className="text-zinc-500">
            Du hast mit deiner aktuellen Rolle keine Berechtigung, Kommentare zu schreiben.
          </p>
        </div>
      )}

      <div className="grid gap-4 mt-6">
        {comments.length === 0 && (
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-zinc-500">
              Noch keine Kommentare vorhanden.
            </p>
          </div>
        )}

        {comments.map(
          (comment) => (
            <div
              key={comment.id}
              className="border border-zinc-200 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {comment.author}
                    </span>

                    {comment.authorEmail && (
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {comment.authorEmail}
                      </span>
                    )}

                    <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                      {comment.company ||
                        "Intern"}
                    </span>

                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {comment.department ||
                        "Allgemein"}
                    </span>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-4">
                      <textarea
                        value={editingText}
                        onChange={(event) =>
                          setEditingText(
                            event.target.value
                          )
                        }
                        rows={4}
                        className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                      />

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() =>
                            handleUpdateComment(
                              comment
                            )
                          }
                          className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                        >
                          Speichern
                        </button>

                        <button
                          onClick={cancelEditComment}
                          className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-700 mt-4 whitespace-pre-wrap leading-relaxed">
                      {comment.text}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-4">
                    <p>
                      Erstellt:{" "}
                      {comment.createdAt}
                    </p>

                    <p>
                      Aktualisiert:{" "}
                      {comment.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end shrink-0">
                  {canEdit() &&
                    editingId !== comment.id && (
                      <button
                        onClick={() =>
                          startEditComment(
                            comment
                          )
                        }
                        className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                      >
                        Bearbeiten
                      </button>
                    )}

                  {canDelete() && (
                    <button
                      onClick={() =>
                        handleDeleteComment(
                          comment
                        )
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}