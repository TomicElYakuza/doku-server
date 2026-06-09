import { NextResponse } from "next/server";

import { listPermissions } from "../../../lib/database/permissionStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

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

export async function GET() {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
      "settings.manage",
      "admin.view",
    ]);

    const permissions = await listPermissions();

    return NextResponse.json(permissions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Berechtigungen konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}