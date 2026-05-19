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
  category: string;
  assignedTo: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY =
  "dms_tickets";

const defaultTickets: Ticket[] = [
  {
    id:
      "ticket-demo-vpn",

    title:
      "VPN Verbindung funktioniert nicht",

    description:
      "Benutzer kann keine VPN-Verbindung herstellen. Bitte VPN-Client, Zugangsdaten und Netzwerk prüfen.",

    company:
      "Intern",

    category:
      "IT",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "high",

    createdBy:
      "System",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "ticket-demo-drucker",

    title:
      "Drucker druckt nicht",

    description:
      "Druckaufträge bleiben hängen. Druckerstatus, Warteschlange und Treiber prüfen.",

    company:
      "Intern",

    category:
      "Support",

    assignedTo:
      "IT Support",

    status:
      "in-progress",

    priority:
      "medium",

    createdBy:
      "System",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },
];

function dispatchTicketsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("ticketsUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeStatus(
  value: unknown
): TicketStatus {
  if (value === "open") {
    return "open";
  }

  if (value === "in-progress") {
    return "in-progress";
  }

  if (value === "done") {
    return "done";
  }

  if (value === "closed") {
    return "closed";
  }

  return "open";
}

function normalizePriority(
  value: unknown
): TicketPriority {
  if (value === "low") {
    return "low";
  }

  if (value === "medium") {
    return "medium";
  }

  if (value === "high") {
    return "high";
  }

  if (value === "urgent") {
    return "urgent";
  }

  return "medium";
}

function normalizeTicket(
  ticket: Partial<Ticket>
): Ticket {
  const now =
    new Date().toLocaleString();

  return {
    id:
      ticket.id ||
      createId(),

    title:
      ticket.title ||
      "Ohne Titel",

    description:
      ticket.description ||
      "",

    company:
      ticket.company ||
      "Intern",

    category:
      ticket.category ||
      "Allgemein",

    assignedTo:
      ticket.assignedTo ||
      "",

    status:
      normalizeStatus(
        ticket.status
      ),

    priority:
      normalizePriority(
        ticket.priority
      ),

    createdBy:
      ticket.createdBy ||
      "Unbekannt",

    createdAt:
      ticket.createdAt ||
      now,

    updatedAt:
      ticket.updatedAt ||
      now,
  };
}

export function getTickets(): Ticket[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultTickets
      )
    );

    return defaultTickets;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (ticket) =>
        normalizeTicket(
          ticket
        )
    );
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

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      tickets
    )
  );

  dispatchTicketsUpdated();
}

export function resetTickets() {
  saveTickets(
    defaultTickets
  );
}

export function clearTickets() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchTicketsUpdated();
}

export function getTicketById(
  id: string
): Ticket | null {
  const tickets =
    getTickets();

  return (
    tickets.find(
      (ticket) =>
        ticket.id === id
    ) || null
  );
}

export function createTicket(
  ticket: Omit<
    Ticket,
    "id" | "createdAt" | "updatedAt"
  >
): Ticket {
  const tickets =
    getTickets();

  const now =
    new Date().toLocaleString();

  const newTicket: Ticket =
    normalizeTicket({
      ...ticket,

      id:
        createId(),

      createdAt:
        now,

      updatedAt:
        now,
    });

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
  const tickets =
    getTickets();

  let updatedTicket:
    | Ticket
    | null = null;

  const updatedTickets =
    tickets.map(
      (ticket) => {
        if (ticket.id !== id) {
          return ticket;
        }

        const nextTicket: Ticket =
          normalizeTicket({
            ...ticket,
            ...updates,

            id:
              ticket.id,

            createdAt:
              ticket.createdAt,

            createdBy:
              ticket.createdBy,

            updatedAt:
              new Date().toLocaleString(),
          });

        updatedTicket =
          nextTicket;

        return nextTicket;
      }
    );

  saveTickets(
    updatedTickets
  );

  return updatedTicket;
}

export function deleteTicket(
  id: string
) {
  const tickets =
    getTickets();

  const updatedTickets =
    tickets.filter(
      (ticket) =>
        ticket.id !== id
    );

  saveTickets(
    updatedTickets
  );
}

export function getStatusLabel(
  status: TicketStatus | string
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
  priority: TicketPriority | string
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

export function getStatusOptions(): {
  value: TicketStatus;
  label: string;
}[] {
  return [
    {
      value:
        "open",

      label:
        "Offen",
    },

    {
      value:
        "in-progress",

      label:
        "In Bearbeitung",
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

export function getPriorityOptions(): {
  value: TicketPriority;
  label: string;
}[] {
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