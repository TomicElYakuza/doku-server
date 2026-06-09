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

function normalizePermissionKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((permissionKey) => String(permissionKey || "").trim())
        .filter(Boolean),
    ),
  );
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

    const { companyId } = await context.params;
    const decodedCompanyId = decodeURIComponent(companyId);

    if (!decodedCompanyId) {
      return NextResponse.json(
        {
          message: "Firma ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const permissionKeys = await listCompanyPermissionKeys(decodedCompanyId);

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
    await requireAnyServerPermission([
      "users.manage_permissions",
      "settings.manage",
    ]);

    const { companyId } = await context.params;
    const decodedCompanyId = decodeURIComponent(companyId);

    if (!decodedCompanyId) {
      return NextResponse.json(
        {
          message: "Firma ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const body = (await request.json()) as SaveCompanyPermissionsBody;
    const permissionKeys = normalizePermissionKeys(body.permissionKeys);

    await saveCompanyPermissionKeys(decodedCompanyId, permissionKeys);

    return NextResponse.json({
      ok: true,
      permissionKeys,
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