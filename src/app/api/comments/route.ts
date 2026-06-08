import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  mapCommentRow,
  type CommentRow,
} from "../../../lib/database/mappers/commentMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type CreateCommentBody = {
  entityType?: string;
  entityId?: string;
  author?: string;
  content?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeEntityType(value?: string | null) {
  const entityType = normalizeText(value).toLowerCase();

  if (
    entityType === "ticket" ||
    entityType === "wiki" ||
    entityType === "news"
  ) {
    return entityType;
  }

  return "";
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

function getViewPermissionsForEntity(entityType?: string) {
  if (entityType === "ticket") {
    return ["tickets.view", "tickets.edit", "tickets.delete", "admin.view"];
  }

  if (entityType === "wiki") {
    return ["wiki.view", "wiki.edit", "wiki.delete", "admin.view"];
  }

  if (entityType === "news") {
    return ["news.view", "news.edit", "news.delete", "admin.view"];
  }

  return [
    "tickets.view",
    "wiki.view",
    "news.view",
    "activity.view",
    "admin.view",
    "settings.manage",
  ];
}

function getCreatePermissionsForEntity(entityType?: string) {
  if (entityType === "ticket") {
    return ["tickets.edit", "tickets.close", "settings.manage"];
  }

  if (entityType === "wiki") {
    return ["wiki.edit", "settings.manage"];
  }

  if (entityType === "news") {
    return ["news.edit", "settings.manage"];
  }

  return ["settings.manage", "admin.view"];
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const rawEntityType = url.searchParams.get("entityType");
    const entityType = rawEntityType ? normalizeEntityType(rawEntityType) : "";
    const entityId = normalizeText(url.searchParams.get("entityId"));

    if (rawEntityType && !entityType) {
      return NextResponse.json(
        {
          message: "Entity-Type ist ungültig.",
        },
        {
          status: 400,
        },
      );
    }

    await requireAnyServerPermission(getViewPermissionsForEntity(entityType));

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (entityType) {
      params.push(entityType);
      whereParts.push(`entity_type = $${params.length}`);
    }

    if (entityId) {
      params.push(entityId);
      whereParts.push(`entity_id = $${params.length}`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<CommentRow>(
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
      params,
    );

    return NextResponse.json(rows.map(mapCommentRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Kommentare konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as CreateCommentBody;

    const entityType = normalizeEntityType(body.entityType);
    const entityId = normalizeText(body.entityId);
    const content = normalizeText(body.content);
    const author = normalizeText(body.author) || currentUser.name || "Unbekannt";

    if (!entityType) {
      return NextResponse.json(
        {
          message: "Entity-Type ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!entityId) {
      return NextResponse.json(
        {
          message: "Entity-ID ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          message: "Kommentar ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    await requireAnyServerPermission(getCreatePermissionsForEntity(entityType));

    const row = await queryOne<CommentRow>(
      `
        INSERT INTO comments (
          entity_type,
          entity_id,
          author,
          content
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          entity_type,
          entity_id,
          author,
          content,
          created_at
      `,
      [entityType, entityId, author, content],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Kommentar konnte nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapCommentRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Kommentar konnte nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}