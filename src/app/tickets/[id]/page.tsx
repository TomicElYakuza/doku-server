"use client";

import Link from "next/link";

import {
  ChangeEvent,
  use,
  useEffect,
  useState,
} from "react";

import {
  deleteTicket,
  getPriorityClass,
  getPriorityLabel,
  getStatusClass,
  getStatusLabel,
  getTicketById,
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
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getDepartments,
} from "../../../lib/companyStorage";

import type {
  Company,
  Department,
} from "../../../lib/companyStorage";

import {
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../../lib/ticketActivityHelpers";

import TicketComments from "../../../components/tickets/TicketComments";

import TicketFileList from "../../../components/tickets/TicketFileList";

import {
  readTicketFiles,
  saveTicketFiles,
} from "../../../lib/ticketFileHelpers";

import type {
  PendingTicketFile,
} from "../../../lib/ticketFileHelpers";

type TicketDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const {
    id,
  } = use(
    params
  );

  const [mounted, setMounted] =
    useState(false);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [showEditForm, setShowEditForm] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TicketStatus>("open");

  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  const [category, setCategory] =
    useState("Allgemein");

  const [companyId, setCompanyId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [company, setCompany] =
    useState("Intern");

  const [department, setDepartment] =
    useState("Allgemein");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [createdBy, setCreatedBy] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [pendingFiles, setPendingFiles] =
    useState<PendingTicketFile[]>([]);

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleTicketsUpdated() {
      loadData();
    }

    function handleCompaniesUpdated() {
      loadData();
    }

    function handleDepartmentsUpdated() {
      loadData();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleTicketsUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleTicketsUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );
    };
  }, [
    id,
  ]);

  function loadData() {
    const nextCompanies =
      getCompanies();

    const nextDepartments =
      getDepartments();

    const loadedTicket =
      getTicketById(
        id
      );

    setCompanies(
      nextCompanies
    );

    setDepartments(
      nextDepartments
    );

    setTicket(
      loadedTicket
    );

    if (loadedTicket) {
      setTitle(
        loadedTicket.title
      );

      setDescription(
        loadedTicket.description
      );

      setStatus(
        loadedTicket.status
      );

      setPriority(
        loadedTicket.priority
      );

      setCategory(
        loadedTicket.category
      );

      setCompanyId(
        loadedTicket.companyId ||
        ""
      );

      setDepartmentId(
        loadedTicket.departmentId ||
        ""
      );

      setCompany(
        loadedTicket.company ||
        "Intern"
      );

      setDepartment(
        loadedTicket.department ||
        "Allgemein"
      );

      setAssignedTo(
        loadedTicket.assignedTo ||
        ""
      );

      setCreatedBy(
        loadedTicket.createdBy ||
        ""
      );

      setTags(
        loadedTicket.tags?.join(", ") ||
        ""
      );

      setPendingFiles([]);

      return;
    }

    const firstCompany =
      nextCompanies[0];

    const firstDepartment =
      nextDepartments[0];

    setCompanyId(
      firstCompany?.id ||
      ""
    );

    setDepartmentId(
      firstDepartment?.id ||
      ""
    );

    setCompany(
      firstCompany?.name ||
      "Intern"
    );

    setDepartment(
      firstDepartment?.name ||
      "Allgemein"
    );
  }

  function getCompanyName(
    nextCompanyId?: string
  ) {
    if (!nextCompanyId) {
      return "";
    }

    return (
      companies.find(
        (item) =>
          item.id === nextCompanyId
      )?.name || ""
    );
  }

  function getDepartmentName(
    nextDepartmentId?: string
  ) {
    if (!nextDepartmentId) {
      return "";
    }

    return (
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      )?.name || ""
    );
  }

  function getSelectableDepartments() {
    if (!companyId) {
      return getActiveDepartments();
    }

    return getActiveDepartmentsByCompanyId(
      companyId
    );
  }

  function handleCompanyChange(
    nextCompanyId: string
  ) {
    setCompanyId(
      nextCompanyId
    );

    const selectedCompany =
      companies.find(
        (item) =>
          item.id === nextCompanyId
      );

    setCompany(
      selectedCompany?.name ||
      "Intern"
    );

    const nextDepartments =
      getActiveDepartmentsByCompanyId(
        nextCompanyId
      );

    const firstDepartment =
      nextDepartments[0];

    setDepartmentId(
      firstDepartment?.id ||
      ""
    );

    setDepartment(
      firstDepartment?.name ||
      "Allgemein"
    );
  }

  function handleDepartmentChange(
    nextDepartmentId: string
  ) {
    setDepartmentId(
      nextDepartmentId
    );

    const selectedDepartment =
      departments.find(
        (item) =>
          item.id === nextDepartmentId
      );

    setDepartment(
      selectedDepartment?.name ||
      "Allgemein"
    );
  }

  async function handleTicketFilesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      await readTicketFiles(
        event.target.files
      );

    setPendingFiles(
      (currentFiles) => [
        ...currentFiles,
        ...files,
      ]
    );

    event.target.value =
      "";
  }

  function removePendingFile(
    index: number
  ) {
    setPendingFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_file, fileIndex) =>
            fileIndex !== index
        )
    );
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

    const selectedCompanyName =
      getCompanyName(
        companyId
      ) ||
      company.trim() ||
      "Intern";

    const selectedDepartmentName =
      getDepartmentName(
        departmentId
      ) ||
      department.trim() ||
      "Allgemein";

    const tagList =
      tags
        .split(",")
        .map(
          (tag) =>
            tag.trim()
        )
        .filter(Boolean);

    const updatedTicket =
      updateTicket(
        ticket.id,
        {
          title:
            title.trim(),

          description:
            description.trim(),

          status,

          priority,

          category:
            category.trim() ||
            "Allgemein",

          companyId,

          departmentId,

          company:
            selectedCompanyName,

          department:
            selectedDepartmentName,

          assignedTo:
            assignedTo.trim(),

          createdBy:
            createdBy.trim(),

          tags:
            tagList,
        }
      );

    if (updatedTicket) {
      if (pendingFiles.length > 0) {
        saveTicketFiles(
          updatedTicket.id,
          pendingFiles
        );

        setPendingFiles([]);
      }

      saveTicketUpdatedActivity(
        updatedTicket
      );

      setTicket(
        updatedTicket
      );
    }

    setShowEditForm(
      false
    );
  }

  function handleDeleteTicket() {
    if (!ticket) {
      return;
    }

    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, dieses Ticket zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `Ticket "${ticket.title}" wirklich löschen?`
      );

    if (!confirmed) {
      return;
    }

    saveTicketDeletedActivity(
      ticket
    );

    deleteTicket(
      ticket.id
    );

    window.location.href =
      "/tickets";
  }

  if (!mounted) {
    return null;
  }

  if (!ticket) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900 transition"
          >
            dashboard
          </Link>

          <span className="text-zinc-400">
            /
          </span>

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

        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Ticket nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Das Ticket existiert nicht mehr oder wurde gelöscht.
          </p>
        </div>
      </div>
    );
  }

  const ticketCompany =
    ticket.company ||
    getCompanyName(
      ticket.companyId
    ) ||
    "Intern";

  const ticketDepartment =
    ticket.department ||
    getDepartmentName(
      ticket.departmentId
    ) ||
    "Allgemein";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

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
          {ticket.title}
        </span>
      </div>

      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
      >
        ← Zurück zu Tickets
      </Link>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(ticket.status)}`}>
                {getStatusLabel(
                  ticket.status
                )}
              </span>

              <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(ticket.priority)}`}>
                {getPriorityLabel(
                  ticket.priority
                )}
              </span>

              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                {ticket.category}
              </span>

              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                {ticketCompany}
              </span>

              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {ticketDepartment}
              </span>
            </div>

            <h1 className="text-4xl font-bold mt-5">
              {ticket.title}
            </h1>

            <p className="text-zinc-500 mt-3">
              Ticket-ID: {ticket.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-end shrink-0">
            {canEdit() && (
              <button
                onClick={() =>
                  setShowEditForm(
                    !showEditForm
                  )
                }
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
              >
                {showEditForm
                  ? "Bearbeiten schließen"
                  : "Bearbeiten"}
              </button>
            )}

            {canDelete() && (
              <button
                onClick={handleDeleteTicket}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
              >
                Löschen
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            Ticket bearbeiten
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block mb-2 font-medium">
                Titel
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
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
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TicketStatus
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="open">
                  Offen
                </option>

                <option value="in_progress">
                  In Bearbeitung
                </option>

                <option value="waiting">
                  Wartend
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
                    event.target.value as TicketPriority
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

            <div>
              <label className="block mb-2 font-medium">
                Firma
              </label>

              <select
                value={companyId}
                onChange={(event) =>
                  handleCompanyChange(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Firma auswählen
                </option>

                {companies.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>

              <select
                value={departmentId}
                onChange={(event) =>
                  handleDepartmentChange(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              >
                <option value="">
                  Abteilung auswählen
                </option>

                {getSelectableDepartments().map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>

              <input
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
                Erstellt von
              </label>

              <input
                value={createdBy}
                onChange={(event) =>
                  setCreatedBy(
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
                rows={5}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Tags
              </label>

              <input
                type="text"
                value={tags}
                onChange={(event) =>
                  setTags(
                    event.target.value
                  )
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="kommagetrennt"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                <label className="block mb-2 font-medium">
                    Dateien & Anhänge hinzufügen
                </label>
              </label>

              <input
                type="file"
                multiple
                onChange={handleTicketFilesChange}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
              />

              <p className="text-sm text-zinc-500 mt-2">
                Neue Dateien und Anhänge werden beim Speichern dem Ticket hinzugefügt.
              </p>

              {pendingFiles.length > 0 && (
                <div className="grid gap-2 mt-4">
                  {pendingFiles.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {file.name}
                          </p>

                          <p className="text-xs text-zinc-500">
                            {Math.round(
                              file.size / 1024
                            )} KB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removePendingFile(
                              index
                            )
                          }
                          className="text-sm bg-white border border-zinc-200 px-3 py-2 rounded-xl hover:bg-zinc-100 transition"
                        >
                          Entfernen
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
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
              onClick={() =>
                setShowEditForm(
                  false
                )
              }
              className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">
              Beschreibung
            </h2>

            <p className="text-zinc-600 mt-4 whitespace-pre-wrap">
              {ticket.description ||
                "Keine Beschreibung vorhanden."}
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <TicketFileList
              ticketId={ticket.id}
              editable={canEdit()}
            />
          </div>

          <TicketComments
            ticketId={ticket.id}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Details
            </h2>

            <div className="space-y-4 text-sm mt-5">
              <div>
                <p className="text-zinc-500">
                  Firma
                </p>

                <p className="font-medium">
                  {ticketCompany}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Abteilung
                </p>

                <p className="font-medium">
                  {ticketDepartment}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Zuständig
                </p>

                <p className="font-medium">
                  {ticket.assignedTo ||
                    "Nicht zugewiesen"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Erstellt von
                </p>

                <p className="font-medium">
                  {ticket.createdBy ||
                    "Unbekannt"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Erstellt
                </p>

                <p className="font-medium">
                  {ticket.createdAt}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">
                  Aktualisiert
                </p>

                <p className="font-medium">
                  {ticket.updatedAt}
                </p>
              </div>
            </div>
          </div>

          {ticket.tags &&
            ticket.tags.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold">
                  Tags
                </h2>

                <div className="flex flex-wrap gap-2 mt-4">
                  {ticket.tags.map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}