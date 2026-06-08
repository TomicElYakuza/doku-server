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

type CommentEntityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
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

function getDeletePermissionsForEntity(entityType?: string) {
  if (entityType === "ticket") {
    return [
      "tickets.edit",
      "tickets.close",
      "tickets.delete",
      "settings.manage",
    ];
  }

  if (entityType === "wiki") {
    return ["wiki.edit", "wiki.delete", "settings.manage"];
  }

  if (entityType === "news") {
    return ["news.edit", "news.delete", "settings.manage"];
  }

  return ["settings.manage"];
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

    const { id } = await context.params;
    const decodedId = normalizeText(decodeURIComponent(id));

    if (!decodedId) {
      return NextResponse.json(
        {
          message: "Kommentar-ID ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const current = await queryOne<CommentEntityRow>(
      `
        SELECT
          id,
          entity_type,
          entity_id
        FROM comments
        WHERE id = $1
        LIMIT 1
      `,
      [decodedId],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Kommentar nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    await requireAnyServerPermission(
      getDeletePermissionsForEntity(current.entity_type),
    );

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM comments
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Kommentar nicht gefunden.",
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
          "Kommentar konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}