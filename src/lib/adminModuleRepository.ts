import { requestJson } from "./apiClient";
import type {
  AdminModuleConfig,
  AdminModuleCreateInput,
  AdminModuleUpdateInput,
} from "../types/adminModule";

export type AdminModuleRepository = {
  list: () => Promise<AdminModuleConfig[]>;
  listVisible: () => Promise<AdminModuleConfig[]>;
  findByKey: (key: string) => Promise<AdminModuleConfig | null>;
  create: (input: AdminModuleCreateInput) => Promise<AdminModuleConfig>;
  update: (
    key: string,
    input: AdminModuleUpdateInput,
  ) => Promise<AdminModuleConfig>;
  delete: (key: string) => Promise<void>;
  clearCache: () => void;
};

let cachedModules: AdminModuleConfig[] | null = null;
let pendingModulesRequest: Promise<AdminModuleConfig[]> | null = null;

function dispatchAdminModulesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("adminModulesUpdated"));
}

function clearModuleCache() {
  cachedModules = null;
  pendingModulesRequest = null;
}

function normalizeCreateInput(input: AdminModuleCreateInput) {
  return {
    key: input.key.trim(),
    title: input.title.trim(),
    description: input.description?.trim() || "",
    href: input.href.trim(),
    icon: input.icon?.trim() || "",
    category: input.category?.trim() || "admin",
    badgeLabel: input.badgeLabel?.trim() || "",
    sortOrder: Number.isFinite(Number(input.sortOrder))
      ? Math.floor(Number(input.sortOrder))
      : 0,
    isEnabled: input.isEnabled ?? true,
    isVisible: input.isVisible ?? true,
    isCore: input.isCore ?? false,
  };
}

function normalizeUpdateInput(input: AdminModuleUpdateInput) {
  return {
    title: input.title?.trim(),
    description: input.description?.trim(),
    href: input.href?.trim(),
    icon: input.icon?.trim(),
    category: input.category?.trim(),
    badgeLabel: input.badgeLabel?.trim(),
    sortOrder: input.sortOrder,
    isEnabled: input.isEnabled,
    isVisible: input.isVisible,
    isCore: input.isCore,
  };
}

function normalizeModule(module: AdminModuleConfig): AdminModuleConfig {
  return {
    key: String(module.key || "").trim(),
    title: String(module.title || "").trim(),
    description: String(module.description || "").trim(),
    href: String(module.href || "").trim(),
    icon: String(module.icon || "").trim(),
    category: String(module.category || "admin").trim(),
    badgeLabel: String(module.badgeLabel || "").trim(),
    sortOrder: Number(module.sortOrder || 0),
    isEnabled: Boolean(module.isEnabled),
    isVisible: Boolean(module.isVisible),
    isCore: Boolean(module.isCore),
    createdAt: String(module.createdAt || ""),
    updatedAt: String(module.updatedAt || ""),
  };
}

function sortModules(modules: AdminModuleConfig[]) {
  return [...modules].sort((first, second) => {
    const sortCompare =
      Number(first.sortOrder || 0) - Number(second.sortOrder || 0);

    if (sortCompare !== 0) {
      return sortCompare;
    }

    return first.title.localeCompare(second.title);
  });
}

async function fetchModules() {
  const modules = await requestJson<AdminModuleConfig[]>("/api/admin/modules");

  const normalizedModules = sortModules(
    Array.isArray(modules)
      ? modules.map(normalizeModule).filter((module) => module.key)
      : [],
  );

  cachedModules = normalizedModules;

  return normalizedModules;
}

export const postgresAdminModuleRepository: AdminModuleRepository = {
  async list() {
    if (cachedModules) {
      return cachedModules;
    }

    if (!pendingModulesRequest) {
      pendingModulesRequest = fetchModules().finally(() => {
        pendingModulesRequest = null;
      });
    }

    return pendingModulesRequest;
  },

  async listVisible() {
    const modules = await postgresAdminModuleRepository.list();

    return modules.filter((module) => module.isEnabled && module.isVisible);
  },

  async findByKey(key: string) {
    if (!key) {
      return null;
    }

    const cachedModule = cachedModules?.find(
      (module) => module.key === key,
    );

    if (cachedModule) {
      return cachedModule;
    }

    try {
      const module = await requestJson<AdminModuleConfig>(
        `/api/admin/modules/${encodeURIComponent(key)}`,
      );

      return normalizeModule(module);
    } catch {
      return null;
    }
  },

  async create(input: AdminModuleCreateInput) {
    const payload = normalizeCreateInput(input);

    if (!payload.key) {
      throw new Error("Modul-Key ist erforderlich.");
    }

    if (!payload.title) {
      throw new Error("Titel ist erforderlich.");
    }

    if (!payload.href) {
      throw new Error("Link ist erforderlich.");
    }

    const module = await requestJson<AdminModuleConfig>("/api/admin/modules", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    clearModuleCache();
    dispatchAdminModulesUpdated();

    return normalizeModule(module);
  },

  async update(key: string, input: AdminModuleUpdateInput) {
    if (!key) {
      throw new Error("Modul-Key ist erforderlich.");
    }

    const module = await requestJson<AdminModuleConfig>(
      `/api/admin/modules/${encodeURIComponent(key)}`,
      {
        method: "PATCH",
        body: JSON.stringify(normalizeUpdateInput(input)),
      },
    );

    clearModuleCache();
    dispatchAdminModulesUpdated();

    return normalizeModule(module);
  },

  async delete(key: string) {
    if (!key) {
      return;
    }

    await requestJson<{ ok: boolean }>(
      `/api/admin/modules/${encodeURIComponent(key)}`,
      {
        method: "DELETE",
      },
    );

    clearModuleCache();
    dispatchAdminModulesUpdated();
  },

  clearCache() {
    clearModuleCache();
  },
};

export const adminModuleRepository = postgresAdminModuleRepository;