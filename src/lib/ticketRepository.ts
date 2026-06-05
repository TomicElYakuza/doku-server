import {
  requestJson,
} from "./apiClient";
import type {
  Ticket,
  TicketCreateInput,
  TicketPriority,
  TicketStatus,
  TicketUpdateInput,
} from "../types/ticket";

type TicketFilters = {
  status?: TicketStatus | string;
  priority?: TicketPriority | string;
  companyId?: string;
  departmentId?: string;
  category?: string;
  tag?: string;
};

export type TicketRepository = {
  list: (filters?: TicketFilters) => Promise<Ticket[]>;
  search: (query: string) => Promise<Ticket[]>;
  findById: (id: string) => Promise<Ticket | null>;
  create: (ticket: TicketCreateInput) => Promise<Ticket>;
  update: (
    id: string,
    updates: TicketUpdateInput
  ) => Promise<Ticket | null>;
  delete: (id: string) => Promise<void>;
  saveAll: (tickets: Ticket[]) => Promise<void>;
  listVisible: (showClosed?: boolean) => Promise<Ticket[]>;
  listClosed: () => Promise<Ticket[]>;
  listHighOrUrgent: () => Promise<Ticket[]>;
  listByStatus: (status: TicketStatus) => Promise<Ticket[]>;
  listByPriority: (priority: TicketPriority) => Promise<Ticket[]>;
  listByCompanyId: (companyId: string) => Promise<Ticket[]>;
  listByDepartmentId: (departmentId: string) => Promise<Ticket[]>;
  listByCategory: (category: string) => Promise<Ticket[]>;
  listByTag: (tag: string) => Promise<Ticket[]>;
  countAll: () => Promise<number>;
  countVisible: (showClosed?: boolean) => Promise<number>;
  countClosed: () => Promise<number>;
  countByStatus: (status: TicketStatus) => Promise<number>;
  countByPriority: (priority: TicketPriority) => Promise<number>;
  countHighOrUrgent: () => Promise<number>;
  getStatusLabel: (status: TicketStatus | string) => string;
  getStatusClass: (status: TicketStatus | string) => string;
  getPriorityLabel: (priority: TicketPriority | string) => string;
  getPriorityClass: (priority: TicketPriority | string) => string;
};

function dispatchTicketsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("ticketsUpdated"),
  );
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
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

function normalizeCreatePayload(ticket: TicketCreateInput) {
  return {
    title: normalizeText(ticket.title),
    description: normalizeText(ticket.description),
    status: ticket.status || "open",
    priority: ticket.priority || "medium",
    category: normalizeText(ticket.category),
    companyId: normalizeText(ticket.companyId),
    departmentId: normalizeText(ticket.departmentId),
    company: normalizeText(ticket.company) || "Intern",
    department: normalizeText(ticket.department) || "Allgemein",
    assignedTo: normalizeText(ticket.assignedTo),
    createdBy: normalizeText(ticket.createdBy) || "System",
    tags: normalizeTags(ticket.tags),
  };
}

function normalizeUpdatePayload(updates: TicketUpdateInput) {
  return {
    title: updates.title !== undefined
      ? normalizeText(updates.title)
      : undefined,
    description: updates.description !== undefined
      ? normalizeText(updates.description)
      : undefined,
    status: updates.status,
    priority: updates.priority,
    category: updates.category !== undefined
      ? normalizeText(updates.category)
      : undefined,
    companyId: updates.companyId !== undefined
      ? normalizeText(updates.companyId)
      : undefined,
    departmentId: updates.departmentId !== undefined
      ? normalizeText(updates.departmentId)
      : undefined,
    company: updates.company !== undefined
      ? normalizeText(updates.company) || "Intern"
      : undefined,
    department: updates.department !== undefined
      ? normalizeText(updates.department) || "Allgemein"
      : undefined,
    assignedTo: updates.assignedTo !== undefined
      ? normalizeText(updates.assignedTo)
      : undefined,
    createdBy: updates.createdBy !== undefined
      ? normalizeText(updates.createdBy) || "System"
      : undefined,
    tags: updates.tags !== undefined
      ? normalizeTags(updates.tags)
      : undefined,
  };
}

function buildQuery(filters?: TicketFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.status) {
    searchParams.set("status", String(filters.status));
  }

  if (filters?.priority) {
    searchParams.set("priority", String(filters.priority));
  }

  if (filters?.companyId?.trim()) {
    searchParams.set("companyId", filters.companyId.trim());
  }

  if (filters?.departmentId?.trim()) {
    searchParams.set("departmentId", filters.departmentId.trim());
  }

  if (filters?.category?.trim()) {
    searchParams.set("category", filters.category.trim());
  }

  if (filters?.tag?.trim()) {
    searchParams.set("tag", filters.tag.trim());
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizeQuery(
  query: string,
) {
  return query
    .trim()
    .toLowerCase();
}

function ticketMatchesQuery(
  ticket: Ticket,
  query: string,
) {
  const normalizedQuery = normalizeQuery(
    query,
  );

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.status,
    ticket.priority,
    ticket.category,
    ticket.companyId,
    ticket.departmentId,
    ticket.company,
    ticket.department,
    ticket.assignedTo,
    ticket.createdBy,
    ticket.createdAt,
    ticket.updatedAt,
    ticket.tags?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedQuery,
  );
}

export const postgresTicketRepository: TicketRepository = {
  async list(filters?: TicketFilters) {
    return requestJson<Ticket[]>(
      `/api/tickets${buildQuery(filters)}`,
    );
  },

  async search(
    query: string,
  ) {
    const tickets = await postgresTicketRepository.list();

    return tickets.filter(
      (ticket) =>
        ticketMatchesQuery(
          ticket,
          query,
        ),
    );
  },

  async findById(
    id: string,
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<Ticket>(
        `/api/tickets/${encodeURIComponent(id)}`,
      );
    } catch {
      return null;
    }
  },

  async create(
    ticket: TicketCreateInput,
  ) {
    const payload = normalizeCreatePayload(ticket);

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.category) {
      throw new Error("Ticket-Kategorie ist erforderlich.");
    }

    const createdTicket = await requestJson<Ticket>(
      "/api/tickets",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchTicketsUpdated();

    return createdTicket;
  },

  async update(
    id: string,
    updates: TicketUpdateInput,
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
      throw new Error("Ticket-Kategorie ist erforderlich.");
    }

    const updatedTicket = await requestJson<Ticket>(
      `/api/tickets/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    dispatchTicketsUpdated();

    return updatedTicket;
  },

  async delete(
    id: string,
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/tickets/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    dispatchTicketsUpdated();
  },

  async saveAll(
    tickets: Ticket[],
  ) {
    await Promise.all(
      tickets.map(async (ticket) => {
        if (ticket.id) {
          await postgresTicketRepository.update(
            ticket.id,
            ticket,
          );

          return;
        }

        await postgresTicketRepository.create(
          ticket,
        );
      }),
    );

    dispatchTicketsUpdated();
  },

  async listVisible(
    showClosed = false,
  ) {
    const tickets = await postgresTicketRepository.list();

    if (showClosed) {
      return tickets;
    }

    return tickets.filter(
      (ticket) => ticket.status !== "closed",
    );
  },

  async listClosed() {
    const tickets = await postgresTicketRepository.list();

    return tickets.filter(
      (ticket) => ticket.status === "closed",
    );
  },

  async listHighOrUrgent() {
    const tickets = await postgresTicketRepository.list();

    return tickets.filter(
      (ticket) =>
        ticket.priority === "high" ||
        ticket.priority === "urgent",
    );
  },

  async listByStatus(
    status: TicketStatus,
  ) {
    return postgresTicketRepository.list({
      status,
    });
  },

  async listByPriority(
    priority: TicketPriority,
  ) {
    return postgresTicketRepository.list({
      priority,
    });
  },

  async listByCompanyId(
    companyId: string,
  ) {
    return postgresTicketRepository.list({
      companyId,
    });
  },

  async listByDepartmentId(
    departmentId: string,
  ) {
    return postgresTicketRepository.list({
      departmentId,
    });
  },

  async listByCategory(
    category: string,
  ) {
    return postgresTicketRepository.list({
      category,
    });
  },

  async listByTag(
    tag: string,
  ) {
    return postgresTicketRepository.list({
      tag,
    });
  },

  async countAll() {
    const tickets = await postgresTicketRepository.list();

    return tickets.length;
  },

  async countVisible(
    showClosed = false,
  ) {
    const tickets = await postgresTicketRepository.listVisible(
      showClosed,
    );

    return tickets.length;
  },

  async countClosed() {
    const tickets = await postgresTicketRepository.listClosed();

    return tickets.length;
  },

  async countByStatus(
    status: TicketStatus,
  ) {
    const tickets = await postgresTicketRepository.listByStatus(
      status,
    );

    return tickets.length;
  },

  async countByPriority(
    priority: TicketPriority,
  ) {
    const tickets = await postgresTicketRepository.listByPriority(
      priority,
    );

    return tickets.length;
  },

  async countHighOrUrgent() {
    const tickets = await postgresTicketRepository.listHighOrUrgent();

    return tickets.length;
  },

  getStatusLabel(
    status: TicketStatus | string,
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

    return String(status || "Unbekannt");
  },

  getStatusClass(
    status: TicketStatus | string,
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
    priority: TicketPriority | string,
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

    return String(priority || "Unbekannt");
  },

  getPriorityClass(
    priority: TicketPriority | string,
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

export const ticketRepository = postgresTicketRepository;