"use client";

import { taxonomyRepository } from "../../../lib/taxonomyRepository";

import {
  assignableUserRepository,
  type AssignableUser,
} from "../../../lib/assignableUserRepository";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AppModal from "../../../components/AppModal";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  useFeatureFlags,
} from "../../../hooks/useFeatureFlags";
import {
  companyRepository,
} from "../../../lib/companyRepository";
import {
  canCreate,
  canDelete,
  canEdit,
} from "../../../lib/permissions";
import {
  ticketTemplateRepository,
} from "../../../lib/ticketTemplateRepository";
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../types/ticketTemplate";

type TemplateAssignableUser = AssignableUser;

type ViewMode = "cards" | "table";

type TaxonomyItem = {
  id: string;
  type: "category" | "tag";
  target: string;
  name: string;
  slug?: string;
  path?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type SelectOption = {
  id: string;
  value: string;
  label: string;
};

const statusOptions: {
  value: TicketTemplateStatus;
  label: string;
}[] = [
  {
    value: "open",
    label: "Offen",
  },
  {
    value: "in_progress",
    label: "In Bearbeitung",
  },
  {
    value: "waiting",
    label: "Wartend",
  },
  {
    value: "done",
    label: "Erledigt",
  },
  {
    value: "closed",
    label: "Geschlossen",
  },
];

const priorityOptions: {
  value: TicketTemplatePriority;
  label: string;
}[] = [
  {
    value: "low",
    label: "Niedrig",
  },
  {
    value: "medium",
    label: "Mittel",
  },
  {
    value: "high",
    label: "Hoch",
  },
  {
    value: "urgent",
    label: "Dringend",
  },
];

function getTemplateStatusLabel(status: TicketTemplateStatus | string) {
  return ticketTemplateRepository.getStatusLabel(status);
}

function getTemplateStatusClass(status: TicketTemplateStatus | string) {
  return ticketTemplateRepository.getStatusClass(status);
}

function getTemplatePriorityLabel(priority: TicketTemplatePriority | string) {
  return ticketTemplateRepository.getPriorityLabel(priority);
}

function getTemplatePriorityClass(priority: TicketTemplatePriority | string) {
  return ticketTemplateRepository.getPriorityClass(priority);
}

function getSafeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);
}

function getTaxonomyLabel(
  item: TaxonomyItem,
  allItems: TaxonomyItem[],
) {
  if (item.path?.trim()) {
    return item.path.trim();
  }

  const names: string[] = [];
  let current: TaxonomyItem | undefined = item;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    names.unshift(current.name);

    if (!current.parentId) {
      break;
    }

    current = allItems.find(
      (candidate) => candidate.id === current?.parentId,
    );
  }

  return names.join(" > ") || item.name;
}

function sortByLabel(
  first: SelectOption,
  second: SelectOption,
) {
  return first.label.localeCompare(second.label);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("de-AT");
  } catch {
    return value;
  }
}

export default function TicketTemplatesPage() {
  const {
    ticketTemplatesEnabled,
  } = useFeatureFlags();

  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<TemplateAssignableUser[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TaxonomyItem[]>([]);
  const [ticketTags, setTicketTags] = useState<TaxonomyItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketTemplateStatus>("open");
  const [priority, setPriority] = useState<TicketTemplatePriority>("medium");
  const [category, setCategory] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [company, setCompany] = useState("Intern");
  const [department, setDepartment] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadData();

    function handleTemplatesUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
    }

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleTemplatesUpdated,
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleTemplatesUpdated,
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );
    };
  }, []);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      taxonomyRepository.listActiveByTargetAndType("ticket", "category"),
      taxonomyRepository.listActiveByTargetAndType("global", "tag"),
      taxonomyRepository.listActiveByTargetAndType("ticket", "tag"),
    ]);

    const nextTicketCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [
      index,
      result,
    ] of requests.entries()) {
      if (result.status !== "fulfilled") {
        continue;
      }

      const items: TaxonomyItem[] = Array.isArray(result.value)
        ? result.value
        : [];

      if (index === 0) {
        nextTicketCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setTicketCategories(
      nextTicketCategories.filter((item) => item.isActive !== false),
    );

    setTicketTags(
      Array.from(
        new Map(
          nextTags
            .filter((item) => item.isActive !== false)
            .map((item) => [
              item.name,
              item,
            ]),
        ).values(),
      ),
    );
  }

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
      void assignableUserRepository.list().then((nextUsers: TemplateAssignableUser[]) => {
        setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      }).catch((usersError: unknown) => {
        console.error("TicketTemplates users konnten nicht geladen werden:", usersError);
      });
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextTemplates,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        ticketTemplateRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
        loadTaxonomyItems(),
      ]);

      setTemplates(Array.isArray(nextTemplates) ? nextTemplates : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ticket-Vorlagen konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getCompanyName(nextCompanyId?: string) {
    if (!nextCompanyId) {
      return "Intern";
    }

    return (
      companies.find((nextCompany) => nextCompany.id === nextCompanyId)
        ?.name || "Intern"
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return "Keine Abteilung";
    }

    return (
      departments.find(
        (nextDepartment) => nextDepartment.id === nextDepartmentId,
      )?.name || "Keine Abteilung"
    );
  }

  const categoryOptions = useMemo(
    () =>
      ticketCategories
        .map((item) => {
          const label = getTaxonomyLabel(item, ticketCategories);

          return {
            id: item.id,
            value: label,
            label,
          };
        })
        .filter((option) => option.value.trim())
        .sort(sortByLabel),
    [
      ticketCategories,
    ],
  );

  const tagOptions = useMemo(
    () =>
      ticketTags
        .map((item) => ({
          id: item.id,
          value: item.name,
          label: item.name,
        }))
        .filter((option) => option.value.trim())
        .sort(sortByLabel),
    [
      ticketTags,
    ],
  );

  const departmentOptions = useMemo(() => {
    if (!companyId) {
      return departments;
    }

    return departments.filter(
      (nextDepartment) => nextDepartment.companyId === companyId,
    );
  }, [
    departments,
    companyId,
  ]);

  const filteredDepartments = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter(
      (nextDepartment) => nextDepartment.companyId === companyFilter,
    );
  }, [
    departments,
    companyFilter,
  ]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      const companyName = template.company || getCompanyName(template.companyId);
      const departmentName =
        template.department || getDepartmentName(template.departmentId);
      const templateTags = getSafeTags(template.tags);

      const matchesSearch =
        !query ||
        [
          template.id,
          template.title,
          template.description,
          template.status,
          template.priority,
          template.category,
          companyName,
          departmentName,
          template.assignedTo,
          templateTags.join(" "),
          template.createdAt,
          template.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        template.status === statusFilter;

      const matchesPriority =
        !priorityFilter ||
        template.priority === priorityFilter;

      const matchesCategory =
        !categoryFilter ||
        template.category === categoryFilter;

      const matchesTag =
        !tagFilter ||
        templateTags.includes(tagFilter);

      const matchesCompany =
        !companyFilter ||
        template.companyId === companyFilter;

      const matchesDepartment =
        !departmentFilter ||
        template.departmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesTag &&
        matchesCompany &&
        matchesDepartment
      );
    });
  }, [
    templates,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    tagFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const openTemplates = useMemo(
    () => templates.filter((template) => template.status === "open"),
    [
      templates,
    ],
  );

  const inProgressTemplates = useMemo(
    () => templates.filter((template) => template.status === "in_progress"),
    [
      templates,
    ],
  );

  const closedTemplates = useMemo(
    () => templates.filter((template) => template.status === "closed"),
    [
      templates,
    ],
  );

  const urgentTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          template.priority === "urgent" ||
          template.priority === "high",
      ),
    [
      templates,
    ],
  );

  function resetForm() {
    setEditingTemplateId("");
    setTitle("");
    setDescription("");
    setStatus("open");
    setPriority("medium");
    setCategory(categoryOptions[0]?.value || "");
    setCompanyId("");
    setDepartmentId("");
    setCompany("Intern");
    setDepartment("");
    setAssignedTo("");
    setSelectedTags([]);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function openCreateForm() {
    if (!canCreate()) {
      alert("Du hast keine Berechtigung, Vorlagen zu erstellen.");
      return;
    }

    resetForm();

    const firstCompany = companies[0];
    const firstDepartment = departments.find(
      (nextDepartment) => nextDepartment.companyId === firstCompany?.id,
    );

    setCompanyId(firstCompany?.id || "");
    setDepartmentId(firstDepartment?.id || "");
    setCompany(firstCompany?.name || "Intern");
    setDepartment(firstDepartment?.name || "");
    setModalOpen(true);
  }

  function startEditTemplate(template: TicketTemplate) {
    if (!canEdit()) {
      alert("Du hast keine Berechtigung, Vorlagen zu bearbeiten.");
      return;
    }

    setEditingTemplateId(template.id);
    setTitle(template.title || "");
    setDescription(template.description || "");
    setStatus(template.status || "open");
    setPriority(template.priority || "medium");
    setCategory(template.category || categoryOptions[0]?.value || "");
    setCompanyId(template.companyId || "");
    setDepartmentId(template.departmentId || "");
    setCompany(template.company || getCompanyName(template.companyId));
    setDepartment(template.department || getDepartmentName(template.departmentId));
    setAssignedTo(template.assignedTo || "");
    setSelectedTags(getSafeTags(template.tags));
    setModalOpen(true);
  }

  function handleCompanyChange(nextCompanyId: string) {
    const selectedCompany = companies.find(
      (nextCompany) => nextCompany.id === nextCompanyId,
    );
    const firstDepartment = departments.find(
      (nextDepartment) => nextDepartment.companyId === nextCompanyId,
    );

    setCompanyId(nextCompanyId);
    setDepartmentId(firstDepartment?.id || "");
    setCompany(selectedCompany?.name || "Intern");
    setDepartment(firstDepartment?.name || "");
  }

  function handleDepartmentChange(nextDepartmentId: string) {
    const selectedDepartment = departments.find(
      (nextDepartment) => nextDepartment.id === nextDepartmentId,
    );

    setDepartmentId(nextDepartmentId);
    setDepartment(selectedDepartment?.name || "");
  }

  function toggleTag(tag: string) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter((currentTag) => currentTag !== tag);
      }

      return [
        ...currentTags,
        tag,
      ];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (editingTemplateId && !canEdit()) {
      alert("Du hast keine Berechtigung, Vorlagen zu bearbeiten.");
      return;
    }

    if (!editingTemplateId && !canCreate()) {
      alert("Du hast keine Berechtigung, Vorlagen zu erstellen.");
      return;
    }

    if (!title.trim()) {
      alert("Bitte einen Titel eingeben.");
      return;
    }

    if (!category.trim()) {
      alert("Bitte eine Kategorie auswählen.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category: category.trim(),
        companyId,
        departmentId,
        company: company.trim() || getCompanyName(companyId),
        department: department.trim() || (departmentId ? getDepartmentName(departmentId) : ""),
        assignedTo: assignedTo.trim(),
        tags: selectedTags,
      };

      if (editingTemplateId) {
        await ticketTemplateRepository.update(
          editingTemplateId,
          payload,
        );

        closeModal();
        await loadData();

        setMessage("Vorlage wurde gespeichert.");
        return;
      }

      await ticketTemplateRepository.create(payload);

      closeModal();
      await loadData();

      setMessage("Vorlage wurde erstellt.");
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Vorlage konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(template: TicketTemplate) {
    if (!canDelete()) {
      alert("Du hast keine Berechtigung, Vorlagen zu löschen.");
      return;
    }

    const confirmed = confirm(
      `Ticket-Vorlage "${template.title}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await ticketTemplateRepository.delete(template.id);
      await loadData();

      setMessage("Vorlage wurde gelöscht.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Vorlage konnte nicht gelöscht werden.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setTagFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function renderActions(template: TicketTemplate) {
    return (
      <div className="flex flex-wrap gap-2">
        {canEdit() && (
          <button
            type="button"
            onClick={() => startEditTemplate(template)}
            className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
          >
            Bearbeiten
          </button>
        )}

        {canDelete() && (
          <button
            type="button"
            onClick={() => void handleDeleteTemplate(template)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition font-bold"
          >
            Löschen
          </button>
        )}
      </div>
    );
  }

  if (!ticketTemplatesEnabled) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon="🧾"
          title="Ticket-Vorlagen deaktiviert"
          description="Dieses Modul ist aktuell in den Einstellungen deaktiviert."
          action={
            <Link
              href="/tickets"
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Zurück zu Tickets
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AppModal
        open={modalOpen}
        onClose={closeModal}
        title={editingTemplateId ? "Vorlage bearbeiten" : "Vorlage erstellen"}
        description="Ticket-Vorlagen speichern Standardwerte für neue Supportfälle."
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="bg-zinc-100 text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50 font-bold"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              form="ticket-template-form"
              disabled={saving}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {saving
                ? "Speichert..."
                : editingTemplateId
                  ? "Vorlage speichern"
                  : "Vorlage erstellen"}
            </button>
          </>
        }
      >
        <form
          id="ticket-template-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-bold">
              Titel
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="z. B. Neuer Arbeitsplatz"
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">
              Beschreibung
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus resize-none"
              placeholder="Standardbeschreibung für das Ticket..."
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-bold">
                Kategorie
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Kategorie auswählen
                </option>

                {categoryOptions.map((option) => (
                  <option
                    key={option.id}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}

                {categoryOptions.length === 0 && (
                  <option value="" disabled>
                    Bitte zuerst eine aktive Ticket-Kategorie im Admin Backend anlegen.
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TicketTemplateStatus)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Priorität
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TicketTemplatePriority)
                }
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                {priorityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Zugewiesen an
              </label>

              <select
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">Nicht zugewiesen</option>
                  {users.map((nextUser) => (
                    <option key={nextUser.id} value={nextUser.name}>
                      {nextUser.name} · {nextUser.email}
                    </option>
                  ))}
                </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Firma
              </label>

              <select
                value={companyId}
                onChange={(event) => handleCompanyChange(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Intern
                </option>

                {companies.map((nextCompany) => (
                  <option
                    key={nextCompany.id}
                    value={nextCompany.id}
                  >
                    {nextCompany.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-bold">
                Abteilung
              </label>

              <select
                value={departmentId}
                onChange={(event) => handleDepartmentChange(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
              >
                <option value="">
                  Keine Abteilung
                </option>

                {departmentOptions.map((nextDepartment) => (
                  <option
                    key={nextDepartment.id}
                    value={nextDepartment.id}
                  >
                    {nextDepartment.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-3 font-bold">
              Tags
            </label>

            {tagOptions.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-500">
                Noch keine globalen oder Ticket-Tags im Admin Backend vorhanden.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((option) => {
                  const active = selectedTags.includes(option.value);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleTag(option.value)}
                      className={`px-4 py-2 rounded-xl border transition font-bold ${
                        active
                          ? "app-accent-bg text-white app-brand-shadow"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      #{option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </AppModal>

      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
        >
          ← Zurück zu Tickets
        </Link>
      </div>

      <PageHero
        eyebrow="Tickets"
        title="Ticket-Vorlagen"
        description="Wiederverwendbare Vorlagen für Supportfälle aus PostgreSQL verwalten."
        badges={[
          {
            label: `${templates.length} Vorlagen`,
          },
          {
            label: `${openTemplates.length} offen`,
          },
          {
            label: `${closedTemplates.length} geschlossen`,
          },
          {
            label: `${filteredTemplates.length} sichtbar`,
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadData()}
              className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
            >
              Aktualisieren
            </button>

            {canCreate() && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
              >
                Vorlage erstellen
              </button>
            )}
          </>
        }
      />

      {loading && (
        <LoadingState
          title="Ticket-Vorlagen werden geladen..."
          description="Vorlagen, Kategorien, Tags und Organisation werden vorbereitet."
        />
      )}

      {message && (
        <section className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-bold">
            {message}
          </p>
        </section>
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Ticket-Vorlagen konnten nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadData()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Vorlagen gesamt"
              value={templates.length}
              description="Alle Ticket-Vorlagen"
              icon="🧾"
              active={
                !statusFilter &&
                !priorityFilter &&
                !categoryFilter &&
                !tagFilter &&
                !search
              }
              onClick={resetFilters}
            />

            <StatCard
              label="Offen"
              value={openTemplates.length}
              description="Standardstatus offen"
              icon="📬"
              tone="blue"
              active={statusFilter === "open"}
              onClick={() => setStatusFilter("open")}
            />

            <StatCard
              label="In Bearbeitung"
              value={inProgressTemplates.length}
              description="Startet in Bearbeitung"
              icon="⏳"
              tone="orange"
              active={statusFilter === "in_progress"}
              onClick={() => setStatusFilter("in_progress")}
            />

            <StatCard
              label="Hoch/Dringend"
              value={urgentTemplates.length}
              description={`${closedTemplates.length} geschlossen`}
              icon="⚡"
              tone="red"
              active={priorityFilter === "urgent"}
              onClick={() => setPriorityFilter("urgent")}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Suche & Filter
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Suche nach Titel, Beschreibung, Kategorie, Tags, Firma oder Zuweisung.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-2 rounded-xl transition font-medium ${
                      viewMode === "cards"
                        ? "app-accent-bg text-white app-brand-shadow"
                        : "bg-zinc-100 hover:bg-zinc-200"
                    }`}
                  >
                    Karten
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2 rounded-xl transition font-medium ${
                      viewMode === "table"
                        ? "app-accent-bg text-white app-brand-shadow"
                        : "bg-zinc-100 hover:bg-zinc-200"
                    }`}
                  >
                    Tabelle
                  </button>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 mt-6">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Vorlagen suchen..."
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Status
                  </option>

                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Prioritäten
                  </option>

                  {priorityOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Kategorien
                  </option>

                  {categoryOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Tags
                  </option>

                  {tagOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.value}
                    >
                      #{option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={companyFilter}
                  onChange={(event) => {
                    setCompanyFilter(event.target.value);
                    setDepartmentFilter("");
                  }}
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Firmen
                  </option>

                  {companies.map((nextCompany) => (
                    <option
                      key={nextCompany.id}
                      value={nextCompany.id}
                    >
                      {nextCompany.name}
                    </option>
                  ))}
                </select>

                <select
                  value={departmentFilter}
                  onChange={(event) =>
                    setDepartmentFilter(event.target.value)
                  }
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Abteilungen
                  </option>

                  {filteredDepartments.map((nextDepartment) => (
                    <option
                      key={nextDepartment.id}
                      value={nextDepartment.id}
                    >
                      {nextDepartment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="text-sm text-zinc-500">
                  {filteredTemplates.length} von {templates.length} Vorlagen gefunden.
                </span>

                {search && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Suche: {search}
                  </span>
                )}

                {statusFilter && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                    Status: {getTemplateStatusLabel(statusFilter)}
                  </span>
                )}

                {priorityFilter && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Priorität: {getTemplatePriorityLabel(priorityFilter)}
                  </span>
                )}

                {categoryFilter && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Kategorie: {categoryFilter}
                  </span>
                )}

                {tagFilter && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                    Tag: #{tagFilter}
                  </span>
                )}
              </div>
            </div>
          </section>

          {filteredTemplates.length === 0 && (
            <EmptyState
              icon="🧾"
              title="Keine Vorlagen gefunden"
              description="Erstelle eine neue Vorlage oder passe die Filter an."
              action={
                canCreate() ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
                  >
                    Vorlage erstellen
                  </button>
                ) : undefined
              }
            />
          )}

          {filteredTemplates.length > 0 && viewMode === "cards" && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const templateTags = getSafeTags(template.tags);
                const companyName =
                  template.company || getCompanyName(template.companyId);
                const departmentName =
                  template.department || getDepartmentName(template.departmentId);

                return (
                  <article
                    key={template.id}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold ${getTemplateStatusClass(
                                template.status,
                              )}`}
                            >
                              {getTemplateStatusLabel(template.status)}
                            </span>

                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold ${getTemplatePriorityClass(
                                template.priority,
                              )}`}
                            >
                              {getTemplatePriorityLabel(template.priority)}
                            </span>

                            {template.category && (
                              <button
                                type="button"
                                onClick={() => setCategoryFilter(template.category)}
                                className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold"
                              >
                                {template.category}
                              </button>
                            )}
                          </div>

                          <h2 className="text-2xl font-black tracking-[-0.03em] mt-5">
                            {template.title}
                          </h2>

                          <p className="text-zinc-500 mt-3 line-clamp-3 leading-7 whitespace-pre-wrap">
                            {template.description || "Keine Beschreibung vorhanden."}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-5">
                            {templateTags.length === 0 && (
                              <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                                Keine Tags
                              </span>
                            )}

                            {templateTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setTagFilter(tag)}
                                className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {renderActions(template)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100 text-sm">
                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Firma
                          </p>
                          <p className="font-black text-zinc-950 mt-1">
                            {companyName}
                          </p>
                        </div>

                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Abteilung
                          </p>
                          <p className="font-black text-zinc-950 mt-1">
                            {departmentName}
                          </p>
                        </div>

                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Zugewiesen
                          </p>
                          <p className="font-black text-zinc-950 mt-1">
                            {template.assignedTo || "-"}
                          </p>
                        </div>

                        <div className="bg-zinc-50 rounded-2xl p-4">
                          <p className="text-xs text-zinc-500">
                            Aktualisiert
                          </p>
                          <p className="font-black text-zinc-950 mt-1">
                            {formatDate(template.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {filteredTemplates.length > 0 && viewMode === "table" && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Vorlage
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Status
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Priorität
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Kategorie
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Organisation
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Tags
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Zugewiesen
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Aktionen
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {filteredTemplates.map((template) => {
                      const templateTags = getSafeTags(template.tags);
                      const companyName =
                        template.company || getCompanyName(template.companyId);
                      const departmentName =
                        template.department ||
                        getDepartmentName(template.departmentId);

                      return (
                        <tr
                          key={template.id}
                          className="hover:bg-zinc-50 transition"
                        >
                          <td className="px-5 py-4 align-top min-w-[300px]">
                            <p className="font-black text-zinc-950">
                              {template.title}
                            </p>

                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                              {template.description || "Keine Beschreibung vorhanden."}
                            </p>

                            <p className="text-xs text-zinc-400 mt-2">
                              ID: {template.id}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold ${getTemplateStatusClass(
                                template.status,
                              )}`}
                            >
                              {getTemplateStatusLabel(template.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold ${getTemplatePriorityClass(
                                template.priority,
                              )}`}
                            >
                              {getTemplatePriorityLabel(template.priority)}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top">
                            {template.category ? (
                              <button
                                type="button"
                                onClick={() => setCategoryFilter(template.category)}
                                className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold"
                              >
                                {template.category}
                              </button>
                            ) : (
                              <span className="text-sm text-zinc-400">
                                Nicht gesetzt
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="font-medium">
                              {companyName}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {departmentName}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              {templateTags.length === 0 && (
                                <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                                  Keine Tags
                                </span>
                              )}

                              {templateTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setTagFilter(tag)}
                                  className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full hover:bg-zinc-200 transition"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-zinc-500">
                            {template.assignedTo || "-"}
                          </td>

                          <td className="px-5 py-4 align-top">
                            {renderActions(template)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
