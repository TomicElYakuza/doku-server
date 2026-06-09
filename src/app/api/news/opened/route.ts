import { NextResponse } from "next/server";

import { query, queryOne } from "../../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type OpenedNewsRow = {
  post_id: string;
};

type OpenedNewsBody = {
  id?: string;
  all?: boolean;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
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

async function ensureNewsOpenedTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS news_opened (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      post_id TEXT NOT NULL,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    )
  `);
}

function createOpenedId(userId: string, postId: string) {
  return `news_opened_${userId}_${postId}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function GET() {
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

    await requireAnyServerPermission([
      "news.view",
      "news.create",
      "news.edit",
      "news.delete",
      "admin.view",
    ]);

    await ensureNewsOpenedTable();

    const rows = await query<OpenedNewsRow>(
      `
        SELECT post_id
        FROM news_opened
        WHERE user_id = $1
        ORDER BY opened_at DESC
      `,
      [currentUser.id],
    );

    return NextResponse.json({
      openedIds: rows.map((row) => String(row.post_id)),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Geöffnete News konnten nicht geladen werden.",
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

    await requireAnyServerPermission([
      "news.view",
      "news.create",
      "news.edit",
      "news.delete",
      "admin.view",
    ]);

    await ensureNewsOpenedTable();

    const body = (await request.json()) as OpenedNewsBody;

    if (body.all) {
      const posts = await query<{ id: string }>(`
        SELECT id::TEXT AS id
        FROM news_posts
      `);

      for (const post of posts) {
        const postId = String(post.id);

        await query(
          `
            INSERT INTO news_opened (
              id,
              user_id,
              post_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, post_id) DO UPDATE SET
              opened_at = NOW()
          `,
          [
            createOpenedId(currentUser.id, postId),
            currentUser.id,
            postId,
          ],
        );
      }

      return NextResponse.json({
        ok: true,
      });
    }

    const postId = normalizeText(body.id);

    if (!postId) {
      return NextResponse.json(
        {
          message: "News-ID fehlt.",
        },
        {
          status: 400,
        },
      );
    }

    const exists = await queryOne<{ id: string }>(
      `
        SELECT id::TEXT AS id
        FROM news_posts
        WHERE id::TEXT = $1
        LIMIT 1
      `,
      [postId],
    );

    if (!exists) {
      return NextResponse.json(
        {
          message: "News wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    await query(
      `
        INSERT INTO news_opened (
          id,
          user_id,
          post_id
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, post_id) DO UPDATE SET
          opened_at = NOW()
      `,
      [
        createOpenedId(currentUser.id, postId),
        currentUser.id,
        postId,
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
          "News konnte nicht als geöffnet markiert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}