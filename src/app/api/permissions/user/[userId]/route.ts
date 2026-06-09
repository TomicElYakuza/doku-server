import { NextResponse } from "next/server";

import {
  listUserPermissions,
  saveUserPermissions,
} from "../../../../../lib/database/permissionStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type { PermissionScopeType } from "../../../../../types/permission";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type SaveUserPermissionsBody = {
  permissions?: Array<{
    permissionKey?: string;
    scopeType?: string;
    scopeId?: string;
  }>;
};

function normalizeScopeType(value: unknown): PermissionScopeType {
  if (
    value === "global" ||
    value === "company" ||
    value === "department" ||
    value === "own"
  ) {
    return value;
  }

  return "global";
}

function normalizeUserPermissions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .map((permission) => {
      const rawPermission = permission as {
        permissionKey?: string;
        scopeType?: string;
        scopeId?: string;
      };

      const permissionKey = String(rawPermission.permissionKey || "").trim();
      const scopeType = normalizeScopeType(rawPermission.scopeType);
      const scopeId = String(rawPermission.scopeId || "").trim();

      return {
        permissionKey,
        scopeType,
        scopeId,
      };
    })
    .filter((permission) => {
      if (!permission.permissionKey) {
        return false;
      }

      const key = [
        permission.permissionKey,
        permission.scopeType,
        permission.scopeId,
      ].join("::");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
      "settings.manage",
      "admin.view",
    ]);

    const { userId } = await context.params;
    const decodedUserId = decodeURIComponent(userId);

    if (!decodedUserId) {
      return NextResponse.json(
        {
          message: "Benutzer ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const permissions = await listUserPermissions(decodedUserId);

    return NextResponse.json(permissions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzerberechtigungen konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
      "settings.manage",
    ]);

    const { userId } = await context.params;
    const decodedUserId = decodeURIComponent(userId);

    if (!decodedUserId) {
      return NextResponse.json(
        {
          message: "Benutzer ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const body = (await request.json()) as SaveUserPermissionsBody;
    const permissions = normalizeUserPermissions(body.permissions);

    await saveUserPermissions(decodedUserId, permissions);

    return NextResponse.json({
      ok: true,
      permissions,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzerberechtigungen konnten nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}