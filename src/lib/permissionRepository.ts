import {
  requestJson,
} from "./apiClient";
import type {
  EffectivePermissionResult,
  Permission,
  PermissionAssignmentInput,
  UserPermission,
} from "../types/permission";

type EffectivePermissionCacheEntry = {
  value: EffectivePermissionResult;
  cachedAt: number;
};

type EffectivePermissionOptions = {
  force?: boolean;
};

export type PermissionRepository = {
  listPermissions: () => Promise<Permission[]>;
  listCompanyPermissions: (
    companyId: string,
  ) => Promise<string[]>;
  listDepartmentPermissions: (
    departmentId: string,
  ) => Promise<string[]>;
  listUserPermissions: (
    userId: string,
  ) => Promise<UserPermission[]>;
  saveCompanyPermissions: (
    companyId: string,
    permissionKeys: string[],
  ) => Promise<void>;
  saveDepartmentPermissions: (
    departmentId: string,
    permissionKeys: string[],
  ) => Promise<void>;
  saveUserPermissions: (
    userId: string,
    permissions: UserPermission[],
  ) => Promise<void>;
  getEffectivePermissions: (
    userId: string,
    options?: EffectivePermissionOptions,
  ) => Promise<EffectivePermissionResult>;
  clearEffectivePermissionsCache: () => void;
};

const EFFECTIVE_PERMISSIONS_CACHE_TIME_MS = 30_000;

const effectivePermissionsCache =
  new Map<string, EffectivePermissionCacheEntry>();

const effectivePermissionsPromises =
  new Map<string, Promise<EffectivePermissionResult>>();

function normalizePermissionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (
        item &&
        typeof item === "object" &&
        "permissionKey" in item
      ) {
        return String(
          (item as { permissionKey?: unknown }).permissionKey || "",
        );
      }

      if (
        item &&
        typeof item === "object" &&
        "permission_key" in item
      ) {
        return String(
          (item as { permission_key?: unknown }).permission_key || "",
        );
      }

      return "";
    })
    .filter(Boolean);
}

export function dispatchPermissionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("permissionsUpdated"),
  );
}

export function clearEffectivePermissionsCache() {
  effectivePermissionsCache.clear();
  effectivePermissionsPromises.clear();
}

function isEffectivePermissionsCacheValid(userId: string) {
  const cached =
    effectivePermissionsCache.get(userId);

  return (
    Boolean(cached) &&
    Date.now() - cached!.cachedAt < EFFECTIVE_PERMISSIONS_CACHE_TIME_MS
  );
}

export const permissionRepository: PermissionRepository = {
  async listPermissions() {
    return requestJson<Permission[]>(
      "/api/permissions",
    );
  },

  async listCompanyPermissions(companyId: string) {
    if (!companyId) {
      return [];
    }

    const response = await requestJson<unknown>(
      `/api/permissions/company/${encodeURIComponent(companyId)}`,
    );

    return normalizePermissionKeys(response);
  },

  async listDepartmentPermissions(departmentId: string) {
    if (!departmentId) {
      return [];
    }

    const response = await requestJson<unknown>(
      `/api/permissions/department/${encodeURIComponent(departmentId)}`,
    );

    return normalizePermissionKeys(response);
  },

  async listUserPermissions(userId: string) {
    if (!userId) {
      return [];
    }

    return requestJson<UserPermission[]>(
      `/api/permissions/user/${encodeURIComponent(userId)}`,
    );
  },

  async saveCompanyPermissions(
    companyId: string,
    permissionKeys: string[],
  ) {
    if (!companyId) {
      return;
    }

    await requestJson(
      `/api/permissions/company/${encodeURIComponent(companyId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          permissionKeys,
        }),
      },
    );

    clearEffectivePermissionsCache();
    dispatchPermissionsUpdated();
  },

  async saveDepartmentPermissions(
    departmentId: string,
    permissionKeys: string[],
  ) {
    if (!departmentId) {
      return;
    }

    await requestJson(
      `/api/permissions/department/${encodeURIComponent(departmentId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          permissionKeys,
        }),
      },
    );

    clearEffectivePermissionsCache();
    dispatchPermissionsUpdated();
  },

  async saveUserPermissions(
    userId: string,
    permissions: UserPermission[],
  ) {
    if (!userId) {
      return;
    }

    const input: PermissionAssignmentInput = {
      targetType: "user",
      targetId: userId,
      permissionKeys: permissions.map((permission) =>
        permission.permissionKey,
      ),
    };

    await requestJson(
      `/api/permissions/user/${encodeURIComponent(userId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ...input,
          permissions,
        }),
      },
    );

    clearEffectivePermissionsCache();
    dispatchPermissionsUpdated();
  },

  async getEffectivePermissions(
    userId: string,
    options?: EffectivePermissionOptions,
  ) {
    if (!userId) {
      return {
        permissionKeys: [],
      };
    }

    if (
      !options?.force &&
      isEffectivePermissionsCacheValid(userId)
    ) {
      return effectivePermissionsCache.get(userId)!.value;
    }

    if (
      !options?.force &&
      effectivePermissionsPromises.has(userId)
    ) {
      return effectivePermissionsPromises.get(userId)!;
    }

    const promise =
      requestJson<EffectivePermissionResult>(
        `/api/permissions/effective/${encodeURIComponent(userId)}`,
      )
        .then((result) => {
          effectivePermissionsCache.set(userId, {
            value: result,
            cachedAt: Date.now(),
          });

          return result;
        })
        .finally(() => {
          effectivePermissionsPromises.delete(userId);
        });

    effectivePermissionsPromises.set(userId, promise);

    return promise;
  },

  clearEffectivePermissionsCache,
};
