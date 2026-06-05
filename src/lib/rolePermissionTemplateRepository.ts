import {
  requestJson,
} from "./apiClient";
import type {
  RolePermissionTemplate,
  RolePermissionTemplateCreateInput,
  RolePermissionTemplateUpdateInput,
} from "../types/rolePermissionTemplate";

type ApplyRolePermissionTemplateResult = {
  userId: string;
  templateKey: string;
  roleKey: string;
  appliedPermissions: string[];
  replaceExisting: boolean;
};

export type RolePermissionTemplateRepository = {
  list: () => Promise<RolePermissionTemplate[]>;
  listActive: () => Promise<RolePermissionTemplate[]>;
  findByKey: (key: string) => Promise<RolePermissionTemplate | null>;
  create: (input: RolePermissionTemplateCreateInput) => Promise<RolePermissionTemplate>;
  update: (
    key: string,
    input: RolePermissionTemplateUpdateInput
  ) => Promise<RolePermissionTemplate>;
  delete: (key: string) => Promise<void>;
  applyToUser: (
    userId: string,
    templateKey: string,
    replaceExisting?: boolean
  ) => Promise<ApplyRolePermissionTemplateResult>;
};

function dispatchRolePermissionTemplatesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("rolePermissionTemplatesUpdated"),
  );
}

function dispatchAdminUsersUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("adminUsersUpdated"),
  );
}

function dispatchPermissionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("permissionsUpdated"),
  );
}

function normalizePermissionKeys(permissionKeys?: string[]) {
  if (!Array.isArray(permissionKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      permissionKeys
        .map((permissionKey) => String(permissionKey).trim())
        .filter(Boolean),
    ),
  );
}

function normalizeCreateInput(input: RolePermissionTemplateCreateInput) {
  return {
    key: input.key.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || "",
    roleKey: input.roleKey?.trim() || "employee",
    permissionKeys: normalizePermissionKeys(input.permissionKeys),
    isDefault: input.isDefault ?? false,
    isActive: input.isActive ?? true,
    sortOrder: Number.isFinite(Number(input.sortOrder))
      ? Math.floor(Number(input.sortOrder))
      : 0,
  };
}

function normalizeUpdateInput(input: RolePermissionTemplateUpdateInput) {
  return {
    name: input.name?.trim(),
    description: input.description?.trim(),
    roleKey: input.roleKey?.trim(),
    permissionKeys: input.permissionKeys
      ? normalizePermissionKeys(input.permissionKeys)
      : undefined,
    isDefault: input.isDefault,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
}

export const postgresRolePermissionTemplateRepository: RolePermissionTemplateRepository = {
  async list() {
    return requestJson<RolePermissionTemplate[]>("/api/admin/role-permission-templates");
  },

  async listActive() {
    const templates = await postgresRolePermissionTemplateRepository.list();

    return templates.filter((template) => template.isActive);
  },

  async findByKey(key: string) {
    if (!key) {
      return null;
    }

    try {
      return await requestJson<RolePermissionTemplate>(
        `/api/admin/role-permission-templates/${encodeURIComponent(key)}`,
      );
    } catch {
      return null;
    }
  },

  async create(input: RolePermissionTemplateCreateInput) {
    const payload = normalizeCreateInput(input);

    if (!payload.key) {
      throw new Error("Template-Key ist erforderlich.");
    }

    if (!payload.name) {
      throw new Error("Name ist erforderlich.");
    }

    const template = await requestJson<RolePermissionTemplate>(
      "/api/admin/role-permission-templates",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    dispatchRolePermissionTemplatesUpdated();

    return template;
  },

  async update(
    key: string,
    input: RolePermissionTemplateUpdateInput,
  ) {
    if (!key) {
      throw new Error("Template-Key ist erforderlich.");
    }

    const template = await requestJson<RolePermissionTemplate>(
      `/api/admin/role-permission-templates/${encodeURIComponent(key)}`,
      {
        method: "PATCH",
        body: JSON.stringify(normalizeUpdateInput(input)),
      },
    );

    dispatchRolePermissionTemplatesUpdated();

    return template;
  },

  async delete(key: string) {
    if (!key) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/admin/role-permission-templates/${encodeURIComponent(key)}`,
      {
        method: "DELETE",
      },
    );

    dispatchRolePermissionTemplatesUpdated();
  },

  async applyToUser(
    userId: string,
    templateKey: string,
    replaceExisting = true,
  ) {
    if (!userId) {
      throw new Error("Benutzer-ID ist erforderlich.");
    }

    if (!templateKey) {
      throw new Error("Template-Key ist erforderlich.");
    }

    const result = await requestJson<ApplyRolePermissionTemplateResult>(
      `/api/admin-users/${encodeURIComponent(userId)}/role-template`,
      {
        method: "POST",
        body: JSON.stringify({
          templateKey,
          replaceExisting,
        }),
      },
    );

    dispatchAdminUsersUpdated();
    dispatchPermissionsUpdated();

    return result;
  },
};

export const rolePermissionTemplateRepository = postgresRolePermissionTemplateRepository;