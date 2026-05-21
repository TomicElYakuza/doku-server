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

export type TicketTemplateRepository = {
  list: () => Promise<TicketTemplate[]>;
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
    new Event(
      "ticketTemplatesUpdated"
    )
  );
}

function templateMatchesQuery(
  template: TicketTemplate,
  query: string
) {
  const normalizedQuery =
    query
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

  return haystack.includes(
    normalizedQuery
  );
}

export const postgresTicketTemplateRepository: TicketTemplateRepository = {
  async list() {
    return requestJson<TicketTemplate[]>(
      "/api/ticket-templates"
    );
  },

  async search(
    query: string
  ) {
    const templates =
      await postgresTicketTemplateRepository.list();

    return templates.filter(
      (template) =>
        templateMatchesQuery(
          template,
          query
        )
    );
  },

  async findById(
    id: string
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<TicketTemplate>(
        `/api/ticket-templates/${encodeURIComponent(
          id
        )}`
      );
    } catch {
      return null;
    }
  },

  async create(
    template: TicketTemplateCreateInput
  ) {
    const createdTemplate =
      await requestJson<TicketTemplate>(
        "/api/ticket-templates",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              template
            ),
        }
      );

    dispatchTicketTemplatesUpdated();

    return createdTemplate;
  },

  async update(
    id: string,
    updates: TicketTemplateUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedTemplate =
      await requestJson<TicketTemplate>(
        `/api/ticket-templates/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    dispatchTicketTemplatesUpdated();

    return updatedTemplate;
  },

  async delete(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/ticket-templates/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchTicketTemplatesUpdated();
  },

  async listByStatus(
    status: TicketTemplateStatus
  ) {
    return requestJson<TicketTemplate[]>(
      `/api/ticket-templates?status=${encodeURIComponent(
        status
      )}`
    );
  },

  async listByPriority(
    priority: TicketTemplatePriority
  ) {
    return requestJson<TicketTemplate[]>(
      `/api/ticket-templates?priority=${encodeURIComponent(
        priority
      )}`
    );
  },

  async listHighOrUrgent() {
    const templates =
      await postgresTicketTemplateRepository.list();

    return templates.filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent"
    );
  },

  async countAll() {
    const templates =
      await postgresTicketTemplateRepository.list();

    return templates.length;
  },

  async countByStatus(
    status: TicketTemplateStatus
  ) {
    const templates =
      await postgresTicketTemplateRepository.listByStatus(
        status
      );

    return templates.length;
  },

  async countHighOrUrgent() {
    const templates =
      await postgresTicketTemplateRepository.listHighOrUrgent();

    return templates.length;
  },

  getStatusLabel(
    status: TicketTemplateStatus | string
  ) {
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

    return String(
      status ||
        "Unbekannt"
    );
  },

  getStatusClass(
    status: TicketTemplateStatus | string
  ) {
    if (status === "open") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "in_progress") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "waiting") {
      return "bg-orange-100 text-orange-700";
    }

    if (status === "done") {
      return "bg-green-50 text-green-700";
    }

    if (status === "closed") {
      return "bg-zinc-100 text-zinc-700";
    }

    return "bg-zinc-100 text-zinc-700";
  },

  getPriorityLabel(
    priority: TicketTemplatePriority | string
  ) {
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

    return String(
      priority ||
        "Unbekannt"
    );
  },

  getPriorityClass(
    priority: TicketTemplatePriority | string
  ) {
    if (priority === "low") {
      return "bg-zinc-100 text-zinc-700";
    }

    if (priority === "medium") {
      return "bg-blue-50 text-blue-700";
    }

    if (priority === "high") {
      return "bg-orange-100 text-orange-700";
    }

    if (priority === "urgent") {
      return "bg-red-50 text-red-700";
    }

    return "bg-zinc-100 text-zinc-700";
  },
};

export const ticketTemplateRepository =
  postgresTicketTemplateRepository;