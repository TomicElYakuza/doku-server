"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplates,
  resetTicketTemplates,
  updateTicketTemplate,
} from "../../../lib/ticketTemplateStorage";

import type {
  TicketTemplate,
} from "../../../lib/ticketTemplateStorage";

import type {
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";

export default function TicketTemplatesPage() {
  const [mounted, setMounted] =
    useState(false);

  const [templates, setTemplates] =
    useState<TicketTemplate[]>([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

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

    loadTemplates();

    function handleTemplatesUpdated() {
      loadTemplates();
    }

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTemplatesUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTemplatesUpdated
      );
    };
  }, []);

  function loadTemplates() {
    setTemplates(
      getTicketTemplates()
    );
  }

  function resetForm() {
    setShowForm(false);

    setEditingId("");

    setTitle("");

    setDescription("");

    setCompany("Intern");

    setCategory("Support");

    setAssignedTo("");

    setStatus("open");

    setPriority("medium");
  }

  function openCreateForm() {
    resetForm();

    setShowForm(true);
  }

  function startEdit(
    template: TicketTemplate
  ) {
    setEditingId(template.id);

    setTitle(template.title);

    setDescription(
      template.description
    );

    setCompany(
      template.company ||
        "Intern"
    );

    setCategory(
      template.category ||
        "Support"
    );

    setAssignedTo(
      template.assignedTo ||
        ""
    );

    setStatus(
      template.status ||
        "open"
    );

    setPriority(
      template.priority ||
        "medium"
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSave() {
    if (editingId && !canEdit()) {
      alert(
        "Du hast keine Berechtigung, Templates zu bearbeiten."
      );

      return;
    }

    if (!editingId && !canCreate()) {
      alert(
        "Du hast keine Berechtigung, Templates zu erstellen."
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

    const payload = {
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
    };

    if (editingId) {
      updateTicketTemplate(
        editingId,
        payload
      );
    } else {
      createTicketTemplate(
        payload
      );
    }

    resetForm();
  }

  function handleDelete(
    template: TicketTemplate
  ) {
    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Templates löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Template wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    deleteTicketTemplate(
      template.id
    );
  }

  function handleResetDefaults() {
    if (!canDelete()) {
      alert(
        "Nur Admins dürfen Templates zurücksetzen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Alle Ticket-Templates auf Standard zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    resetTicketTemplates();

    resetForm();
  }

  function getPriorityLabel(
    value: string
  ) {
    if (value === "urgent") {
      return "Dringend";
    }

    if (value === "high") {
      return "Hoch";
    }

    if (value === "medium") {
      return "Mittel";
    }

    return "Niedrig";
  }

  function getStatusLabel(
    value: string
  ) {
    if (value === "open") {
      return "Offen";
    }

    if (value === "in-progress") {
      return "In Bearbeitung";
    }

    if (value === "done") {
      return "Erledigt";
    }

    return "Geschlossen";
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

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-6xl">
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

        <span className="text-zinc-900">
          templates
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

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Ticket-Templates
          </h1>

          <p className="text-zinc-500 mt-2">
            Vorlagen für häufige Supportfälle verwalten
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          {canCreate() && (
            <button
              onClick={openCreateForm}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Neues Template
            </button>
          )}

          {canDelete() && (
            <button
              onClick={handleResetDefaults}
              className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-red-50 transition"
            >
              Standards wiederherstellen
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Templates gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {templates.length}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Firmen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              Array.from(
                new Set(
                  templates.map(
                    (template) =>
                      template.company ||
                      "Intern"
                  )
                )
              ).length
            }
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Kategorien
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {
              Array.from(
                new Set(
                  templates.map(
                    (template) =>
                      template.category ||
                      "Allgemein"
                  )
                )
              ).length
            }
          </h2>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {editingId
              ? "Template bearbeiten"
              : "Neues Template erstellen"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
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
                placeholder="z. B. VPN Verbindung funktioniert nicht"
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
                rows={8}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
                placeholder="Beschreibung / Checkliste / Standardablauf"
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
              onClick={handleSave}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              {editingId
                ? "Änderungen speichern"
                : "Template erstellen"}
            </button>

            <button
              onClick={resetForm}
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="grid gap-4">
        {templates.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <p className="text-zinc-500">
              Keine Templates vorhanden.
            </p>
          </div>
        )}

        {templates.map(
          (template) => (
            <div
              key={template.id}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                      {template.company ||
                        "Intern"}
                    </span>

                    <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                      {template.category ||
                        "Allgemein"}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getStatusClass(
                        template.status
                      )}`}
                    >
                      {getStatusLabel(
                        template.status
                      )}
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(
                        template.priority
                      )}`}
                    >
                      {getPriorityLabel(
                        template.priority
                      )}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mt-4">
                    {template.title}
                  </h2>

                  <p className="text-zinc-600 mt-3 whitespace-pre-wrap">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                    <p>
                      Zugewiesen an:{" "}
                      {template.assignedTo ||
                        "Niemand"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end shrink-0">
                  {canEdit() && (
                    <button
                      onClick={() =>
                        startEdit(
                          template
                        )
                      }
                      className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                    >
                      Bearbeiten
                    </button>
                  )}

                  {canDelete() && (
                    <button
                      onClick={() =>
                        handleDelete(
                          template
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