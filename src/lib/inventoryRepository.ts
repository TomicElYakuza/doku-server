import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
  InventoryAssetType,
} from "../types/inventory";

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

export const inventoryRepository = {
  async list(filters?: {
    search?: string;
    type?: string;
    status?: string;
    companyId?: string;
    departmentId?: string;
    assignedUserId?: string;
  }) {
    const query = buildQuery({
      search: filters?.search || "",
      type: filters?.type || "",
      status: filters?.status || "",
      companyId: filters?.companyId || "",
      departmentId: filters?.departmentId || "",
      assignedUserId: filters?.assignedUserId || "",
    });

    const response = await fetch(`/api/inventory${query}`, {
      cache: "no-store",
    });

    return parseResponse<InventoryAsset[]>(
      response,
      "IT-Inventar konnte nicht geladen werden.",
    );
  },

  async get(id: string) {
    const response = await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    return parseResponse<InventoryAsset>(
      response,
      "Inventar-Asset konnte nicht geladen werden.",
    );
  },

  async create(input: InventoryAssetInput) {
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const asset = await parseResponse<InventoryAsset>(
      response,
      "Inventar-Asset konnte nicht erstellt werden.",
    );

    window.dispatchEvent(new Event("inventoryUpdated"));

    return asset;
  },

  async update(id: string, input: InventoryAssetInput) {
    const response = await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const asset = await parseResponse<InventoryAsset>(
      response,
      "Inventar-Asset konnte nicht gespeichert werden.",
    );

    window.dispatchEvent(new Event("inventoryUpdated"));

    return asset;
  },

  async delete(id: string) {
    const response = await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const result = await parseResponse<{ ok: boolean }>(
      response,
      "Inventar-Asset konnte nicht gelöscht werden.",
    );

    window.dispatchEvent(new Event("inventoryUpdated"));

    return result;
  },

  getTypeLabel(type: string) {
    const labels: Record<InventoryAssetType | string, string> = {
      desktop: "PC",
      notebook: "Notebook",
      server: "Server",
      virtual_machine: "Virtuelle Maschine",
      printer: "Drucker",
      network: "Netzwerkgerät",
      mobile: "Mobilgerät",
      peripheral: "Peripherie",
      other: "Sonstiges",
    };

    return labels[type] || type || "Nicht gesetzt";
  },

  getStatusLabel(status: string) {
    const labels: Record<InventoryAssetStatus | string, string> = {
      active: "Aktiv",
      in_stock: "Lager",
      in_repair: "In Reparatur",
      retired: "Ausgemustert",
      lost: "Verloren",
      archived: "Archiviert",
    };

    return labels[status] || status || "Nicht gesetzt";
  },
};