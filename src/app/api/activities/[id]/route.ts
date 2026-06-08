import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    id: string;
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
      "activity.view",
      "settings.manage",
      "admin.view",
    ]);

    const { id } = await context.params;
    const decodedId = normalizeText(decodeURIComponent(id));

    if (!decodedId) {
      return NextResponse.json(
        {
          message: "Aktivitäts-ID ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<{ id: string }>(
      `
        DELETE FROM activities
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Aktivität nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Aktivität konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}