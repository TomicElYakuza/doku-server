import {
  createTicket,
  deleteTicket,
  getPriorityClass,
  getPriorityLabel,
  getStatusClass,
  getStatusLabel,
  getTicketById,
  getTickets,
  getTicketsByCompanyId,
  getTicketsByDepartmentId,
  getTicketsByPriority,
  getTicketsByStatus,
  saveTickets,
  updateTicket,
} from "./ticketStorage";

import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "./ticketStorage";

export type TicketCreateInput = Omit<
  Ticket,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketUpdateInput =
  Partial<
    Omit<
      Ticket,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type TicketRepository = {
  list: () => Ticket[];
  search: (query: string) => Ticket[];
  findById: (id: string) => Ticket | null;
  create: (ticket: TicketCreateInput) => Ticket;
  update: (
    id: string,
    updates: TicketUpdateInput
  ) => Ticket | null;
  delete: (id: string) => void;
  saveAll: (tickets: Ticket[]) => void;

  listVisible: (showClosed?: boolean) => Ticket[];
  listClosed: () => Ticket[];
  listHighOrUrgent: () => Ticket[];
  listByStatus: (status: TicketStatus) => Ticket[];
  listByPriority: (priority: TicketPriority) => Ticket[];
  listByCompanyId: (companyId: string) => Ticket[];
  listByDepartmentId: (departmentId: string) => Ticket[];

  countAll: () => number;
  countVisible: (showClosed?: boolean) => number;
  countClosed: () => number;
  countByStatus: (status: TicketStatus) => number;
  countByPriority: (priority: TicketPriority) => number;
  countHighOrUrgent: () => number;

  getStatusLabel: (status: TicketStatus | string) => string;
  getStatusClass: (status: TicketStatus | string) => string;
  getPriorityLabel: (priority: TicketPriority | string) => string;
  getPriorityClass: (priority: TicketPriority | string) => string;
};

function normalizeQuery(
  query: string
) {
  return query
    .trim()
    .toLowerCase();
}

function ticketMatchesQuery(
  ticket: Ticket,
  query: string
) {
  const normalizedQuery =
    normalizeQuery(
      query
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
    normalizedQuery
  );
}

export const localTicketRepository: TicketRepository = {
  list() {
    return getTickets();
  },

  search(
    query: string
  ) {
    return getTickets().filter(
      (ticket) =>
        ticketMatchesQuery(
          ticket,
          query
        )
    );
  },

  findById(
    id: string
  ) {
    return getTicketById(
      id
    );
  },

  create(
    ticket: TicketCreateInput
  ) {
    return createTicket(
      ticket
    );
  },

  update(
    id: string,
    updates: TicketUpdateInput
  ) {
    return updateTicket(
      id,
      updates
    );
  },

  delete(
    id: string
  ) {
    deleteTicket(
      id
    );
  },

  saveAll(
    tickets: Ticket[]
  ) {
    saveTickets(
      tickets
    );
  },

  listVisible(
    showClosed = false
  ) {
    if (showClosed) {
      return getTickets();
    }

    return getTickets().filter(
      (ticket) =>
        ticket.status !== "closed"
    );
  },

  listClosed() {
    return getTickets().filter(
      (ticket) =>
        ticket.status === "closed"
    );
  },

  listHighOrUrgent() {
    return getTickets().filter(
      (ticket) =>
        ticket.priority === "high" ||
        ticket.priority === "urgent"
    );
  },

  listByStatus(
    status: TicketStatus
  ) {
    return getTicketsByStatus(
      status
    );
  },

  listByPriority(
    priority: TicketPriority
  ) {
    return getTicketsByPriority(
      priority
    );
  },

  listByCompanyId(
    companyId: string
  ) {
    return getTicketsByCompanyId(
      companyId
    );
  },

  listByDepartmentId(
    departmentId: string
  ) {
    return getTicketsByDepartmentId(
      departmentId
    );
  },

  countAll() {
    return getTickets().length;
  },

  countVisible(
    showClosed = false
  ) {
    return localTicketRepository.listVisible(
      showClosed
    ).length;
  },

  countClosed() {
    return localTicketRepository.listClosed().length;
  },

  countByStatus(
    status: TicketStatus
  ) {
    return getTicketsByStatus(
      status
    ).length;
  },

  countByPriority(
    priority: TicketPriority
  ) {
    return getTicketsByPriority(
      priority
    ).length;
  },

  countHighOrUrgent() {
    return localTicketRepository.listHighOrUrgent().length;
  },

  getStatusLabel(
    status: TicketStatus | string
  ) {
    return getStatusLabel(
      status
    );
  },

  getStatusClass(
    status: TicketStatus | string
  ) {
    return getStatusClass(
      status
    );
  },

  getPriorityLabel(
    priority: TicketPriority | string
  ) {
    return getPriorityLabel(
      priority
    );
  },

  getPriorityClass(
    priority: TicketPriority | string
  ) {
    return getPriorityClass(
      priority
    );
  },
};

export const ticketRepository =
  localTicketRepository;