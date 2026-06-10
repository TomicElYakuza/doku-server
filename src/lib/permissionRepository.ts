import {
  requestJson,
} from "./apiClient";

import type {
  EffectivePermissionResult,
  Permission,
  PermissionAssignmentInput,
  UserPermission,
} from "../types/permission";

export type PermissionRepository = {
  listPermissions: () => Promise<Permission[]>;

  listCompanyPermissions: (
    companyId: string
  ) => Promise<string[]>;

  listDepartmentPermissions: (
    departmentId: string
  ) => Promise<string[]>;

  listUserPermissions: (
    userId: string
  ) => Promise<UserPermission[]>;

  saveCompanyPermissions: (
    companyId: string,
    permissionKeys: string[]
  ) => Promise<void>;

  saveDepartmentPermissions: (
    departmentId: string,
    permissionKeys: string[]
  ) => Promise<void>;

  saveUserPermissions: (
    userId: string,
    permissions: UserPermission[]
  ) => Promise<void>;

  getEffectivePermissions: (
    userId: string
  ) => Promise<EffectivePermissionResult>;
};

function dispatchPermissionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "permissionsUpdated"
    )
  );
}


const EFFECTIVE_PERMISSIONS_CACHE_TIME_MS = 30_000;

const effectivePermissionsCache = new Map<string, {
  value: Awaited<ReturnType<PermissionRepository["getEffectivePermissions"]>>;
  cachedAt: number;
}>();

const effectivePermissionsPromises = new Map<string, Promise<Awaited<ReturnType<PermissionRepository["getEffectivePermissions"]>>>>();

function isEffectivePermissionsCacheValid(userId: string) {
  const cached = effectivePermissionsCache.get(userId);

  return Boolean(cached) && Date.now() - cached!.cachedAt < EFFECTIVE_PERMISSIONS_CACHE_TIME_MS;
}

function clearEffectivePermissionsCache() {
  effectivePermissionsCache.clear();
  effectivePermissionsPromises.clear();
}
export const permissionRepository: PermissionRepository = {
  async listPermissions() {
    return requestJson<Permission[]>(
      "/api/permissions"
    );
  },

  async listCompanyPermissions(
    companyId: string
  ) {
    if (!companyId) {
      return [];
    }

    return requestJson<string[]>(
      `/api/permissions/company/${encodeURIComponent(
        companyId
      )}`
    );
  },

  async listDepartmentPermissions(
    departmentId: string
  ) {
    if (!departmentId) {
      return [];
    }

    return requestJson<string[]>(
      `/api/permissions/department/${encodeURIComponent(
        departmentId
      )}`
    );
  },

  async listUserPermissions(
    userId: string
  ) {
    if (!userId) {
      return [];
    }

    return requestJson<UserPermission[]>(
      `/api/permissions/user/${encodeURIComponent(
        userId
      )}`
    );
  },

  async saveCompanyPermissions(
    companyId: string,
    permissionKeys: string[]
  ) {
    if (!companyId) {
      return;
    }

    await requestJson<void>(
      `/api/permissions/company/${encodeURIComponent(
        companyId
      )}`,
      {
        method:
          "PUT",

        body:
          JSON.stringify({
            permissionKeys,
          }),
      }
    );

    clearEffectivePermissionsCache();
  dispatchPermissionsUpdated();
  },

  async saveDepartmentPermissions(
    departmentId: string,
    permissionKeys: string[]
  ) {
    if (!departmentId) {
      return;
    }

    await requestJson<void>(
      `/api/permissions/department/${encodeURIComponent(
        departmentId
      )}`,
      {
        method:
          "PUT",

        body:
          JSON.stringify({
            permissionKeys,
          }),
      }
    );

    clearEffectivePermissionsCache();
  dispatchPermissionsUpdated();
  },

  async saveUserPermissions(
    userId: string,
    permissions: UserPermission[]
  ) {
    if (!userId) {
      return;
    }

    const input: PermissionAssignmentInput = {
      targetType:
        "user",

      targetId:
        userId,

      permissionKeys:
        permissions.map(
          (permission) =>
            permission.permissionKey
        ),
    };

    await requestJson<void>(
      `/api/permissions/user/${encodeURIComponent(
        userId
      )}`,
      {
        method:
          "PUT",

        body:
          JSON.stringify({
            ...input,

            permissions,
          }),
      }
    );

    clearEffectivePermissionsCache();
  dispatchPermissionsUpdated();
  },

  async getEffectivePermissions(
    userId: string
  ) {
    if (!userId) {
      return {
        permissionKeys:
          [],
      };
    }

    return requestJson<EffectivePermissionResult>(
      `/api/permissions/effective/${encodeURIComponent(
        userId
      )}`
    );
  },
};
