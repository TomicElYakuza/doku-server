import {
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplatePriorityClass,
  getTicketTemplatePriorityLabel,
  getTicketTemplates,
  getTicketTemplateStatusClass,
  getTicketTemplateStatusLabel,
  updateTicketTemplate,
} from "./ticketTemplateStorage";

import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "./ticketTemplateStorage";

export type TicketTemplateCreateInput = Omit<
  TicketTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketTemplateUpdateInput =
  Partial<
    Omit<
      TicketTemplate,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type TicketTemplateRepository = {
  list: () => TicketTemplate[];
  search: (query: string) => TicketTemplate[];
  findById: (id: string) => TicketTemplate | null;
  create: (template: TicketTemplateCreateInput) => TicketTemplate;
  update: (
    id: string,
    updates: TicketTemplateUpdateInput
  ) => TicketTemplate | null;
  delete: (id: string) => void;

  listByStatus: (status: TicketTemplateStatus) => TicketTemplate[];
  listByPriority: (priority: TicketTemplatePriority) => TicketTemplate[];
  listHighOrUrgent: () => TicketTemplate[];

  countAll: () => number;
  countByStatus: (status: TicketTemplateStatus) => number;
  countHighOrUrgent: () => number;

  getStatusLabel: (status: TicketTemplateStatus | string) => string;
  getStatusClass: (status: TicketTemplateStatus | string) => string;
  getPriorityLabel: (priority: TicketTemplatePriority | string) => string;
  getPriorityClass: (priority: TicketTemplatePriority | string) => string;
};

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

export const localTicketTemplateRepository: TicketTemplateRepository = {
  list() {
    return getTicketTemplates();
  },

  search(
    query: string
  ) {
    return getTicketTemplates().filter(
      (template) =>
        templateMatchesQuery(
          template,
          query
        )
    );
  },

  findById(
    id: string
  ) {
    return (
      getTicketTemplates().find(
        (template) =>
          template.id === id
      ) || null
    );
  },

  create(
    template: TicketTemplateCreateInput
  ) {
    return createTicketTemplate(
      template
    );
  },

  update(
    id: string,
    updates: TicketTemplateUpdateInput
  ) {
    return updateTicketTemplate(
      id,
      updates
    );
  },

  delete(
    id: string
  ) {
    deleteTicketTemplate(
      id
    );
  },

  listByStatus(
    status: TicketTemplateStatus
  ) {
    return getTicketTemplates().filter(
      (template) =>
        template.status === status
    );
  },

  listByPriority(
    priority: TicketTemplatePriority
  ) {
    return getTicketTemplates().filter(
      (template) =>
        template.priority === priority
    );
  },

  listHighOrUrgent() {
    return getTicketTemplates().filter(
      (template) =>
        template.priority === "high" ||
        template.priority === "urgent"
    );
  },

  countAll() {
    return getTicketTemplates().length;
  },

  countByStatus(
    status: TicketTemplateStatus
  ) {
    return localTicketTemplateRepository.listByStatus(
      status
    ).length;
  },

  countHighOrUrgent() {
    return localTicketTemplateRepository.listHighOrUrgent().length;
  },

  getStatusLabel(
    status: TicketTemplateStatus | string
  ) {
    return getTicketTemplateStatusLabel(
      status
    );
  },

  getStatusClass(
    status: TicketTemplateStatus | string
  ) {
    return getTicketTemplateStatusClass(
      status
    );
  },

  getPriorityLabel(
    priority: TicketTemplatePriority | string
  ) {
    return getTicketTemplatePriorityLabel(
      priority
    );
  },

  getPriorityClass(
    priority: TicketTemplatePriority | string
  ) {
    return getTicketTemplatePriorityClass(
      priority
    );
  },
};

export const ticketTemplateRepository =
  localTicketTemplateRepository;