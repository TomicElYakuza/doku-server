"use client";

import Link from "next/link";

import {
  ChangeEvent,
  use,
  useEffect,
  useState,
} from "react";

import {
  ticketRepository,
} from "../../../lib/ticketRepository";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../lib/ticketStorage";

import {
  companyRepository,
} from "../../../lib/companyRepository";

import type {
  Company,
  Department,
} from "../../../lib/companyStorage";

import {
  canDelete,
  canEdit,
} from "../../../lib/permissions";

import {
  saveTicketDeletedActivity,
  saveTicketUpdatedActivity,
} from "../../../lib/ticketActivityHelpers";

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

function getStatusOptions(): Array<{
  value: TicketStatus;
  label: string;
}> {
  return [
    {
      value:
        "open",

      label:
        "Offen",
    },
    {
      value:
        "in_progress",

      label:
        "In Bearbeitung",
    },
    {
      value:
        "waiting",

      label:
        "Wartend",
    },
    {
      value:
        "done",

      label:
        "Erledigt",
    },
    {
      value:
        "closed",

      label:
        "Geschlossen",
    },
  ];
}

function getPriorityOptions(): Array<{
  value: TicketPriority;
  label: string;
}> {
  return [
    {
      value:
        "low",

      label:
        "Niedrig",
    },
    {
      value:
        "medium",

      label:
        "Mittel",
    },
    {
      value:
        "high",

      label:
        "Hoch",
    },
    {
      value:
        "urgent",

      label:
        "Dringend",
    },
  ];
}

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
    const nextTicket =
      ticketRepository.findById(
        id
      );

    const nextCompanies =
      companyRepository.listCompanies();

    const nextDepartments =
      companyRepository.listDepartments();

    setTicket(
      nextTicket
    );

    setCompanies(
      nextCompanies
    );

    setDepartments(
      nextDepartments
    );

    if (nextTicket) {
      setTitle(
        nextTicket.title
      );

      setDescription(
        nextTicket.description ||
          ""
      );

      setStatus(
        nextTicket.status
      );

      setPriority(
        nextTicket.priority
      );

      setCategory(
        nextTicket.category ||
          "Allgemein"
      );

      setCompanyId(
        nextTicket.companyId ||
          ""
      );

      setDepartmentId(
        nextTicket.departmentId ||
          ""
      );

      setCompany(
        nextTicket.company ||
          "Intern"
      );

      setDepartment(
        nextTicket.department ||
          "Allgemein"
      );

      setAssignedTo(
        nextTicket.assignedTo ||
          ""
      );

      setCreatedBy(
        nextTicket.createdBy ||
          ""
      );

      setTags(
        nextTicket.tags?.join(
          ", "
        ) || ""
      );

      setPendingFiles([]);
    }
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

  function getTicketCompany() {
    if (!ticket) {
      return company;
    }

    return (
      ticket.company ||
      getCompanyName(
        ticket.companyId
      ) ||
      "Intern"
    );
  }

  function getTicketDepartment() {
    if (!ticket) {
      return department;
    }

    return (
      ticket.department ||
      getDepartmentName(
        ticket.departmentId
      ) ||
      "Allgemein"
    );
  }

  function getSelectableDepartments() {
    if (!companyId) {
      return companyRepository.listActiveDepartments();
    }

    return companyRepository.listActiveDepartmentsByCompanyId(
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
      companyRepository.listActiveDepartmentsByCompanyId(
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

  function resetEditForm() {
    if (!ticket) {
      return;
    }

    setTitle(
      ticket.title
    );

    setDescription(
      ticket.description ||
        ""
    );

    setStatus(
      ticket.status
    );

    setPriority(
      ticket.priority
    );

    setCategory(
      ticket.category ||
        "Allgemein"
    );

    setCompanyId(
      ticket.companyId ||
        ""
    );

    setDepartmentId(
      ticket.departmentId ||
        ""
    );

    setCompany(
      ticket.company ||
        "Intern"
    );

    setDepartment(
      ticket.department ||
        "Allgemein"
    );

    setAssignedTo(
      ticket.assignedTo ||
        ""
    );

    setCreatedBy(
      ticket.createdBy ||
        ""
    );

    setTags(
      ticket.tags?.join(
        ", "
      ) || ""
    );

    setPendingFiles([]);

    setShowEditForm(
      false
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
      ticketRepository.update(
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

    ticketRepository.delete(
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
        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zu Tickets
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Ticket nicht gefunden
          </h1>

          <p className="text-zinc-500 mt-3">
            Dieses Ticket existiert nicht oder wurde entfernt.
          </p>
        </div>
      </div>
    );
  }

  const ticketCompany =
    getTicketCompany();

  const ticketDepartment =
    getTicketDepartment();

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zu Tickets
        </Link>

        <div className="flex flex-wrap gap-3">
          {canEdit() && (
            <button
              type="button"
              onClick={() =>
                setShowEditForm(
                  true
                )
              }
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Bearbeiten
            </button>
          )}

          {canDelete() && (
            <button
              type="button"
              onClick={handleDeleteTicket}
              className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
            >
              Löschen
            </button>
          )}
        </div>
      </div>

      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  Ticket bearbeiten
                </h2>

                <p className="text-zinc-500 mt-2">
                  Änderungen am Ticket übernehmen und optional weitere Anhänge hinzufügen.
                </p>
              </div>

              <button
                type="button"
                onClick={resetEditForm}
                className="h-11 w-11 rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition"
                aria-label="Fenster schließen"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div className="md:col-span-2">
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
                  placeholder="Kurzer Titel"
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
                  {getStatusOptions().map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
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
                  {getPriorityOptions().map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
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
                  placeholder="IT, Benutzer, Dokumentation..."
                />
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

                  {companyRepository
                    .listActiveCompanies()
                    .map(
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
                  placeholder="Name"
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
                  placeholder="Name"
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
                  placeholder="Beschreibung des Tickets..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">
                  Tags
                </label>

                <input
                  value={tags}
                  onChange={(event) =>
                    setTags(
                      event.target.value
                    )
                  }
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                  placeholder="kommagetrennt, z. B. drucker, netzwerk"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">
                  Dateien & Anhänge hinzufügen
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

            <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t border-zinc-200">
              <button
                type="button"
                onClick={resetEditForm}
                className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={handleSaveTicket}
                className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}

      <article className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${ticketRepository.getStatusClass(ticket.status)}`}>
            {ticketRepository.getStatusLabel(
              ticket.status
            )}
          </span>

          <span className={`text-xs px-3 py-1 rounded-full ${ticketRepository.getPriorityClass(ticket.priority)}`}>
            {ticketRepository.getPriorityLabel(
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

        <h1 className="text-5xl font-black tracking-tight mt-6">
          #{ticket.id} · {ticket.title}
        </h1>

        <p className="text-xl text-zinc-500 mt-4 leading-relaxed whitespace-pre-wrap">
          {ticket.description ||
            "Keine Beschreibung vorhanden."}
        </p>

        {ticket.tags &&
          ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {ticket.tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                )
              )}
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-200">
          <div>
            <p className="text-sm text-zinc-500">
              Erstellt
            </p>

            <p className="font-semibold mt-1">
              {ticket.createdAt}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Aktualisiert
            </p>

            <p className="font-semibold mt-1">
              {ticket.updatedAt}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Erstellt von
            </p>

            <p className="font-semibold mt-1">
              {ticket.createdBy ||
                "Unbekannt"}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">
              Zuständig
            </p>

            <p className="font-semibold mt-1">
              {ticket.assignedTo ||
                "Nicht zugewiesen"}
            </p>
          </div>
        </div>
      </article>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <TicketFileList
          ticketId={ticket.id}
          editable={canEdit()}
        />
      </div>
    </div>
  );
}