import { NextResponse } from "next/server";

import { query } from "../../../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
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

  return error instanceof Error ? error.message : fallback;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    await requireAnyServerPermission([
      "files.delete",
      "settings.manage",
      "admin.view",
    ]);

    const { key } = await context.params;
    const decodedKey = normalizeText(decodeURIComponent(key));

    if (!decodedKey) {
      return NextResponse.json(
        {
          message: "Storage-Key ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const deletedRows = await query<{ id: string }>(
      `
        DELETE FROM files
        WHERE storage_key = $1
        RETURNING id
      `,
      [decodedKey],
    );

    return NextResponse.json({
      ok: true,
      deleted: deletedRows.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Dateien konnten nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}