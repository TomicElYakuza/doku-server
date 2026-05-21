import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapNewsRow,
} from "../../../../lib/database/mappers/newsMapper";

import type {
  NewsRow,
} from "../../../../lib/database/mappers/newsMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateNewsBody = {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
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
          created_at
        FROM news_posts
        WHERE id = $1
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
          "News konnte nicht geladen werden.",

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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const body =
      await request.json() as UpdateNewsBody;

    const current =
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
          created_at
        FROM news_posts
        WHERE id = $1
        `,
        [
          id,
        ]
      );

    if (!current) {
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
          pinned = $6
        WHERE id = $7
        RETURNING
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at
        `,
        [
          body.title?.trim() ||
            current.title,
          body.description !== undefined
            ? body.description.trim()
            : current.description ||
              "",
          body.content !== undefined
            ? body.content.trim()
            : current.content ||
              "",
          body.category ||
            current.category,
          body.author ||
            current.author ||
            "Unbekannt",
          body.pinned !== undefined
            ? Boolean(
                body.pinned
              )
            : Boolean(
                current.pinned
              ),
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News konnte nicht aktualisiert werden.",
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
          "News konnte nicht aktualisiert werden.",

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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    await queryOne(
      `
      DELETE FROM news_posts
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
          "News konnte nicht gelöscht werden.",

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