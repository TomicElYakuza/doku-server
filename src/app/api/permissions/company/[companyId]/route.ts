import { NextResponse } from "next/server";

import {
  listCompanyPermissionKeys,
  saveCompanyPermissionKeys,
} from "../../../../../lib/database/permissionStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

type SaveCompanyPermissionsBody = {
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

    const { companyId } = await context.params;
    const permissionKeys = await listCompanyPermissionKeys(
      decodeURIComponent(companyId),
    );

    return NextResponse.json(permissionKeys);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Firmenberechtigungen konnten nicht geladen werden.",
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

    const { companyId } = await context.params;
    const body = (await request.json()) as SaveCompanyPermissionsBody;
    const permissionKeys = Array.isArray(body.permissionKeys)
      ? body.permissionKeys
      : [];

    await saveCompanyPermissionKeys(
      decodeURIComponent(companyId),
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
          "Firmenberechtigungen konnten nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}