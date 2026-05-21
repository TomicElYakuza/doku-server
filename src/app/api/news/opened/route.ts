import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../../lib/database/db";

type OpenedRow = {
  news_id: number | string;
};

type MarkOpenedBody = {
  id?: string;
  userEmail?: string;
  all?: boolean;
};

function getUserEmail(
  value?: string
) {
  return (
    value?.trim().toLowerCase() ||
    "anonymous"
  );
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const userEmail =
      getUserEmail(
        url.searchParams.get(
          "userEmail"
        ) || ""
      );

    const rows =
      await query<OpenedRow>(
        `
        SELECT
          news_id
        FROM news_opened
        WHERE user_email = $1
        `,
        [
          userEmail,
        ]
      );

    return NextResponse.json(
      rows.map(
        (row) =>
          String(
            row.news_id
          )
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Gelesene News konnten nicht geladen werden.",

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
      await request.json() as MarkOpenedBody;

    const userEmail =
      getUserEmail(
        body.userEmail
      );

    if (body.all) {
      await query(
        `
        INSERT INTO news_opened (
          news_id,
          user_email
        )
        SELECT
          id,
          $1
        FROM news_posts
        ON CONFLICT (
          news_id,
          user_email
        )
        DO NOTHING
        `,
        [
          userEmail,
        ]
      );

      return NextResponse.json({
        ok:
          true,
      });
    }

    if (!body.id) {
      return NextResponse.json(
        {
          message:
            "News-ID ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    await query(
      `
      INSERT INTO news_opened (
        news_id,
        user_email
      )
      VALUES (
        $1,
        $2
      )
      ON CONFLICT (
        news_id,
        user_email
      )
      DO NOTHING
      `,
      [
        body.id,
        userEmail,
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
          "News konnte nicht als gelesen markiert werden.",

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