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

type NewsRow = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type UpdateNewsBody = {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

function mapNewsRow(
  row: NewsRow
) {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description,

    content:
      row.content,

    category:
      row.category,

    author:
      row.author,

    pinned:
      row.pinned,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

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

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "news.view",
      "news.manage",
      "news.create",
      "news.edit",
      "news.delete",
    ]);

    const {
      id,
    } =
      await context.params;

    const row =
      await queryOne<NewsRow>(
        `
        SELECT
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
        FROM news_posts
        WHERE id = $1
        LIMIT 1
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapNewsRow(
        row
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
            "News konnte nicht geladen werden."
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "news.edit",
      "news.manage",
    ]);

    const {
      id,
    } =
      await context.params;

    const existingRow =
      await queryOne<NewsRow>(
        `
        SELECT
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
        FROM news_posts
        WHERE id = $1
        LIMIT 1
        `,
        [
          id,
        ]
      );

    if (!existingRow) {
      return NextResponse.json(
        {
          message:
            "News nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const body =
      await request.json() as UpdateNewsBody;

    const row =
      await queryOne<NewsRow>(
        `
        UPDATE news_posts
        SET
          title = $1,
          description = $2,
          content = $3,
          category = $4,
          author = $5,
          pinned = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
        `,
        [
          body.title?.trim() ||
            existingRow.title,
          body.description !== undefined
            ? body.description.trim()
            : existingRow.description,
          body.content !== undefined
            ? body.content.trim()
            : existingRow.content,
          body.category?.trim() ||
            existingRow.category ||
            "Allgemein",
          body.author?.trim() ||
            existingRow.author ||
            "System",
          typeof body.pinned === "boolean"
            ? body.pinned
            : existingRow.pinned,
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News konnte nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapNewsRow(
        row
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
            "News konnte nicht gespeichert werden."
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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "news.delete",
      "news.manage",
    ]);

    const {
      id,
    } =
      await context.params;

    const row =
      await queryOne<{
        id: string;
      }>(
        `
        DELETE FROM news_posts
        WHERE id = $1
        RETURNING id
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

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
            "News konnte nicht gelöscht werden."
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