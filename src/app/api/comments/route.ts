import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  mapCommentRow,
} from "../../../lib/database/mappers/commentMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

import type {
  CommentRow,
} from "../../../lib/database/mappers/commentMapper";

type CreateCommentBody = {
  entityType?: string;
  entityId?: string;
  author?: string;
  content?: string;
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

function getViewPermissionsForEntity(
  entityType?: string
) {
  if (entityType === "ticket") {
    return [
      "tickets.view",
      "tickets.manage",
    ];
  }

  if (entityType === "wiki") {
    return [
      "wiki.view",
      "wiki.manage",
    ];
  }

  if (entityType === "news") {
    return [
      "news.view",
      "news.manage",
    ];
  }

  return [
    "tickets.view",
    "tickets.manage",
    "wiki.view",
    "wiki.manage",
    "news.view",
    "news.manage",
    "activity.view",
    "activity.manage",
  ];
}

function getCreatePermissionsForEntity(
  entityType?: string
) {
  if (entityType === "ticket") {
    return [
      "tickets.edit",
      "tickets.manage",
    ];
  }

  if (entityType === "wiki") {
    return [
      "wiki.edit",
      "wiki.manage",
    ];
  }

  if (entityType === "news") {
    return [
      "news.edit",
      "news.manage",
    ];
  }

  return [
    "tickets.edit",
    "tickets.manage",
    "wiki.edit",
    "wiki.manage",
    "news.edit",
    "news.manage",
  ];
}

export async function GET(
  request: Request
) {
  try {
    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const entityType =
      url.searchParams.get(
        "entityType"
      ) ||
      "";

    const entityId =
      url.searchParams.get(
        "entityId"
      );

    await requireAnyServerPermission(
      getViewPermissionsForEntity(
        entityType
      )
    );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (entityType) {
      params.push(
        entityType
      );

      whereParts.push(
        `entity_type = $${params.length}`
      );
    }

    if (entityId) {
      params.push(
        entityId
      );

      whereParts.push(
        `entity_id = $${params.length}`
      );
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<CommentRow>(
        `
        SELECT
          id,
          entity_type,
          entity_id,
          author,
          content,
          created_at
        FROM comments
        ${whereSql}
        ORDER BY created_at DESC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapCommentRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Kommentare konnten nicht geladen werden."
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

export async function POST(
  request: Request
) {
  try {
    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const body =
      await request.json() as CreateCommentBody;

    if (!body.entityType) {
      return NextResponse.json(
        {
          message:
            "Entity-Type ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!body.entityId) {
      return NextResponse.json(
        {
          message:
            "Entity-ID ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        {
          message:
            "Kommentar ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    await requireAnyServerPermission(
      getCreatePermissionsForEntity(
        body.entityType
      )
    );

    const row =
      await queryOne<CommentRow>(
        `
        INSERT INTO comments (
          entity_type,
          entity_id,
          author,
          content
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING
          id,
          entity_type,
          entity_id,
          author,
          content,
          created_at
        `,
        [
          body.entityType,
          body.entityId,
          body.author ||
            currentUser.name ||
            "Unbekannt",
          body.content.trim(),
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Kommentar konnte nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapCommentRow(
        row
      ),
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Kommentar konnte nicht gespeichert werden."
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
