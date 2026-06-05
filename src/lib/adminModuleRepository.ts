import {
  requestJson,
} from "./apiClient";
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
    input: AdminModuleUpdateInput
  ) => Promise<AdminModuleConfig>;
  delete: (key: string) => Promise<void>;
};

function dispatchAdminModulesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("adminModulesUpdated"),
  );
}

function normalizeCreateInput(input: AdminModuleCreateInput) {
  return {
    key: input.key.trim(),
    title: input.title.trim(),
    description: input.description?.trim() || "",
    href: input.href.trim(),
    icon: input.icon?.trim() || "🧩",
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

export const postgresAdminModuleRepository: AdminModuleRepository = {
  async list() {
    return requestJson<AdminModuleConfig[]>("/api/admin/modules");
  },

  async listVisible() {
    const modules = await postgresAdminModuleRepository.list();

    return modules.filter((module) => module.isVisible);
  },

  async findByKey(key: string) {
    if (!key) {
      return null;
    }

    try {
      return await requestJson<AdminModuleConfig>(
        `/api/admin/modules/${encodeURIComponent(key)}`,
      );
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

    const module = await requestJson<AdminModuleConfig>(
      "/api/admin/modules",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchAdminModulesUpdated();

    return module;
  },

  async update(
    key: string,
    input: AdminModuleUpdateInput,
  ) {
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

    dispatchAdminModulesUpdated();

    return module;
  },

  async delete(key: string) {
    if (!key) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/admin/modules/${encodeURIComponent(key)}`,
      {
        method: "DELETE",
      },
    );

    dispatchAdminModulesUpdated();
  },
};

export const adminModuleRepository = postgresAdminModuleRepository;