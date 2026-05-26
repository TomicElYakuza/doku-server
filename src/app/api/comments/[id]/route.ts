import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
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

function getErrorStatus(
  error: unknown
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

function getDeletePermissionsForEntity(
  entityType?: string
) {
  if (entityType === "ticket") {
    return [
      "tickets.edit",
      "tickets.delete",
      "tickets.manage",
    ];
  }

  if (entityType === "wiki") {
    return [
      "wiki.edit",
      "wiki.delete",
      "wiki.manage",
    ];
  }

  if (entityType === "news") {
    return [
      "news.edit",
      "news.delete",
      "news.manage",
    ];
  }

  return [
    "tickets.manage",
    "wiki.manage",
    "news.manage",
  ];
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const current =
      await queryOne<CommentEntityRow>(
        `
        SELECT
          id,
          entity_type,
          entity_id
        FROM comments
        WHERE id = $1
        LIMIT 1
        `,
        [
          id,
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Kommentar nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    await requireAnyServerPermission(
      getDeletePermissionsForEntity(
        current.entity_type
      )
    );

    await queryOne(
      `
      DELETE FROM comments
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
      ]
    );

    return NextResponse.json({
      ok:
        true,
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Kommentar konnte nicht gelöscht werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}