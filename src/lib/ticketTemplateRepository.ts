import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../types/ticketTemplate";

type TicketTemplatePayload = {
  title?: string;
  description?: string;
  status?: TicketTemplateStatus;
  priority?: TicketTemplatePriority;
  category?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  assignedTo?: string;
  tags?: string[];
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

function normalizePayload(payload: TicketTemplatePayload) {
  return {
    title: payload.title?.trim(),
    description: payload.description?.trim() || "",
    status: payload.status || "active",
    priority: payload.priority || "medium",
    category: payload.category?.trim(),
    companyId: payload.companyId?.trim() || "",
    departmentId: payload.departmentId?.trim() || "",
    company: payload.company?.trim() || "Intern",
    department: payload.department?.trim() || "",
    assignedTo: payload.assignedTo?.trim() || "",
    tags: normalizeTags(payload.tags),
  };
}

function dispatchTicketTemplatesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("ticketTemplatesUpdated"));
}

export const ticketTemplateRepository = {
  async list() {
    const response = await fetch("/api/ticket-templates", {
      cache: "no-store",
    });

    return parseJsonResponse<TicketTemplate[]>(
      response,
      "Ticket-Vorlagen konnten nicht geladen werden.",
    );
  },

  async findById(id: string) {
    const response = await fetch(
      `/api/ticket-templates/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return null;
    }

    return parseJsonResponse<TicketTemplate>(
      response,
      "Ticket-Vorlage konnte nicht geladen werden.",
    );
  },

  async create(payload: TicketTemplatePayload) {
    const normalizedPayload = normalizePayload(payload);

    if (!normalizedPayload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!normalizedPayload.category) {
      throw new Error("Kategorie ist erforderlich.");
    }

    const response = await fetch("/api/ticket-templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });

    const createdTemplate = await parseJsonResponse<TicketTemplate>(
      response,
      "Ticket-Vorlage konnte nicht erstellt werden.",
    );

    dispatchTicketTemplatesUpdated();

    return createdTemplate;
  },

  async update(
    id: string,
    payload: TicketTemplatePayload,
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
      `/api/ticket-templates/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      },
    );

    const updatedTemplate = await parseJsonResponse<TicketTemplate>(
      response,
      "Ticket-Vorlage konnte nicht aktualisiert werden.",
    );

    dispatchTicketTemplatesUpdated();

    return updatedTemplate;
  },

  async delete(id: string) {
    const response = await fetch(
      `/api/ticket-templates/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    await parseJsonResponse<{
      ok: boolean;
    }>(
      response,
      "Ticket-Vorlage konnte nicht gelöscht werden.",
    );

    dispatchTicketTemplatesUpdated();

    return true;
  },

  getStatusLabel(status: TicketTemplateStatus | string) {
    switch (status) {
      case "active":
        return "Aktiv";
      case "inactive":
        return "Inaktiv";
      default:
        return String(status || "Unbekannt");
    }
  },

  getStatusClass(status: TicketTemplateStatus | string) {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border border-green-100";
      case "inactive":
        return "bg-zinc-100 text-zinc-600 border border-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-600 border border-zinc-200";
    }
  },

  getPriorityLabel(priority: TicketTemplatePriority | string) {
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

  getPriorityClass(priority: TicketTemplatePriority | string) {
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