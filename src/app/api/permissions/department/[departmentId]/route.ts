import { NextResponse } from "next/server";

import {
  listDepartmentPermissionKeys,
  saveDepartmentPermissionKeys,
} from "../../../../../lib/database/permissionStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    departmentId: string;
  }>;
};

type SaveDepartmentPermissionsBody = {
  permissionKeys?: string[];
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

    const { departmentId } = await context.params;
    const permissionKeys = await listDepartmentPermissionKeys(
      decodeURIComponent(departmentId),
    );

    return NextResponse.json(permissionKeys);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Abteilungsberechtigungen konnten nicht geladen werden.",
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

    const { departmentId } = await context.params;
    const body = (await request.json()) as SaveDepartmentPermissionsBody;
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys
      : [];

    await saveDepartmentPermissionKeys(
      decodeURIComponent(departmentId),
      permissionKeys,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Abteilungsberechtigungen konnten nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}