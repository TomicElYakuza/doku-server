import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  mapNewsRow,
} from "../../../lib/database/mappers/newsMapper";

import type {
  NewsRow,
} from "../../../lib/database/mappers/newsMapper";

type CreateNewsBody = {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const category =
      url.searchParams.get(
        "category"
      );

    const pinned =
      url.searchParams.get(
        "pinned"
      );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (category) {
      params.push(
        category
      );

      whereParts.push(
        `category = $${params.length}`
      );
    }

    if (pinned === "true") {
      whereParts.push(
        "pinned = TRUE"
      );
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<NewsRow>(
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
        ${whereSql}
        ORDER BY pinned DESC, created_at DESC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapNewsRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "News konnten nicht geladen werden.",

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
      await request.json() as CreateNewsBody;

    const title =
      body.title?.trim();

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Titel ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const row =
      await queryOne<NewsRow>(
        `
        INSERT INTO news_posts (
          title,
          description,
          content,
          category,
          author,
          pinned
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
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
          title,
          body.description?.trim() ||
            "",
          body.content?.trim() ||
            "",
          body.category ||
            "Allgemein",
          body.author ||
            "Unbekannt",
          Boolean(
            body.pinned
          ),
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News konnte nicht erstellt werden.",
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
          "News konnte nicht erstellt werden.",

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