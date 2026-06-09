import { NextResponse } from "next/server";

import { query, queryOne } from "../../../../lib/database/db";
import {
  mapNewsPostRow,
  type NewsPostRow,
} from "../../../../lib/database/mappers/newsMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateNewsPostBody = {
  title?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
  publishedAt?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizePublishedAt(value: unknown, fallback: string | Date | null) {
  const normalized = normalizeText(value as string | null);

  if (!normalized) {
    if (fallback instanceof Date) {
      return fallback.toISOString();
    }

    return fallback ? String(fallback) : new Date().toISOString();
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    if (fallback instanceof Date) {
      return fallback.toISOString();
    }

    return fallback ? String(fallback) : new Date().toISOString();
  }

  return date.toISOString();
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

async function ensureNewsPostsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS news_posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE news_posts
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    UPDATE news_posts
    SET
      description = COALESCE(NULLIF(description, ''), ''),
      content = COALESCE(content, ''),
      category = COALESCE(category, ''),
      author = COALESCE(NULLIF(author, ''), 'Velunis'),
      pinned = COALESCE(pinned, FALSE),
      published_at = COALESCE(published_at, created_at, NOW()),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW())
  `);
}

async function findNewsPostById(id: string) {
  await ensureNewsPostsTable();

  return queryOne<NewsPostRow>(
    `
      SELECT
        id,
        title,
        description,
        content,
        category,
        author,
        pinned,
        published_at,
        created_at,
        updated_at
      FROM news_posts
      WHERE id::TEXT = $1
      LIMIT 1
    `,
    [id],
  );
}

export async function GET(_request: Request, context: RouteContext) {
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

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const row = await findNewsPostById(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "News wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(mapNewsPostRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "News konnte nicht geladen werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
      "news.edit",
      "news.create",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const current = await findNewsPostById(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "News wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const body = (await request.json()) as UpdateNewsPostBody;

    const nextTitle =
      body.title !== undefined ? normalizeText(body.title) : current.title;

    const nextDescription =
      body.description !== undefined || body.excerpt !== undefined
        ? normalizeText(body.description || body.excerpt)
        : current.description || "";

    const nextContent =
      body.content !== undefined
        ? normalizeText(body.content)
        : current.content || "";

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : current.category || "";

    const nextAuthor =
      body.author !== undefined
        ? normalizeText(body.author)
        : current.author || currentUser.name || "Velunis";

    const nextPinned = normalizeBoolean(body.pinned, Boolean(current.pinned));

    const nextPublishedAt =
      body.publishedAt !== undefined
        ? normalizePublishedAt(body.publishedAt, current.published_at)
        : current.published_at;

    if (!nextTitle) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextDescription) {
      return NextResponse.json(
        {
          message: "Kurzbeschreibung ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextContent) {
      return NextResponse.json(
        {
          message: "Inhalt ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextCategory) {
      return NextResponse.json(
        {
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<NewsPostRow>(
      `
        UPDATE news_posts
        SET
          title = $1,
          description = $2,
          content = $3,
          category = $4,
          author = $5,
          pinned = $6,
          published_at = $7,
          updated_at = NOW()
        WHERE id::TEXT = $8
        RETURNING
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          published_at,
          created_at,
          updated_at
      `,
      [
        nextTitle,
        nextDescription,
        nextContent,
        nextCategory,
        nextAuthor,
        nextPinned,
        nextPublishedAt,
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "News konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapNewsPostRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "News konnte nicht aktualisiert werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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
      "news.delete",
      "news.edit",
      "settings.manage",
    ]);

    await ensureNewsPostsTable();

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM news_posts
        WHERE id::TEXT = $1
        RETURNING id::TEXT AS id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "News wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "News konnte nicht gelöscht werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}