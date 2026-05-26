import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../../lib/database/db";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type OpenedRow = {
  news_id: number | string;
};

type MarkOpenedBody = {
  id?: string;
  all?: boolean;
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

export async function GET() {
  try {
    await requireAnyServerPermission([
      "news.view",
      "news.manage",
    ]);

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

    const rows =
      await query<OpenedRow>(
        `
        SELECT
          news_id
        FROM news_opened
        WHERE user_email = $1
        `,
        [
          currentUser.email.toLowerCase(),
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
          getErrorMessage(
            error,
            "Gelesene News konnten nicht geladen werden."
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
    await requireAnyServerPermission([
      "news.view",
      "news.manage",
    ]);

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
      await request.json() as MarkOpenedBody;

    const userEmail =
      currentUser.email.toLowerCase();

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
          getErrorMessage(
            error,
            "News konnte nicht als gelesen markiert werden."
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