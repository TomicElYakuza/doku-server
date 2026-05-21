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

import type {
  CommentRow,
} from "../../../lib/database/mappers/commentMapper";

type CreateCommentBody = {
  entityType?: string;
  entityId?: string;
  author?: string;
  content?: string;
};

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const entityType =
      url.searchParams.get(
        "entityType"
      );

    const entityId =
      url.searchParams.get(
        "entityId"
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
          "Kommentare konnten nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
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
          "Kommentar konnte nicht gespeichert werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}