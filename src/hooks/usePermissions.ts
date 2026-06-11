"use client";

import {
  useCallback,
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

const ADMIN_PERMISSION_KEY = "*";

export type PermissionCheckContext = {
  companyId?: string;
  departmentId?: string;
  ownerId?: string;
};

type ReloadPermissionsOptions = {
  forcePermissions?: boolean;
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
    context?: PermissionCheckContext,
  ) => boolean;
  hasAnyPermission: (
    permissionKeys: string[],
    context?: PermissionCheckContext,
  ) => boolean;
  hasAllPermissions: (
    permissionKeys: string[],
    context?: PermissionCheckContext,
  ) => boolean;
  reload: (options?: ReloadPermissionsOptions) => Promise<void>;
};

function hasDirectPermission(
  permissionKeys: string[],
  permissionKey: string,
) {
  return (
    permissionKeys.includes(ADMIN_PERMISSION_KEY) ||
    permissionKeys.includes(permissionKey)
  );
}

export function usePermissions(): UsePermissionsResult {
  const [
    user,
    setUser,
  ] = useState<User | null>(getCachedCurrentUser());

  const [
    permissionKeys,
    setPermissionKeys,
  ] = useState<string[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const reload = useCallback(
    async (options?: ReloadPermissionsOptions) => {
      try {
        setLoading(true);

        let nextUser =
          getCachedCurrentUser();

        if (!nextUser) {
          nextUser =
            await loadCurrentUser();
        }

        if (!nextUser?.id) {
          setUser(null);
          setPermissionKeys([]);
          return;
        }

        setUser(nextUser);

        if (nextUser.role === "admin") {
          setPermissionKeys([
            ADMIN_PERMISSION_KEY,
          ]);
          return;
        }

        try {
          const effectivePermissions =
            await permissionRepository.getEffectivePermissions(
              nextUser.id,
            );

          setPermissionKeys(
            Array.isArray(effectivePermissions.permissionKeys)
              ? effectivePermissions.permissionKeys
              : [],
          );
        } catch (permissionError) {
          console.error(
            "Berechtigungen konnten nicht geladen werden:",
            permissionError,
          );

          setPermissionKeys([]);
        }
      } catch (userError) {
        console.error(
          "Benutzer konnte nicht geladen werden:",
          userError,
        );

        const fallbackUser =
          getCachedCurrentUser();

        if (fallbackUser?.id) {
          setUser(fallbackUser);

          if (fallbackUser.role === "admin") {
            setPermissionKeys([
              ADMIN_PERMISSION_KEY,
            ]);
          }

          return;
        }

        setUser(null);
        setPermissionKeys([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void reload();

    function handlePermissionsUpdated() {
      void reload({
        forcePermissions: true,
      });
    }

    function handleCurrentUserUpdated() {
      void reload({
        forcePermissions: true,
      });
    }

    window.addEventListener(
      "permissionsUpdated",
      handlePermissionsUpdated,
    );

    window.addEventListener(
      "currentUserUpdated",
      handleCurrentUserUpdated,
    );

    return () => {
      window.removeEventListener(
        "permissionsUpdated",
        handlePermissionsUpdated,
      );

      window.removeEventListener(
        "currentUserUpdated",
        handleCurrentUserUpdated,
      );
    };
  }, [
    reload,
  ]);

  const isAdmin = user?.role === "admin";
  const isDepartmentLead = user?.role === "department_lead";
  const isEmployee = user?.role === "employee";

  const hasPermission = useMemo(
    () =>
      function checkPermission(
        permissionKey: string,
        _context?: PermissionCheckContext,
      ) {
        if (isAdmin) {
          return true;
        }

        return hasDirectPermission(
          permissionKeys,
          permissionKey,
        );
      },
    [
      isAdmin,
      permissionKeys,
    ],
  );

  const hasAnyPermission = useMemo(
    () =>
      function checkAnyPermission(
        keys: string[],
        context?: PermissionCheckContext,
      ) {
        if (isAdmin) {
          return true;
        }

        return keys.some((key) =>
          hasPermission(
            key,
            context,
          ),
        );
      },
    [
      isAdmin,
      hasPermission,
    ],
  );

  const hasAllPermissions = useMemo(
    () =>
      function checkAllPermissions(
        keys: string[],
        context?: PermissionCheckContext,
      ) {
        if (isAdmin) {
          return true;
        }

        return keys.every((key) =>
          hasPermission(
            key,
            context,
          ),
        );
      },
    [
      isAdmin,
      hasPermission,
    ],
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
