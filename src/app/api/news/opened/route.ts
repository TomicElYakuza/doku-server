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
  id?: string | number;
  all?: boolean;
};

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

function normalizeNewsId(value: unknown) {
  const normalized =
    String(value || "").trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function ensureNewsOpenedTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS news_opened (
      news_id BIGINT NOT NULL,
      user_email TEXT NOT NULL,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (news_id, user_email)
    )
  `);

  await query(`
    ALTER TABLE news_opened
    DROP CONSTRAINT IF EXISTS news_opened_news_id_fkey
  `);

  await query(`
    ALTER TABLE news_opened
    ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    DELETE FROM news_opened
    WHERE news_id::TEXT !~ '^[0-9]+$'
  `);

  await query(`
    ALTER TABLE news_opened
    ALTER COLUMN news_id TYPE BIGINT
    USING news_id::TEXT::BIGINT
  `);

  await query(`
    ALTER TABLE news_opened
    ALTER COLUMN user_email TYPE TEXT
    USING user_email::TEXT
  `);

  await query(`
    ALTER TABLE news_opened
    ALTER COLUMN opened_at SET DEFAULT NOW()
  `);
}

export async function GET() {
  try {
    const currentUser =
      await getCurrentServerUser();

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

    await requireAnyServerPermission([
      "news.view",
      "admin.view",
    ]);

    await ensureNewsOpenedTable();

    const rows = await query(
      `
        SELECT news_id
        FROM news_opened
        WHERE LOWER(user_email) = LOWER($1)
      `,
      [
        currentUser.email,
      ],
    );

    return NextResponse.json({
      openedIds: (rows as OpenedRow[]).map((row) =>
        String(row.news_id),
      ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Gelesene News konnten nicht geladen werden.",
        ),
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser =
      await getCurrentServerUser();

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

    await requireAnyServerPermission([
      "news.view",
      "admin.view",
    ]);

    await ensureNewsOpenedTable();

    const body =
      (await request.json()) as MarkOpenedBody;

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
          DO UPDATE SET
            opened_at = NOW()
        `,
        [
          userEmail,
        ],
      );

      return NextResponse.json({
        ok: true,
      });
    }

    const newsId =
      normalizeNewsId(body.id);

    if (!newsId) {
      return NextResponse.json(
        {
          message: "News-ID ist ungültig.",
        },
        {
          status: 400,
        },
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
        DO UPDATE SET
          opened_at = NOW()
      `,
      [
        newsId,
        userEmail,
      ],
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "News konnte nicht als gelesen markiert werden.",
        ),
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}