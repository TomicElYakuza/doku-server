import { NextResponse } from "next/server";

import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : "Unbekannter Fehler";
}

async function requirePermissionAccess() {
  await requireAnyServerPermission([
    "users.manage_permissions",
    "organization.manage",
    "settings.manage",
    "admin.view",
  ]);
}

export async function GET() {
  try {
    await requirePermissionAccess();

    return NextResponse.json(
      {
        message: "Bitte /api/permissions/company/[companyId] verwenden.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error),
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PUT() {
  try {
    await requirePermissionAccess();

    return NextResponse.json(
      {
        message: "Bitte /api/permissions/company/[companyId] verwenden.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error),
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}