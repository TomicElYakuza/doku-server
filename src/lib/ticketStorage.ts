const STORAGE_KEY = "wiki-tickets";

export type TicketStatus =
  | "open"
  | "in-progress"
  | "done"
  | "closed";

export type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export function getTickets() {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveTickets(
  tickets: Ticket[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const safeTickets =
    Array.isArray(tickets)
      ? tickets
      : [];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeTickets)
  );

  window.dispatchEvent(
    new Event("ticketsUpdated")
  );
}

export function createTicket(
  ticket: Omit<
    Ticket,
    "id" | "createdAt" | "updatedAt"
  >
) {
  if (typeof window === "undefined") {
    return null;
  }

  const tickets =
    getTickets();

  const now =
    new Date().toLocaleString();

  const newTicket: Ticket = {
    id:
      crypto.randomUUID?.() ||
      `${Date.now()}`,

    title:
      ticket.title || "Ohne Titel",

    description:
      ticket.description || "",

    status:
      ticket.status || "open",

    priority:
      ticket.priority || "medium",

    category:
      ticket.category || "Allgemein",

    createdBy:
      ticket.createdBy || "Unbekannt",

    assignedTo:
      ticket.assignedTo || "",

    createdAt:
      now,

    updatedAt:
      now,
  };

  saveTickets([
    newTicket,
    ...tickets,
  ]);

  return newTicket;
}

export function updateTicket(
  id: string,
  updates: Partial<Ticket>
) {
  if (typeof window === "undefined") {
    return null;
  }

  if (!id) {
    return null;
  }

  const tickets =
    getTickets();

  let updatedTicket: Ticket | null =
    null;

  const updatedTickets =
    tickets.map((ticket: Ticket) => {
      if (ticket.id !== id) {
        return ticket;
      }

      updatedTicket = {
        ...ticket,
        ...updates,
        id: ticket.id,
        createdAt: ticket.createdAt,
        updatedAt:
          new Date().toLocaleString(),
      };

      return updatedTicket;
    });

  saveTickets(updatedTickets);

  return updatedTicket;
}

export function deleteTicket(
  id: string
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!id) {
    return;
  }

  const tickets =
    getTickets();

  const updatedTickets =
    tickets.filter(
      (ticket: Ticket) =>
        ticket.id !== id
    );

  saveTickets(updatedTickets);
}

export function clearTickets() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("ticketsUpdated")
  );
}

export function getStatusLabel(
  status: string
) {
  if (status === "open") {
    return "Offen";
  }

  if (status === "in-progress") {
    return "In Bearbeitung";
  }

  if (status === "done") {
    return "Erledigt";
  }

  if (status === "closed") {
    return "Geschlossen";
  }

  return "Unbekannt";
}

export function getPriorityLabel(
  priority: string
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

  return "Unbekannt";
}