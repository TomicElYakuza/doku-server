"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  getActivities,
} from "../lib/activityStorage";

import {
  getStoredPages,
} from "../lib/wikiStorage";

import {
  getTrashPages,
} from "../lib/trashStorage";

import {
  getTickets,
  getStatusLabel,
} from "../lib/ticketStorage";

import {
  getTicketTemplates,
} from "../lib/ticketTemplateStorage";

import {
  getTicketComments,
  getTicketCommentCount,
} from "../lib/ticketCommentStorage";

import {
  canCreate,
  canViewAdmin,
} from "../lib/permissions";

export default function HomePage() {
  const [activities, setActivities] =
    useState<any[]>([]);

  const [pages, setPages] =
    useState<any[]>([]);

  const [trashPages, setTrashPages] =
    useState<any[]>([]);

  const [tickets, setTickets] =
    useState<any[]>([]);

  const [ticketTemplates, setTicketTemplates] =
    useState<any[]>([]);

  const [ticketComments, setTicketComments] =
    useState<Record<string, any[]>>({});

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    setPages(
      getStoredPages()
    );

    setTrashPages(
      getTrashPages()
    );

    setActivities(
      getActivities()
    );

    setTickets(
      getTickets()
    );

    setTicketTemplates(
      getTicketTemplates()
    );

    setTicketComments(
      getTicketComments()
    );

    function handleWikiPagesUpdated() {
      setPages(
        getStoredPages()
      );
    }

    function handleTrashUpdated() {
      setTrashPages(
        getTrashPages()
      );
    }

    function handleActivityUpdated() {
      setActivities(
        getActivities()
      );
    }

    function handleTicketsUpdated() {
      setTickets(
        getTickets()
      );
    }

    function handleTicketTemplatesUpdated() {
      setTicketTemplates(
        getTicketTemplates()
      );
    }

    function handleTicketCommentsUpdated() {
      setTicketComments(
        getTicketComments()
      );
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleWikiPagesUpdated
    );

    window.addEventListener(
      "trashUpdated",
      handleTrashUpdated
    );

    window.addEventListener(
      "activityUpdated",
      handleActivityUpdated
    );

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTicketTemplatesUpdated
    );

    window.addEventListener(
      "ticketCommentsUpdated",
      handleTicketCommentsUpdated
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleWikiPagesUpdated
      );

      window.removeEventListener(
        "trashUpdated",
        handleTrashUpdated
      );

      window.removeEventListener(
        "activityUpdated",
        handleActivityUpdated
      );

      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );

      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTicketTemplatesUpdated
      );

      window.removeEventListener(
        "ticketCommentsUpdated",
        handleTicketCommentsUpdated
      );
    };
  }, []);

  if (!mounted) {
    return null;
  }

  function getActivityLabel(
    type: string
  ) {
    if (type === "created") {
      return "Dokument erstellt";
    }

    if (type === "edited") {
      return "Dokument bearbeitet";
    }

    if (type === "deleted") {
      return "Dokument in Papierkorb verschoben";
    }

    if (type === "deletedForever") {
      return "Dokument endgültig gelöscht";
    }

    if (type === "restored") {
      return "Dokument oder Version wiederhergestellt";
    }

    if (type === "uploaded") {
      return "Datei hochgeladen";
    }

    if (type === "fileDeleted") {
      return "Datei gelöscht";
    }

    if (type === "commented") {
      return "Kommentar hinzugefügt";
    }

    if (type === "commentDeleted") {
      return "Kommentar gelöscht";
    }

    if (type === "ticketCreated") {
      return "Ticket erstellt";
    }

    if (type === "ticketUpdated") {
      return "Ticket aktualisiert";
    }

    if (type === "ticketDeleted") {
      return "Ticket gelöscht";
    }

    if (type === "ticketCommented") {
      return "Ticket-Kommentar hinzugefügt";
    }

    if (type === "ticketCommentUpdated") {
      return "Ticket-Kommentar bearbeitet";
    }

    if (type === "ticketCommentDeleted") {
      return "Ticket-Kommentar gelöscht";
    }

    if (type === "ticketTemplateCreated") {
      return "Ticket-Vorlage erstellt";
    }

    if (type === "ticketTemplateUpdated") {
      return "Ticket-Vorlage aktualisiert";
    }

    if (type === "ticketTemplateDeleted") {
      return "Ticket-Vorlage gelöscht";
    }

    if (type === "ticketTemplateReset") {
      return "Ticket-Vorlagen zurückgesetzt";
    }

    return "Aktivität";
  }

  function getActivityIcon(
    type: string
  ) {
    if (type === "created") {
      return "📝";
    }

    if (type === "edited") {
      return "✏️";
    }

    if (type === "deleted") {
      return "🗑️";
    }

    if (type === "deletedForever") {
      return "❌";
    }

    if (type === "restored") {
      return "♻️";
    }

    if (type === "uploaded") {
      return "📎";
    }

    if (type === "fileDeleted") {
      return "🧹";
    }

    if (type === "commented") {
      return "💬";
    }

    if (type === "commentDeleted") {
      return "🧹";
    }

    if (type === "ticketCreated") {
      return "🎫";
    }

    if (type === "ticketUpdated") {
      return "🔄";
    }

    if (type === "ticketDeleted") {
      return "🗑️";
    }

    if (type === "ticketCommented") {
      return "💬";
    }

    if (type === "ticketCommentUpdated") {
      return "✏️";
    }

    if (type === "ticketCommentDeleted") {
      return "🧹";
    }

    if (type === "ticketTemplateCreated") {
      return "🧩";
    }

    if (type === "ticketTemplateUpdated") {
      return "🔧";
    }

    if (type === "ticketTemplateDeleted") {
      return "🗑️";
    }

    if (type === "ticketTemplateReset") {
      return "♻️";
    }

    return "📌";
  }

  function parseDate(
    value: string
  ) {
    if (!value) {
      return 0;
    }

    const parts =
      value.split(".");

    if (parts.length >= 3) {
      const day =
        Number(parts[0]);

      const month =
        Number(parts[1]) - 1;

      const year =
        Number(parts[2]);

      return new Date(
        year,
        month,
        day
      ).getTime();
    }

    return new Date(
      value
    ).getTime();
  }

  function getLocalCommentCount(
    ticketId: string
  ) {
    if (ticketComments[ticketId]) {
      return ticketComments[ticketId].length;
    }

    return getTicketCommentCount(
      ticketId
    );
  }

  const companies = [
    ...new Set(
      pages
        .map(
          (page: any) =>
            page.company ||
            "Intern"
        )
        .filter(Boolean)
    ),
  ];

  const departments = [
    ...new Set(
      pages
        .map(
          (page: any) =>
            page.category
        )
        .filter(Boolean)
    ),
  ];

  const tags = [
    ...new Set(
      pages.flatMap(
        (page: any) =>
          page.tags || []
      )
    ),
  ];

  const latestPages = [
    ...pages,
  ]
    .sort(
      (a: any, b: any) =>
        parseDate(
          b.updatedAt
        ) -
        parseDate(
          a.updatedAt
        )
    )
    .slice(
      0,
      5
    );

  const openTickets =
    tickets.filter(
      (ticket: any) =>
        ticket.status === "open"
    );

  const inProgressTickets =
    tickets.filter(
      (ticket: any) =>
        ticket.status ===
        "in-progress"
    );

  const urgentTickets =
    tickets.filter(
      (ticket: any) =>
        ticket.priority === "urgent"
    );

  const latestTickets =
    [...tickets].slice(
      0,
      5
    );

  const totalCommentCount =
    Object.values(
      ticketComments
    ).reduce(
      (
        sum: number,
        comments: any[]
      ) =>
        sum +
        (Array.isArray(
          comments
        )
          ? comments.length
          : 0),
      0
    );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Willkommen zurück
        </h1>

        <p className="text-zinc-500 mt-2">
          Firmen Intranet Übersicht
        </p>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
        <Link
          href="/wiki"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Dokumente
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {pages.length}
          </h2>
        </Link>

        <Link
          href="/wiki"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {companies.length}
          </h2>
        </Link>

        <Link
          href="/wiki"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Abteilungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {departments.length}
          </h2>
        </Link>

        <Link
          href="/wiki"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tags
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tags.length}
          </h2>
        </Link>

        <Link
          href="/tickets"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {tickets.length}
          </h2>
        </Link>

        <Link
          href="/tickets/templates"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Vorlagen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {ticketTemplates.length}
          </h2>
        </Link>

        <Link
          href="/tickets"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Kommentare
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {totalCommentCount}
          </h2>
        </Link>

        <Link
          href="/wiki/trash"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Papierkorb
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {trashPages.length}
          </h2>
        </Link>

        <Link
          href="/activity"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Aktivitäten
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activities.length}
          </h2>
        </Link>

        {canViewAdmin() && (
          <Link
            href="/admin"
            className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition"
          >
            <p className="text-sm text-zinc-500">
              Admin
            </p>

            <h2 className="text-4xl font-bold mt-3">
              ⚙️
            </h2>
          </Link>
        )}
      </div>

      {/* TICKET STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/tickets?status=open"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Offene Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {openTickets.length}
          </h2>
        </Link>

        <Link
          href="/tickets?status=in-progress"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-purple-50 transition"
        >
          <p className="text-sm text-zinc-500">
            In Bearbeitung
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {inProgressTickets.length}
          </h2>
        </Link>

        <Link
          href="/tickets?priority=urgent"
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Dringende Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {urgentTickets.length}
          </h2>
        </Link>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Schnellzugriff
        </h2>

        <div className="flex flex-wrap gap-4 mt-6">
          <Link
            href="/wiki"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Wiki öffnen
          </Link>

          {canCreate() && (
            <>
              <Link
                href="/wiki/create"
                className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Dokument erstellen
              </Link>

              <Link
                href="/tickets"
                className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-blue-50 transition"
              >
                Ticket erstellen
              </Link>
            </>
          )}

          <Link
            href="/tickets"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-blue-50 transition"
          >
            Tickets öffnen
          </Link>

          <Link
            href="/tickets/templates"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-indigo-50 transition"
          >
            Ticket-Vorlagen
          </Link>

          <Link
            href="/tickets?status=open"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-blue-50 transition"
          >
            Offene Tickets
          </Link>

          <Link
            href="/tickets?priority=urgent"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-red-50 transition"
          >
            Dringende Tickets
          </Link>

          <Link
            href="/wiki/trash"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-red-50 transition"
          >
            Papierkorb öffnen
          </Link>

          <Link
            href="/activity"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktivitäten öffnen
          </Link>

          <Link
            href="/settings"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Einstellungen
          </Link>

          <Link
            href="/setup"
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Benutzer Setup
          </Link>

          {canViewAdmin() && (
            <Link
              href="/admin"
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Admin-Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* LATEST DOCUMENTS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Neueste Dokumente
        </h2>

        <div className="mt-6 grid gap-4">
          {latestPages.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Dokumente vorhanden.
            </p>
          )}

          {latestPages.map(
            (page: any) => (
              <Link
                key={page.slug}
                href={`/wiki/${encodeURIComponent(
                  page.slug
                )}`}
                className="border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-semibold">
                      {page.title}
                    </p>

                    <p className="text-sm text-zinc-500 mt-1">
                      <span className="text-indigo-700">
                        {page.company ||
                          "Intern"}
                      </span>{" "}
                      ·{" "}
                      <span className="text-indigo-700">
                        {page.category}
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-zinc-500">
                    {page.updatedAt}
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      </div>

      {/* LATEST TICKETS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            Letzte Tickets
          </h2>

          <Link
            href="/tickets"
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Alle anzeigen
          </Link>
        </div>

        <div className="mt-6 grid gap-4">
          {latestTickets.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Tickets vorhanden.
            </p>
          )}

          {latestTickets.map(
            (ticket: any) => {
              const commentCount =
                getLocalCommentCount(
                  ticket.id
                );

              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${encodeURIComponent(
                    ticket.id
                  )}`}
                  className="border border-zinc-200 rounded-2xl p-5 hover:bg-zinc-50 transition"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="font-semibold">
                        {ticket.title}
                      </p>

                      <p className="text-sm text-zinc-500 mt-1">
                        <span className="text-indigo-700">
                          {ticket.company ||
                            "Intern"}
                        </span>{" "}
                        · {ticket.category} ·{" "}
                        {getStatusLabel(
                          ticket.status
                        )}{" "}
                        · 💬 {commentCount}
                      </p>
                    </div>

                    <p className="text-sm text-zinc-500">
                      {ticket.updatedAt}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      </div>

      {/* ACTIVITIES */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            Letzte Aktivitäten
          </h2>

          <Link
            href="/activity"
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Alle anzeigen
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {activities.length === 0 && (
            <p className="text-zinc-500">
              Noch keine Aktivitäten
            </p>
          )}

          {activities
            .slice(
              0,
              8
            )
            .map(
              (
                activity: any,
                index: number
              ) => (
                <div
                  key={`${activity.createdAt}-${activity.type}-${index}`}
                  className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0 gap-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                      {getActivityIcon(
                        activity.type
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        {activity.user ||
                          "Unbekannt"}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                          {activity.company ||
                            "Intern"}
                        </span>

                        <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                          {getActivityLabel(
                            activity.type
                          )}
                        </span>
                      </div>

                      <p className="mt-2 break-words">
                        {activity.title ||
                          "Ohne Titel"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 whitespace-nowrap">
                    {activity.createdAt ||
                      "Unbekannt"}
                  </p>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}