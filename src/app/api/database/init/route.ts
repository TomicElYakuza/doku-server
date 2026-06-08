import { NextResponse } from "next/server";

import { ensureSystemDatabaseSchema } from "../../../../lib/database/systemSchemaStore";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

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

export async function POST() {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "organization.manage",
      "users.manage_permissions",
    ]);

    const currentUser = await getCurrentServerUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen die Datenbankinitialisierung ausführen.",
        },
        {
          status: 403,
        },
      );
    }

    await ensureSystemDatabaseSchema();

    return NextResponse.json({
      ok: true,
      message: "Datenbank wurde initialisiert und bereinigt.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Datenbank konnte nicht initialisiert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}