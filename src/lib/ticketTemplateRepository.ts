import {
  requestJson,
} from "./apiClient";
import type {
  TicketTemplate,
  TicketTemplateCreateInput,
  TicketTemplatePriority,
  TicketTemplateStatus,
  TicketTemplateUpdateInput,
} from "../types/ticketTemplate";

type TicketTemplateFilters = {
  status?: string;
  priority?: string;
  category?: string;
  tag?: string;
  companyId?: string;
  departmentId?: string;
};

export type TicketTemplateRepository = {
  list: (filters?: TicketTemplateFilters) => Promise<TicketTemplate[]>;
  search: (query: string) => Promise<TicketTemplate[]>;
  findById: (id: string) => Promise<TicketTemplate | null>;
  create: (template: TicketTemplateCreateInput) => Promise<TicketTemplate>;
  update: (
    id: string,
    updates: TicketTemplateUpdateInput
  ) => Promise<TicketTemplate | null>;
  delete: (id: string) => Promise<void>;
  listByStatus: (status: TicketTemplateStatus) => Promise<TicketTemplate[]>;
  listByPriority: (priority: TicketTemplatePriority) => Promise<TicketTemplate[]>;
  listHighOrUrgent: () => Promise<TicketTemplate[]>;
  countAll: () => Promise<number>;
  countByStatus: (status: TicketTemplateStatus) => Promise<number>;
  countHighOrUrgent: () => Promise<number>;
  getStatusLabel: (status: TicketTemplateStatus | string) => string;
  getStatusClass: (status: TicketTemplateStatus | string) => string;
  getPriorityLabel: (priority: TicketTemplatePriority | string) => string;
  getPriorityClass: (priority: TicketTemplatePriority | string) => string;
};

function dispatchTicketTemplatesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("ticketTemplatesUpdated"),
  );
}

function buildQuery(params: TicketTemplateFilters = {}) {
  const searchParams = new URLSearchParams();

  for (const [
    key,
    value,
  ] of Object.entries(params)) {
    if (value && String(value).trim()) {
      searchParams.set(key, String(value).trim());
    }
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

function normalizeCreatePayload(template: TicketTemplateCreateInput) {
  return {
    title: template.title?.trim(),
    description: template.description?.trim() || "",
    status: template.status || "open",
    priority: template.priority || "medium",
    category: template.category?.trim(),
    companyId: template.companyId?.trim() || "",
    departmentId: template.departmentId?.trim() || "",
    company: template.company?.trim() || "Intern",
    department: template.department?.trim() || "Allgemein",
    assignedTo: template.assignedTo?.trim() || "",
    tags: normalizeTags(template.tags),
  };
}

function normalizeUpdatePayload(updates: TicketTemplateUpdateInput) {
  return {
    title: updates.title?.trim(),
    description: updates.description?.trim() || "",
    status: updates.status,
    priority: updates.priority,
    category: updates.category?.trim(),
    companyId: updates.companyId?.trim() || "",
    departmentId: updates.departmentId?.trim() || "",
    company: updates.company?.trim() || "Intern",
    department: updates.department?.trim() || "Allgemein",
    assignedTo: updates.assignedTo?.trim() || "",
    tags: normalizeTags(updates.tags),
  };
}

function templateMatchesQuery(
  template: TicketTemplate,
  query: string,
) {
  const normalizedQuery = query
    .trim()
    .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    template.id,
    template.title,
    template.description,
    template.status,
    template.priority,
    template.category,
    template.companyId,
    template.departmentId,
    template.company,
    template.department,
    template.assignedTo,
    template.createdAt,
    template.updatedAt,
    template.tags?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export const postgresTicketTemplateRepository: TicketTemplateRepository = {
  async list(filters?: TicketTemplateFilters) {
    const query = buildQuery(filters);

    return requestJson<TicketTemplate[]>(
      `/api/ticket-templates${query}`,
    );
  },

  async search(query: string) {
    const templates = await postgresTicketTemplateRepository.list();

    return templates.filter(
      (template) => templateMatchesQuery(
        template,
        query,
      ),
    );
  },

  async findById(id: string) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<TicketTemplate>(
        `/api/ticket-templates/${encodeURIComponent(id)}`,
      );
    } catch {
      return null;
    }
  },

  async create(template: TicketTemplateCreateInput) {
    const payload = normalizeCreatePayload(template);

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const createdTemplate = await requestJson<TicketTemplate>(
      "/api/ticket-templates",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchTicketTemplatesUpdated();

    return createdTemplate;
  },

  async update(
    id: string,
    updates: TicketTemplateUpdateInput,
  ) {
    if (!id) {
      return null;
    }

    const payload = normalizeUpdatePayload(updates);

    if (
      updates.title !== undefined &&
      !payload.title
    ) {
      throw new Error("Titel ist erforderlich.");
    }

    if (
      updates.category !== undefined &&
      !payload.category
    ) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const updatedTemplate = await requestJson<TicketTemplate>(
      `/api/ticket-templates/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    dispatchTicketTemplatesUpdated();

    return updatedTemplate;
  },

  async delete(id: string) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/ticket-templates/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    dispatchTicketTemplatesUpdated();
  },

  async listByStatus(status: TicketTemplateStatus) {
    return postgresTicketTemplateRepository.list({
      status,
    });
  },

  async listByPriority(priority: TicketTemplatePriority) {
    return postgresTicketTemplateRepository.list({
      priority,
    });
  },

  async listHighOrUrgent() {
    const templates = await postgresTicketTemplateRepository.list();

    return templates.filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent",
    );
  },

  async countAll() {
    const templates = await postgresTicketTemplateRepository.list();

    return templates.length;
  },

  async countByStatus(status: TicketTemplateStatus) {
    const templates = await postgresTicketTemplateRepository.listByStatus(status);

    return templates.length;
  },

  async countHighOrUrgent() {
    const templates = await postgresTicketTemplateRepository.listHighOrUrgent();

    return templates.length;
  },

  getStatusLabel(status: TicketTemplateStatus | string) {
    if (status === "open") {
      return "Offen";
    }

    if (status === "in_progress") {
      return "In Bearbeitung";
    }

    if (status === "waiting") {
      return "Wartend";
    }

    if (status === "done") {
      return "Erledigt";
    }

    if (status === "closed") {
      return "Geschlossen";
    }

    return String(status || "Unbekannt");
  },

  getStatusClass(status: TicketTemplateStatus | string) {
    if (status === "open") {
      return "bg-blue-50 text-blue-700 border border-blue-100";
    }

    if (status === "in_progress") {
      return "bg-yellow-50 text-yellow-700 border border-yellow-100";
    }

    if (status === "waiting") {
      return "bg-orange-50 text-orange-700 border border-orange-100";
    }

    if (status === "done") {
      return "bg-green-50 text-green-700 border border-green-100";
    }

    if (status === "closed") {
      return "bg-zinc-100 text-zinc-700 border border-zinc-200";
    }

    return "bg-zinc-100 text-zinc-700 border border-zinc-200";
  },

  getPriorityLabel(priority: TicketTemplatePriority | string) {
    if (priority === "low") {
      return "Niedrig";
    }

    if (priority === "medium") {
      return "Mittel";
    }

    if (priority === "high") {
      return "Hoch";
    }

    if (priority === "urgent") {
      return "Dringend";
    }

    return String(priority || "Unbekannt");
  },

  getPriorityClass(priority: TicketTemplatePriority | string) {
    if (priority === "low") {
      return "bg-zinc-100 text-zinc-700 border border-zinc-200";
    }

    if (priority === "medium") {
      return "bg-blue-50 text-blue-700 border border-blue-100";
    }

    if (priority === "high") {
      return "bg-orange-50 text-orange-700 border border-orange-100";
    }

    if (priority === "urgent") {
      return "bg-red-50 text-red-700 border border-red-100";
    }

    return "bg-zinc-100 text-zinc-700 border border-zinc-200";
  },
};

export const ticketTemplateRepository = postgresTicketTemplateRepository;