import { NextResponse } from "next/server";

import {
  listUserPermissions,
  saveUserPermissions,
} from "../../../../../lib/database/permissionStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

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

  return error instanceof Error ? error.message : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
      "admin.view",
    ]);

    const { userId } = await context.params;
    const permissions = await listUserPermissions(decodeURIComponent(userId));

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
    await requireAnyServerPermission(["users.manage_permissions"]);

    const { userId } = await context.params;
    const body = (await request.json()) as SaveUserPermissionsBody;
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    await saveUserPermissions(decodeURIComponent(userId), permissions);

    return NextResponse.json({
      ok: true,
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