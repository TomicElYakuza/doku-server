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
  company: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeTicket(ticket: any): Ticket {
  return {
    id:
      ticket.id || "",

    title:
      ticket.title || "Ohne Titel",

    description:
      ticket.description || "",

    company:
      ticket.company || "Intern",

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
      ticket.createdAt || "",

    updatedAt:
      ticket.updatedAt || "",
  };
}

function normalizeTickets(
  tickets: any[]
): Ticket[] {
  if (!Array.isArray(tickets)) {
    return [];
  }

  return tickets.map(
    (ticket) =>
      normalizeTicket(ticket)
  );
}

export function getTickets(): Ticket[] {
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

    return normalizeTickets(parsed);
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
    normalizeTickets(
      Array.isArray(tickets)
        ? tickets
        : []
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeTickets)
  );

  window.dispatchEvent(
    new Event("ticketsUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function createTicket(
  ticket: Omit<
    Ticket,
    "id" | "createdAt" | "updatedAt"
  >
): Ticket | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tickets =
    getTickets();

  const now =
    new Date().toLocaleString();

  const newTicket: Ticket = {
    id:
      createId(),

    title:
      ticket.title || "Ohne Titel",

    description:
      ticket.description || "",

    company:
      ticket.company || "Intern",

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
): Ticket | null {
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
    tickets.map((ticket) => {
      if (ticket.id !== id) {
        return ticket;
      }

      const nextTicket: Ticket = {
        ...ticket,
        ...updates,
        id:
          ticket.id,
        createdAt:
          ticket.createdAt,
        company:
          updates.company ||
          ticket.company ||
          "Intern",
        updatedAt:
          new Date().toLocaleString(),
      };

      updatedTicket =
        nextTicket;

      return nextTicket;
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
      (ticket) =>
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