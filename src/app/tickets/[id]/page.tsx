"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  deleteTicket,
  getPriorityLabel,
  getStatusLabel,
  getTickets,
  updateTicket,
} from "../../../lib/ticketStorage";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

import {
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  saveActivity,
} from "../../../lib/activityStorage";

import {
  getUser,
} from "../../../lib/userStorage";

export default function TicketDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    params.id as string;

  const [mounted, setMounted] =
    useState(false);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [checked, setChecked] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [category, setCategory] =
    useState("Support");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [status, setStatus] =
    useState<TicketStatus>("open");

  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  useEffect(() => {
    setMounted(true);

    loadTicket();

    function handleTicketsUpdated() {
      loadTicket();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );
    };
  }, [id]);

  function loadTicket() {
    const tickets =
      getTickets();

    const foundTicket =
      tickets.find(
        (item) =>
          item.id === id
      );

    setTicket(
      foundTicket || null
    );

    if (foundTicket) {
      setTitle(
        foundTicket.title || ""
      );

      setDescription(
        foundTicket.description || ""
      );

      setCompany(
        foundTicket.company || "Intern"
      );

      setCategory(
        foundTicket.category || "Support"
      );

      setAssignedTo(
        foundTicket.assignedTo || ""
      );

      setStatus(
        foundTicket.status || "open"
      );

      setPriority(
        foundTicket.priority || "medium"
      );
    }

    setChecked(true);
  }

  function getPriorityClass(
    value: string
  ) {
    if (value === "urgent") {
      return "bg-red-100 text-red-700";
    }

    if (value === "high") {
      return "bg-orange-100 text-orange-700";
    }

    if (value === "medium") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  }

  function getStatusClass(
    value: string
  ) {
    if (value === "open") {
      return "bg-blue-100 text-blue-700";
    }

    if (value === "in-progress") {
      return "bg-purple-100 text-purple-700";
    }

    if (value === "done") {
      return "bg-green-100 text-green-700";
    }

    return "bg-zinc-100 text-zinc-700";
  }

  function startEditing() {
    if (!ticket) {
      return;
    }

    setTitle(ticket.title || "");

    setDescription(
      ticket.description || ""
    );

    setCompany(
      ticket.company || "Intern"
    );

    setCategory(
      ticket.category || "Support"
    );

    setAssignedTo(
      ticket.assignedTo || ""
    );

    setStatus(
      ticket.status || "open"
    );

    setPriority(
      ticket.priority || "medium"
    );

    setEditing(true);
  }

  function cancelEditing() {
    if (!ticket) {
      return;
    }

    setTitle(ticket.title || "");

    setDescription(
      ticket.description || ""
    );

    setCompany(
      ticket.company || "Intern"
    );

    setCategory(
      ticket.category || "Support"
    );

    setAssignedTo(
      ticket.assignedTo || ""
    );

    setStatus(
      ticket.status || "open"
    );

    setPriority(
      ticket.priority || "medium"
    );

    setEditing(false);
  }

  function handleSaveTicket() {
    if (!ticket) {
      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, dieses Ticket zu bearbeiten."
      );

      return;
    }

    if (!title.trim()) {
      alert(
        "Bitte einen Titel eingeben."
      );

      return;
    }

    if (!company.trim()) {
      alert(
        "Bitte eine Firma eingeben."
      );

      return;
    }

    const updated =
      updateTicket(ticket.id, {
        title:
          title.trim(),

        description:
          description.trim(),

        company:
          company.trim() ||
          "Intern",

        category:
          category.trim() ||
          "Allgemein",

        assignedTo:
          assignedTo.trim(),

        status,

        priority,
      });

    if (updated) {
      saveActivity({
        type: "ticketUpdated",

        title:
          updated.title,

        company:
          updated.company ||
          "Intern",

        user:
          getUser()?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });

      setTicket(updated);

      setEditing(false);
    }
  }

  function handleStatusChange(
    nextStatus: TicketStatus
  ) {
    if (!ticket) {
      return;
    }

    if (!canEdit()) {
      alert(
        "Du hast keine Berechtigung, dieses Ticket zu bearbeiten."
      );

      return;
    }

    const updated =
      updateTicket(ticket.id, {
        status:
          nextStatus,
      });

    if (updated) {
      saveActivity({
        type: "ticketUpdated",

        title:
          updated.title,

        company:
          updated.company ||
          "Intern",

        user:
          getUser()?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });

      setTicket(updated);

      setStatus(
        updated.status
      );
    }
  }

  function handleDelete() {
    if (!ticket) {
      return;
    }

    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Tickets löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Ticket wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteTicket(ticket.id);

    saveActivity({
      type: "ticketDeleted",

      title:
        ticket.title,

      company:
        ticket.company ||
        "Intern",

      user:
        getUser()?.name ||
        "Unbekannt",

      createdAt:
        new Date().toLocaleString(),
    });

    router.push("/tickets");
  }

  if (!mounted || !checked) {
    return null;
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6 text-sm">
          <Link
            href="/tickets"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            tickets
          </Link>

          <span className="text-zinc-400">
            /
          </span>

          <span className="text-zinc-900">
            nicht gefunden
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mb-6">
            🔎
          </div>

          <h1 className="text-4xl font-bold">
            Ticket nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Dieses Ticket existiert nicht mehr oder wurde gelöscht.
          </p>

          <Link
            href="/tickets"
            className="inline-flex mt-8 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zurück zu Tickets
          </Link>
        </div>
      </div>
    );
  }

  const ticketCompany =
    ticket.company || "Intern";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/tickets"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          tickets
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-500">
          {ticketCompany}
        </span>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          {ticket.title}
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>
      </div>

      {/* VIEW CARD */}
      {!editing && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {ticketCompany}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                    ticket.status
                  )}`}
                >
                  {getStatusLabel(
                    ticket.status
                  )}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(
                    ticket.priority
                  )}`}
                >
                  {getPriorityLabel(
                    ticket.priority
                  )}
                </span>

                <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                  {ticket.category}
                </span>
              </div>

              <h1 className="text-4xl font-bold mt-5">
                {ticket.title}
              </h1>

              <p className="text-zinc-600 mt-4 whitespace-pre-wrap">
                {ticket.description ||
                  "Keine Beschreibung"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-end shrink-0">
              {canEdit() && (
                <button
                  onClick={startEditing}
                  className="bg-zinc-900 text-white px-5 py-3 rounded-xl hover:bg-zinc-700 transition"
                >
                  Bearbeiten
                </button>
              )}

              {canDelete() && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 transition"
                >
                  Löschen
                </button>
              )}
            </div>
          </div>

          {/* META */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100">
            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Firma
              </p>

              <p className="font-semibold mt-1">
                {ticketCompany}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Kategorie
              </p>

              <p className="font-semibold mt-1">
                {ticket.category}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Erstellt von
              </p>

              <p className="font-semibold mt-1">
                {ticket.createdBy}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Zugewiesen an
              </p>

              <p className="font-semibold mt-1">
                {ticket.assignedTo ||
                  "Niemand"}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Erstellt am
              </p>

              <p className="font-semibold mt-1">
                {ticket.createdAt}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Aktualisiert am
              </p>

              <p className="font-semibold mt-1">
                {ticket.updatedAt}
              </p>
            </div>
          </div>

          {/* STATUS ACTIONS */}
          {canEdit() && (
            <div className="mt-8 pt-8 border-t border-zinc-100">
              <h2 className="text-2xl font-semibold">
                Status ändern
              </h2>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() =>
                    handleStatusChange(
                      "open"
                    )
                  }
                  className="bg-blue-100 text-blue-700 px-5 py-3 rounded-2xl hover:bg-blue-200 transition"
                >
                  Offen
                </button>

                <button
                  onClick={() =>
                    handleStatusChange(
                      "in-progress"
                    )
                  }
                  className="bg-purple-100 text-purple-700 px-5 py-3 rounded-2xl hover:bg-purple-200 transition"
                >
                  In Bearbeitung
                </button>

                <button
                  onClick={() =>
                    handleStatusChange(
                      "done"
                    )
                  }
                  className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl hover:bg-green-200 transition"
                >
                  Erledigt
                </button>

                <button
                  onClick={() =>
                    handleStatusChange(
                      "closed"
                    )
                  }
                  className="bg-zinc-100 text-zinc-700 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition"
                >
                  Geschlossen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT CARD */}
      {editing && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold">
            Ticket bearbeiten
          </h1>

          <p className="text-zinc-500 mt-2">
            Bearbeite Titel, Beschreibung, Firma, Kategorie, Status und Priorität.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Beschreibung
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={6}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <input
                type="text"
                value={company}
                onChange={(event) =>
                  setCompany(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="z. B. Intern, Muster GmbH, Kunde A"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>

              <input
                type="text"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Support, IT, HR..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>

              <input
                type="text"
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name oder leer lassen"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as TicketStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="open">
                  Offen
                </option>

                <option value="in-progress">
                  In Bearbeitung
                </option>

                <option value="done">
                  Erledigt
                </option>

                <option value="closed">
                  Geschlossen
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Priorität
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as TicketPriority
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="low">
                  Niedrig
                </option>

                <option value="medium">
                  Mittel
                </option>

                <option value="high">
                  Hoch
                </option>

                <option value="urgent">
                  Dringend
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleSaveTicket}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              Änderungen speichern
            </button>

            <button
              onClick={cancelEditing}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}