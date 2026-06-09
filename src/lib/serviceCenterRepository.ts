import type {
  ServiceCase,
  ServiceCaseInput,
  ServiceCasePriority,
  ServiceCaseStatus,
  ServiceCaseType,
  ServicePaymentStatus,
} from "../types/service";

async function parseResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const body = await response.json();
      message = body.message || body.error || fallbackMessage;
    } catch {
      // ignore parse error
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalized = String(value || "").trim();

    if (normalized) {
      searchParams.set(key, normalized);
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const serviceCenterRepository = {
  async list(filters?: {
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    paymentStatus?: string;
    assignedUserId?: string;
    companyId?: string;
    departmentId?: string;
  }) {
    const query = buildQuery({
      search: filters?.search || "",
      type: filters?.type || "",
      status: filters?.status || "",
      priority: filters?.priority || "",
      paymentStatus: filters?.paymentStatus || "",
      assignedUserId: filters?.assignedUserId || "",
      companyId: filters?.companyId || "",
      departmentId: filters?.departmentId || "",
    });

    const response = await fetch(`/api/service${query}`, {
      cache: "no-store",
    });

    return parseResponse<ServiceCase[]>(
      response,
      "Servicefälle konnten nicht geladen werden.",
    );
  },

  async get(id: string) {
    const response = await fetch(`/api/service/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    return parseResponse<ServiceCase>(
      response,
      "Servicefall konnte nicht geladen werden.",
    );
  },

  async create(input: ServiceCaseInput) {
    const response = await fetch("/api/service", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const serviceCase = await parseResponse<ServiceCase>(
      response,
      "Servicefall konnte nicht erstellt werden.",
    );

    window.dispatchEvent(new Event("serviceCasesUpdated"));

    return serviceCase;
  },

  async update(id: string, input: ServiceCaseInput) {
    const response = await fetch(`/api/service/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const serviceCase = await parseResponse<ServiceCase>(
      response,
      "Servicefall konnte nicht gespeichert werden.",
    );

    window.dispatchEvent(new Event("serviceCasesUpdated"));

    return serviceCase;
  },

  async delete(id: string) {
    const response = await fetch(`/api/service/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const result = await parseResponse<{ ok: boolean }>(
      response,
      "Servicefall konnte nicht gelöscht werden.",
    );

    window.dispatchEvent(new Event("serviceCasesUpdated"));

    return result;
  },

  getTypeLabel(type: string) {
    const labels: Record<ServiceCaseType | string, string> = {
      repair: "Reparatur",
      sale: "Verkauf",
      consulting: "Beratung",
      warranty: "Garantie",
      complaint: "Reklamation",
      maintenance: "Wartung",
      other: "Sonstiges",
    };

    return labels[type] || type || "Nicht gesetzt";
  },

  getStatusLabel(status: string) {
    const labels: Record<ServiceCaseStatus | string, string> = {
      new: "Neu",
      checking: "In Prüfung",
      offer: "Angebot",
      in_progress: "In Arbeit",
      waiting_customer: "Wartet auf Kunde",
      ready_for_pickup: "Abholbereit",
      completed: "Abgeschlossen",
      cancelled: "Storniert",
    };

    return labels[status] || status || "Nicht gesetzt";
  },

  getPriorityLabel(priority: string) {
    const labels: Record<ServiceCasePriority | string, string> = {
      low: "Niedrig",
      normal: "Normal",
      high: "Hoch",
      urgent: "Dringend",
    };

    return labels[priority] || priority || "Nicht gesetzt";
  },

  getPaymentStatusLabel(status: string) {
    const labels: Record<ServicePaymentStatus | string, string> = {
      open: "Offen",
      partial: "Teilbezahlt",
      paid: "Bezahlt",
      refunded: "Erstattet",
      cancelled: "Storniert",
    };

    return labels[status] || status || "Nicht gesetzt";
  },
};