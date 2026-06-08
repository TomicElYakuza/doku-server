"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../lib/currentUserRepository";

import {
  permissionRepository,
} from "../lib/permissionRepository";

import type {
  User,
} from "../types/user";

const ADMIN_PERMISSION_KEY =
  "*";

export type PermissionCheckContext = {
  companyId?: string;
  departmentId?: string;
  ownerId?: string;
};

export type UsePermissionsResult = {
  user: User | null;
  loading: boolean;
  permissionKeys: string[];
  isAdmin: boolean;
  isDepartmentLead: boolean;
  isEmployee: boolean;
  hasPermission: (
    permissionKey: string,
    context?: PermissionCheckContext
  ) => boolean;
  hasAnyPermission: (
    permissionKeys: string[],
    context?: PermissionCheckContext
  ) => boolean;
  hasAllPermissions: (
    permissionKeys: string[],
    context?: PermissionCheckContext
  ) => boolean;
  reload: () => Promise<void>;
};

function hasDirectPermission(
  permissionKeys: string[],
  permissionKey: string
) {
  return (
    permissionKeys.includes(
      ADMIN_PERMISSION_KEY
    ) ||
    permissionKeys.includes(
      permissionKey
    )
  );
}

export function usePermissions(): UsePermissionsResult {
  const [user, setUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [permissionKeys, setPermissionKeys] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void reload();

    function handlePermissionsUpdated() {
      void reload();
    }

    window.addEventListener(
      "permissionsUpdated",
      handlePermissionsUpdated
    );

    return () => {
      window.removeEventListener(
        "permissionsUpdated",
        handlePermissionsUpdated
      );
    };
  }, []);

  async function reload() {
    try {
      setLoading(
        true
      );

      let currentUser =
        getCachedCurrentUser();

      if (!currentUser) {
        currentUser =
          await loadCurrentUser();
      }

      setUser(
        currentUser
      );

      if (!currentUser?.id) {
        setPermissionKeys(
          []
        );

        return;
      }

      const effectivePermissions =
        await permissionRepository.getEffectivePermissions(
          currentUser.id
        );

      setPermissionKeys(
        Array.isArray(
          effectivePermissions.permissionKeys
        )
          ? effectivePermissions.permissionKeys
          : []
      );
    } catch (error) {
      console.error(
        "Berechtigungen konnten nicht geladen werden:",
        error
      );

      setUser(
        null
      );

      setPermissionKeys(
        []
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const isAdmin =
    user?.role === "admin";

  const isDepartmentLead =
    user?.role === "department_lead";

  const isEmployee =
    user?.role === "employee";

  const hasPermission =
    useMemo(
      () =>
        function checkPermission(
          permissionKey: string,
          _context?: PermissionCheckContext
        ) {
          if (isAdmin) {
            return true;
          }

          return hasDirectPermission(
            permissionKeys,
            permissionKey
          );
        },
      [
        isAdmin,
        permissionKeys,
      ]
    );

  const hasAnyPermission =
    useMemo(
      () =>
        function checkAnyPermission(
          keys: string[],
          context?: PermissionCheckContext
        ) {
          if (isAdmin) {
            return true;
          }

          return keys.some(
            (key) =>
              hasPermission(
                key,
                context
              )
          );
        },
      [
        isAdmin,
        hasPermission,
      ]
    );

  const hasAllPermissions =
    useMemo(
      () =>
        function checkAllPermissions(
          keys: string[],
          context?: PermissionCheckContext
        ) {
          if (isAdmin) {
            return true;
          }

          return keys.every(
            (key) =>
              hasPermission(
                key,
                context
              )
          );
        },
      [
        isAdmin,
        hasPermission,
      ]
    );

  return {
    user,
    loading,
    permissionKeys,
    isAdmin,
    isDepartmentLead,
    isEmployee,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reload,
  };
}
