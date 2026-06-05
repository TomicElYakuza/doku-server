"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import AppModal from "../../../components/AppModal";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  companyRepository,
} from "../../../lib/companyRepository";
import {
  ticketRepository,
} from "../../../lib/ticketRepository";
import {
  ticketTemplateRepository,
} from "../../../lib/ticketTemplateRepository";
import {
  saveTicketCreatedFromTemplateActivity,
  saveTicketTemplateCreatedActivity,
  saveTicketTemplateDeletedActivity,
  saveTicketTemplateUpdatedActivity,
} from "../../../lib/ticketTemplateActivityHelpers";
import {
  useFeatureFlags,
} from "../../../hooks/useFeatureFlags";
import {
  usePermissions,
} from "../../../hooks/usePermissions";
import type {
  Company,
  Department,
} from "../../../types/company";
import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../types/ticketTemplate";

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

function getStatusLabel(status: TicketTemplateStatus | string) {
  return ticketTemplateRepository.getStatusLabel(status);
}

function getStatusClass(status: TicketTemplateStatus | string) {
  return ticketTemplateRepository.getStatusClass(status);
}

function getPriorityLabel(priority: TicketTemplatePriority | string) {
  return ticketTemplateRepository.getPriorityLabel(priority);
}

function getPriorityClass(priority: TicketTemplatePriority | string) {
  return ticketTemplateRepository.getPriorityClass(priority);
}

function formatTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter(Boolean);
}

function getTaxonomyLabel(item: TaxonomyItem, allItems: TaxonomyItem[]) {
  if (item.path) {
    return item.path;
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

    current = allItems.find((candidate) => candidate.id === current?.parentId);
  }

  return names.join(" > ") || item.name;
}

function sortByLabel(
  first: {
    label: string;
  },
  second: {
    label: string;
  },
) {
  return first.label.localeCompare(second.label);
}

export default function TicketTemplatesPage() {
  const {
    ticketTemplatesEnabled,
  } = useFeatureFlags();

  const {
    user,
    isAdmin,
    hasAnyPermission,
  } = usePermissions();

  const canManageTemplates = isAdmin || hasAnyPermission([
    "tickets.templates.manage",
    "tickets.manage",
  ]);
  const canViewTemplates = canManageTemplates || hasAnyPermission([
    "tickets.templates.view",
  ]);
  const canCreateTemplate = canManageTemplates || hasAnyPermission([
    "tickets.templates.create",
  ]);
  const canEditTemplate = canManageTemplates || hasAnyPermission([
    "tickets.templates.edit",
  ]);
  const canDeleteTemplate = canManageTemplates || hasAnyPermission([
    "tickets.templates.delete",
  ]);
  const canCreateTicket = isAdmin || hasAnyPermission([
    "tickets.create",
    "tickets.manage",
  ]);

  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TaxonomyItem[]>([]);
  const [ticketTags, setTicketTags] = useState<TaxonomyItem[]>([]);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TicketTemplatePriority>("medium");
  const [status, setStatus] = useState<TicketTemplateStatus>("open");
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
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

    window.addEventListener("ticketTemplatesUpdated", handleTemplatesUpdated);
    window.addEventListener("companiesUpdated", handleCompaniesUpdated);
    window.addEventListener("departmentsUpdated", handleDepartmentsUpdated);

    return () => {
      window.removeEventListener("ticketTemplatesUpdated", handleTemplatesUpdated);
      window.removeEventListener("companiesUpdated", handleCompaniesUpdated);
      window.removeEventListener("departmentsUpdated", handleDepartmentsUpdated);
    };
  }, []);

  async function loadTaxonomyItems() {
    const requests = await Promise.allSettled([
      fetch("/api/taxonomy?target=ticket&type=category"),
      fetch("/api/taxonomy?target=global&type=tag"),
      fetch("/api/taxonomy?target=ticket&type=tag"),
    ]);

    const nextTicketCategories: TaxonomyItem[] = [];
    const nextTags: TaxonomyItem[] = [];

    for (const [index, result] of requests.entries()) {
      if (result.status !== "fulfilled" || !result.value.ok) {
        continue;
      }

      const data = await result.value.json();
      const items = Array.isArray(data) ? data : [];

      if (index === 0) {
        nextTicketCategories.push(...items);
      } else {
        nextTags.push(...items);
      }
    }

    setTicketCategories(
      nextTicketCategories.filter((item) => item.isActive !== false),
    );

    const uniqueTags = Array.from(
      new Map(
        nextTags
          .filter((item) => item.isActive !== false)
          .map((item) => [
            item.name,
            item,
          ]),
      ).values(),
    );

    setTicketTags(uniqueTags);
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
    } catch (loadError) {
      console.error("Organisation konnte nicht geladen werden:", loadError);
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
      companies.find((item) => item.id === nextCompanyId)?.name ||
      "Intern"
    );
  }

  function getDepartmentName(nextDepartmentId?: string) {
    if (!nextDepartmentId) {
      return "Allgemein";
    }

    return (
      departments.find((item) => item.id === nextDepartmentId)?.name ||
      "Allgemein"
    );
  }

  const categoryOptions = useMemo(
    () =>
      ticketCategories
        .map((item) => ({
          id: item.id,
          value: getTaxonomyLabel(item, ticketCategories),
          label: getTaxonomyLabel(item, ticketCategories),
        }))
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
        .sort(sortByLabel),
    [
      ticketTags,
    ],
  );

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.status === "active"),
    [
      companies,
    ],
  );

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.status === "active"),
    [
      departments,
    ],
  );

  const selectableDepartments = useMemo(() => {
    const source = activeDepartments.length > 0
      ? activeDepartments
      : departments;

    if (!companyId) {
      return source;
    }

    return source.filter((department) => department.companyId === companyId);
  }, [
    activeDepartments,
    departments,
    companyId,
  ]);

  const filteredDepartmentOptions = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter((department) => department.companyId === companyFilter);
  }, [
    departments,
    companyFilter,
  ]);

  function handleCompanyChange(nextCompanyId: string) {
    setCompanyId(nextCompanyId);

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === nextCompanyId &&
          department.status === "active",
      ) ||
      departments.find((department) => department.companyId === nextCompanyId);

    setDepartmentId(firstDepartment?.id || "");
  }

  function resetForm() {
    const firstCompany = activeCompanies[0] || companies[0];

    const firstDepartment =
      departments.find(
        (department) =>
          department.companyId === firstCompany?.id &&
          department.status === "active",
      ) ||
      departments.find((department) => department.companyId === firstCompany?.id) ||
      departments[0];

    setEditingId("");
    setTitle("");
    setDescription("");
    setCategory(categoryOptions[0]?.value || "");
    setPriority("medium");
    setStatus("open");
    setCompanyId(
      isAdmin || canManageTemplates
        ? firstCompany?.id || ""
        : user?.companyId || "",
    );
    setDepartmentId(
      isAdmin || canManageTemplates
        ? firstDepartment?.id || ""
        : user?.departmentId || "",
    );
    setAssignedTo("");
    setSelectedTags([]);
  }

  function openCreateForm() {
    if (!ticketTemplatesEnabled) {
      alert("Ticket-Vorlagen sind in den Einstellungen deaktiviert.");
      return;
    }

    if (!canCreateTemplate) {
      alert("Du hast keine Berechtigung, Vorlagen zu erstellen.");
      return;
    }

    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetForm();
  }

  function startEditTemplate(template: TicketTemplate) {
    if (!ticketTemplatesEnabled) {
      alert("Ticket-Vorlagen sind in den Einstellungen deaktiviert.");
      return;
    }

    if (!canEditTemplate) {
      alert("Du hast keine Berechtigung, Vorlagen zu bearbeiten.");
      return;
    }

    setEditingId(template.id);
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category || categoryOptions[0]?.value || "");
    setPriority(template.priority);
    setStatus(template.status);
    setCompanyId(template.companyId || "");
    setDepartmentId(template.departmentId || "");
    setAssignedTo(template.assignedTo || "");
    setSelectedTags(formatTags(template.tags));
    setModalOpen(true);
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

  function userCanSeeTemplate(template: TicketTemplate) {
    if (isAdmin || canManageTemplates) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.departmentId) {
      return template.departmentId === user.departmentId;
    }

    if (user.companyId) {
      return template.companyId === user.companyId;
    }

    return false;
  }

  const visibleTemplates = useMemo(
    () => templates.filter(userCanSeeTemplate),
    [
      templates,
      user,
      isAdmin,
      canManageTemplates,
    ],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleTemplates.filter((template) => {
      const templateCompany = template.company || getCompanyName(template.companyId);
      const templateDepartment = template.department || getDepartmentName(template.departmentId);
      const templateTags = formatTags(template.tags);

      const matchesSearch =
        !query ||
        [
          template.id,
          template.title,
          template.description,
          template.category,
          template.status,
          template.priority,
          templateCompany,
          templateDepartment,
          template.assignedTo,
          templateTags.join(" "),
          template.createdAt,
          template.updatedAt,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesPriority = !priorityFilter || template.priority === priorityFilter;
      const matchesStatus = !statusFilter || template.status === statusFilter;
      const matchesCategory = !categoryFilter || template.category === categoryFilter;
      const matchesTag = !tagFilter || templateTags.includes(tagFilter);
      const matchesCompany = !companyFilter || template.companyId === companyFilter;
      const matchesDepartment = !departmentFilter || template.departmentId === departmentFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesCategory &&
        matchesTag &&
        matchesCompany &&
        matchesDepartment
      );
    });
  }, [
    visibleTemplates,
    search,
    priorityFilter,
    statusFilter,
    categoryFilter,
    tagFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const highPriorityCount = visibleTemplates.filter(
    (template) =>
      template.priority === "high" ||
      template.priority === "urgent",
  ).length;

  const openCount = visibleTemplates.filter(
    (template) => template.status === "open",
  ).length;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!ticketTemplatesEnabled) {
      alert("Ticket-Vorlagen sind in den Einstellungen deaktiviert.");
      return;
    }

    if (!canCreateTemplate && !editingId) {
      alert("Du hast keine Berechtigung, Vorlagen zu erstellen.");
      return;
    }

    if (!canEditTemplate && editingId) {
      alert("Du hast keine Berechtigung, Vorlagen zu bearbeiten.");
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

    const selectedCompanyName = getCompanyName(companyId);
    const selectedDepartmentName = getDepartmentName(departmentId);

    const templateData = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      priority,
      status,
      companyId,
      departmentId,
      company: selectedCompanyName,
      department: selectedDepartmentName,
      assignedTo: assignedTo.trim(),
      tags: selectedTags,
    };

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (editingId) {
        const updatedTemplate = await ticketTemplateRepository.update(
          editingId,
          templateData,
        );

        if (updatedTemplate) {
          saveTicketTemplateUpdatedActivity(updatedTemplate);
        }

        closeModal();
        await loadData();
        setMessage("Vorlage wurde gespeichert.");
        return;
      }

      const createdTemplate = await ticketTemplateRepository.create(templateData);

      saveTicketTemplateCreatedActivity(createdTemplate);

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
    if (!ticketTemplatesEnabled) {
      alert("Ticket-Vorlagen sind in den Einstellungen deaktiviert.");
      return;
    }

    if (!canDeleteTemplate) {
      alert("Du hast keine Berechtigung, Vorlagen zu löschen.");
      return;
    }

    const confirmed = confirm(`Vorlage "${template.title}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      saveTicketTemplateDeletedActivity(template);
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

  async function createTicketFromTemplate(template: TicketTemplate) {
    if (!ticketTemplatesEnabled) {
      alert("Ticket-Vorlagen sind in den Einstellungen deaktiviert.");
      return;
    }

    if (!canCreateTicket) {
      alert("Du hast keine Berechtigung, Tickets zu erstellen.");
      return;
    }

    if (!template.category) {
      alert("Die Vorlage hat keine gültige Kategorie.");
      return;
    }

    try {
      setMessage("");
      setError("");

      const createdTicket = await ticketRepository.create({
        title: template.title,
        description: template.description,
        status: template.status,
        priority: template.priority,
        category: template.category,
        companyId: template.companyId || "",
        departmentId: template.departmentId || "",
        company: template.company || "Intern",
        department: template.department || "Allgemein",
        assignedTo: template.assignedTo || "",
        createdBy: user?.name || "System",
        tags: formatTags(template.tags),
      });

      saveTicketCreatedFromTemplateActivity(template, createdTicket);
      setMessage(`Ticket #${createdTicket.id} wurde aus Vorlage erstellt.`);
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Ticket konnte nicht erstellt werden.",
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setPriorityFilter("");
    setStatusFilter("");
    setCategoryFilter("");
    setTagFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  if (!ticketTemplatesEnabled) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Tickets"
          title="Ticket-Vorlagen deaktiviert"
          description="Ticket-Vorlagen sind aktuell in den Einstellungen deaktiviert."
          actions={
            <Link
              href="/admin/settings"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zu den Einstellungen
            </Link>
          }
        />
      </div>
    );
  }

  if (!canViewTemplates) {
    return (
      <div className="space-y-8">
        <PageHero
          eyebrow="Tickets"
          title="Keine Berechtigung"
          description="Du hast keine Berechtigung, Ticket-Vorlagen zu sehen."
          actions={
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
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
        title={editingId ? "Vorlage bearbeiten" : "Vorlage erstellen"}
        description="Kategorien und Tags kommen aus dem Admin Backend."
        maxWidth="5xl"
        onClose={closeModal}
        footer={
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="bg-zinc-100 hover:bg-zinc-200 px-5 py-3 rounded-2xl transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="ticket-template-form"
              disabled={saving}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 disabled:bg-zinc-400 transition"
            >
              {saving
                ? "Speichert..."
                : editingId
                  ? "Änderungen speichern"
                  : "Vorlage erstellen"}
            </button>
          </div>
        }
      >
        <form
          id="ticket-template-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-medium">
              Titel
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Kurzer Titel"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-medium">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Zugewiesen an
              </label>
              <input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Name oder Team"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TicketTemplateStatus)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
              <label className="block mb-2 font-medium">
                Priorität
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketTemplatePriority)}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
              <label className="block mb-2 font-medium">
                Firma
              </label>
              <select
                value={companyId}
                onChange={(event) => handleCompanyChange(event.target.value)}
                disabled={!isAdmin && !canManageTemplates}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Intern
                </option>
                {(activeCompanies.length > 0 ? activeCompanies : companies).map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Abteilung
              </label>
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                disabled={!isAdmin && !canManageTemplates}
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <option value="">
                  Allgemein
                </option>
                {selectableDepartments.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 resize-none"
              placeholder="Beschreibung der Vorlage..."
            />
          </div>

          <div>
            <label className="block mb-3 font-medium">
              Tags
            </label>

            {tagOptions.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-500">
                Noch keine Ticket-Tags im Admin Backend vorhanden.
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
                      className={`px-4 py-2 rounded-xl border transition ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900"
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

      <PageHero
        eyebrow="Tickets"
        title="Ticket-Vorlagen"
        description="Wiederkehrende Ticket-Typen als Vorlage speichern und daraus Tickets erstellen."
        badges={[
          {
            label: `${visibleTemplates.length} Vorlagen`,
          },
          {
            label: `${categoryOptions.length} Kategorien`,
          },
          {
            label: `${tagOptions.length} Tags`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tickets"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zu Tickets
            </Link>

            {canCreateTemplate && (
              <button
                type="button"
                onClick={openCreateForm}
                className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
              >
                Vorlage erstellen
              </button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Ticket-Vorlagen werden geladen...
          </p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm">
          <p className="text-green-700 font-medium">
            {message}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Vorlagen gesamt"
          value={visibleTemplates.length}
          description="Alle sichtbaren Vorlagen"
          icon="📋"
          active={!statusFilter && !priorityFilter && !categoryFilter && !tagFilter}
          onClick={resetFilters}
        />
        <StatCard
          label="Offen"
          value={openCount}
          description="Vorlagen mit Status offen"
          icon="📌"
          tone="blue"
          active={statusFilter === "open"}
          onClick={() => setStatusFilter("open")}
        />
        <StatCard
          label="Hoch/Dringend"
          value={highPriorityCount}
          description="Priorität hoch oder dringend"
          icon="⚡"
          tone="orange"
          active={priorityFilter === "high" || priorityFilter === "urgent"}
          onClick={() => setPriorityFilter("high")}
        />
        <StatCard
          label="Gefiltert"
          value={filteredTemplates.length}
          description="Nach Suche und Filtern"
          icon="🔎"
          tone="indigo"
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>
            <p className="text-zinc-500 mt-1">
              Suche nach Titel, Beschreibung, Kategorie, Firma, Abteilung oder Tag.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Vorlagen durchsuchen..."
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(event.target.value);
              setDepartmentFilter("");
            }}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>
            {companies.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white xl:col-span-2"
          >
            <option value="">
              Alle Abteilungen
            </option>
            {filteredDepartmentOptions.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          {filteredTemplates.length} von {visibleTemplates.length} Vorlagen gefunden.
        </p>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Keine Vorlagen gefunden.
          </p>
        </div>
      )}

      {viewMode === "cards" && filteredTemplates.length > 0 && (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => {
            const templateCompany = template.company || getCompanyName(template.companyId);
            const templateDepartment = template.department || getDepartmentName(template.departmentId);
            const templateTags = formatTags(template.tags);

            return (
              <div
                key={template.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(template.status)}`}>
                        {getStatusLabel(template.status)}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(template.priority)}`}>
                        {getPriorityLabel(template.priority)}
                      </span>
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {template.category}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                        {templateCompany}
                      </span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {templateDepartment}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {template.title}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {template.description || "Keine Beschreibung"}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {templateTags.length === 0 && (
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                          Keine Tags
                        </span>
                      )}

                      {templateTags.map((tag, index) => (
                        <span
                          key={`${template.id}-${tag}-${index}`}
                          className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                      <p>
                        Erstellt: {template.createdAt}
                      </p>
                      <p>
                        Aktualisiert: {template.updatedAt}
                      </p>
                      {template.assignedTo && (
                        <p>
                          Zuständig: {template.assignedTo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end shrink-0">
                    {canCreateTicket && (
                      <button
                        type="button"
                        onClick={() => void createTicketFromTemplate(template)}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                      >
                        Ticket erstellen
                      </button>
                    )}

                    {canEditTemplate && (
                      <button
                        type="button"
                        onClick={() => startEditTemplate(template)}
                        className="bg-white border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                      >
                        Bearbeiten
                      </button>
                    )}

                    {canDeleteTemplate && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteTemplate(template)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "table" && filteredTemplates.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Vorlage
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Kategorie
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Priorität
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Organisation
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Tags
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTemplates.map((template) => {
                  const templateCompany = template.company || getCompanyName(template.companyId);
                  const templateDepartment = template.department || getDepartmentName(template.departmentId);
                  const templateTags = formatTags(template.tags);

                  return (
                    <tr
                      key={template.id}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 align-top min-w-[280px]">
                        <p className="font-semibold">
                          {template.title}
                        </p>
                        <p className="text-zinc-500 mt-1 line-clamp-2">
                          {template.description || "Keine Beschreibung"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 min-w-[220px]">
                        {template.category}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusClass(template.status)}`}>
                          {getStatusLabel(template.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className={`text-xs px-3 py-1 rounded-full ${getPriorityClass(template.priority)}`}>
                          {getPriorityLabel(template.priority)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500">
                        {templateCompany}
                        <br />
                        {templateDepartment}
                      </td>

                      <td className="px-5 py-4 align-top min-w-[220px]">
                        <div className="flex flex-wrap gap-2">
                          {templateTags.length === 0 && (
                            <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full">
                              Keine Tags
                            </span>
                          )}

                          {templateTags.map((tag, index) => (
                            <span
                              key={`${template.id}-${tag}-${index}`}
                              className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canCreateTicket && (
                            <button
                              type="button"
                              onClick={() => void createTicketFromTemplate(template)}
                              className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
                            >
                              Ticket erstellen
                            </button>
                          )}

                          {canEditTemplate && (
                            <button
                              type="button"
                              onClick={() => startEditTemplate(template)}
                              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
                            >
                              Bearbeiten
                            </button>
                          )}

                          {canDeleteTemplate && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteTemplate(template)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}