export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
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

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  assignedTo?: string;
  createdBy?: string;

  tags?: string[];

  createdAt: string;
  updatedAt: string;
};

type OrganizationReference = {
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
};

const STORAGE_KEY =
  "dms_tickets";

const defaultTickets: Ticket[] = [
  {
    id:
      "ticket-demo-1",

    title:
      "Netzwerkdrucker funktioniert nicht",

    description:
      "Der Drucker im Office ist nicht erreichbar. Bitte Netzwerkverbindung und Treiber prüfen.",

    status:
      "open",

    priority:
      "high",

    category:
      "IT",

    companyId:
      "company-intern",

    departmentId:
      "department-it",

    company:
      "Intern",

    department:
      "IT",

    assignedTo:
      "Admin",

    createdBy:
      "Editor",

    tags:
      [
        "drucker",
        "netzwerk",
      ],

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "ticket-demo-2",

    title:
      "Neue Benutzerberechtigung anlegen",

    description:
      "Für einen neuen Mitarbeiter soll Zugriff auf interne Wiki-Dokumente vorbereitet werden.",

    status:
      "in_progress",

    priority:
      "medium",

    category:
      "Benutzer",

    companyId:
      "company-intern",

    departmentId:
      "department-support",

    company:
      "Intern",

    department:
      "Support",

    assignedTo:
      "Admin",

    createdBy:
      "Admin",

    tags:
      [
        "benutzer",
        "rechte",
      ],

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "ticket-demo-3",

    title:
      "Wiki-Dokumentation aktualisieren",

    description:
      "Die interne Anleitung für neue Mitarbeiter soll überarbeitet und ergänzt werden.",

    status:
      "waiting",

    priority:
      "low",

    category:
      "Dokumentation",

    companyId:
      "company-intern",

    departmentId:
      "department-office",

    company:
      "Intern",

    department:
      "Office",

    assignedTo:
      "Editor",

    createdBy:
      "Admin",

    tags:
      [
        "wiki",
        "dokumentation",
      ],

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

  if (value === "in_progress") {
    return "in_progress";
  }

  if (value === "waiting") {
    return "waiting";
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

function normalizeTags(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (tag) =>
        String(tag).trim()
    )
    .filter(Boolean);
}

function normalizeOrganizationReference(
  reference: OrganizationReference
): OrganizationReference {
  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    company:
      reference.company ||
      "Intern",

    department:
      reference.department ||
      "Allgemein",
  };
}

function normalizeTicket(
  ticket: Partial<Ticket>
): Ticket {
  const now =
    new Date().toLocaleString();

  const organization =
    normalizeOrganizationReference({
      companyId:
        ticket.companyId,

      departmentId:
        ticket.departmentId,

      company:
        ticket.company,

      department:
        ticket.department,
    });

  return {
    id:
      ticket.id ||
      createId(),

    title:
      ticket.title ||
      "Unbenanntes Ticket",

    description:
      ticket.description ||
      "",

    status:
      normalizeStatus(
        ticket.status
      ),

    priority:
      normalizePriority(
        ticket.priority
      ),

    category:
      ticket.category ||
      "Allgemein",

    companyId:
      organization.companyId,

    departmentId:
      organization.departmentId,

    company:
      organization.company,

    department:
      organization.department,

    assignedTo:
      ticket.assignedTo ||
      "",

    createdBy:
      ticket.createdBy ||
      "",

    tags:
      normalizeTags(
        ticket.tags
      ),

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

    return defaultTickets.map(
      (ticket) =>
        normalizeTicket(
          ticket
        )
    );
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

  const normalizedTickets =
    tickets.map(
      (ticket) =>
        normalizeTicket(
          ticket
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedTickets
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
  return (
    getTickets().find(
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

  const newTicket =
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

        const nextTicket =
          normalizeTicket({
            ...ticket,
            ...updates,

            id:
              ticket.id,

            createdAt:
              ticket.createdAt,

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

  saveTickets(
    tickets.filter(
      (ticket) =>
        ticket.id !== id
    )
  );
}

export function getTicketsByCompanyId(
  companyId: string
) {
  return getTickets().filter(
    (ticket) =>
      ticket.companyId === companyId
  );
}

export function getTicketsByDepartmentId(
  departmentId: string
) {
  return getTickets().filter(
    (ticket) =>
      ticket.departmentId === departmentId
  );
}

export function getTicketsByStatus(
  status: TicketStatus
) {
  return getTickets().filter(
    (ticket) =>
      ticket.status === status
  );
}

export function getTicketsByPriority(
  priority: TicketPriority
) {
  return getTickets().filter(
    (ticket) =>
      ticket.priority === priority
  );
}

export function getTicketStatusLabel(
  status: TicketStatus | string
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

  return "Unbekannt";
}

export function getTicketPriorityLabel(
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

export function getTicketStatusClass(
  status: TicketStatus | string
) {
  if (status === "open") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "in_progress") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (status === "waiting") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "done") {
    return "bg-green-50 text-green-700";
  }

  if (status === "closed") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export function getTicketPriorityClass(
  priority: TicketPriority | string
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
}