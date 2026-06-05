import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../types/ticket";

type TicketPayload = {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  assignedTo?: string;
  createdBy?: string;
  tags?: string[];
};

type TicketFilters = {
  status?: string;
  priority?: string;
  category?: string;
  tag?: string;
  companyId?: string;
  departmentId?: string;
};

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

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      fallbackMessage,
    );
  }

  return data as T;
}

function buildQuery(params: TicketFilters = {}) {
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

function normalizePayload(payload: TicketPayload) {
  return {
    title: payload.title?.trim(),
    description: payload.description?.trim() || "",
    status: payload.status || "open",
    priority: payload.priority || "medium",
    category: payload.category?.trim(),
    companyId: payload.companyId?.trim() || "",
    departmentId: payload.departmentId?.trim() || "",
    company: payload.company?.trim() || "Intern",
    department: payload.department?.trim() || "Allgemein",
    assignedTo: payload.assignedTo?.trim() || "",
    createdBy: payload.createdBy?.trim() || "System",
    tags: normalizeTags(payload.tags),
  };
}

export const ticketRepository = {
  async list(filters?: TicketFilters) {
    const query = buildQuery(filters);

    const response = await fetch(`/api/tickets${query}`, {
      cache: "no-store",
    });

    return parseJsonResponse<Ticket[]>(
      response,
      "Tickets konnten nicht geladen werden.",
    );
  },

  async findById(id: string | number) {
    const response = await fetch(
      `/api/tickets/${encodeURIComponent(String(id))}`,
      {
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return null;
    }

    return parseJsonResponse<Ticket>(
      response,
      "Ticket konnte nicht geladen werden.",
    );
  },

  async create(payload: TicketPayload) {
    const normalizedPayload = normalizePayload(payload);

    if (!normalizedPayload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!normalizedPayload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });

    const createdTicket = await parseJsonResponse<Ticket>(
      response,
      "Ticket konnte nicht erstellt werden.",
    );

    window.dispatchEvent(new Event("ticketsUpdated"));

    return createdTicket;
  },

  async update(
    id: string | number,
    payload: TicketPayload,
  ) {
    const normalizedPayload = normalizePayload(payload);

    if (
      payload.title !== undefined &&
      !normalizedPayload.title
    ) {
      throw new Error("Titel ist erforderlich.");
    }

    if (
      payload.category !== undefined &&
      !normalizedPayload.category
    ) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const response = await fetch(
      `/api/tickets/${encodeURIComponent(String(id))}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      },
    );

    const updatedTicket = await parseJsonResponse<Ticket>(
      response,
      "Ticket konnte nicht aktualisiert werden.",
    );

    window.dispatchEvent(new Event("ticketsUpdated"));

    return updatedTicket;
  },

  async delete(id: string | number) {
    const response = await fetch(
      `/api/tickets/${encodeURIComponent(String(id))}`,
      {
        method: "DELETE",
      },
    );

    await parseJsonResponse<{
      ok: boolean;
    }>(
      response,
      "Ticket konnte nicht gelöscht werden.",
    );

    window.dispatchEvent(new Event("ticketsUpdated"));

    return true;
  },

  getStatusLabel(status: TicketStatus | string) {
    switch (status) {
      case "open":
        return "Offen";
      case "in_progress":
        return "In Bearbeitung";
      case "waiting":
        return "Wartend";
      case "done":
        return "Erledigt";
      case "closed":
        return "Geschlossen";
      default:
        return String(status || "Unbekannt");
    }
  },

  getPriorityLabel(priority: TicketPriority | string) {
    switch (priority) {
      case "low":
        return "Niedrig";
      case "medium":
        return "Mittel";
      case "high":
        return "Hoch";
      case "urgent":
        return "Dringend";
      default:
        return String(priority || "Unbekannt");
    }
  },

  getStatusClass(status: TicketStatus | string) {
    switch (status) {
      case "open":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "in_progress":
        return "bg-yellow-50 text-yellow-700 border border-yellow-100";
      case "waiting":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      case "done":
        return "bg-green-50 text-green-700 border border-green-100";
      case "closed":
        return "bg-zinc-100 text-zinc-600 border border-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-600 border border-zinc-200";
    }
  },

  getPriorityClass(priority: TicketPriority | string) {
    switch (priority) {
      case "low":
        return "bg-green-50 text-green-700 border border-green-100";
      case "medium":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "high":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      case "urgent":
        return "bg-red-50 text-red-700 border border-red-100";
      default:
        return "bg-zinc-100 text-zinc-600 border border-zinc-200";
    }
  },
};