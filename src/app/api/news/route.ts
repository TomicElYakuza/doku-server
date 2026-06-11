import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapNewsPostRow,
} from "../../../lib/database/mappers/newsMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type CreateNewsPostBody = {
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

function normalizeBoolean(value: unknown) {
  return Boolean(value);
}

function normalizePublishedAt(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return new Date().toISOString();
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
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

export async function GET(request: Request) {
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

    await ensureNewsPostsTable();

    const url = new URL(request.url);
    const category = normalizeText(url.searchParams.get("category"));
    const search = normalizeText(url.searchParams.get("search"));
    const pinnedParam = url.searchParams.get("pinned");

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(
        `(title ILIKE $${params.length} OR description ILIKE $${params.length} OR content ILIKE $${params.length} OR category ILIKE $${params.length} OR author ILIKE $${params.length})`,
      );
    }

    if (pinnedParam === "true" || pinnedParam === "false") {
      params.push(pinnedParam === "true");
      whereParts.push(`pinned = $${params.length}`);
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows = await query(
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
        ${whereSql}
        ORDER BY pinned DESC, published_at DESC, created_at DESC
      `,
      params,
    );

    return NextResponse.json(
      (rows as Parameters<typeof mapNewsPostRow>[0][]).map(mapNewsPostRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "News konnten nicht geladen werden.",
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
      "news.create",
      "news.edit",
      "settings.manage",
    ]);

    await ensureNewsPostsTable();

    const body =
      (await request.json()) as CreateNewsPostBody;

    const title = normalizeText(body.title);
    const description = normalizeText(body.description || body.excerpt);
    const content = normalizeText(body.content);
    const category = normalizeText(body.category);
    const author =
      normalizeText(body.author) || currentUser.name || "Velunis";
    const pinned = normalizeBoolean(body.pinned);
    const publishedAt = normalizePublishedAt(body.publishedAt);

    if (!title) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          message: "Kurzbeschreibung ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          message: "Inhalt ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne(
      `
        INSERT INTO news_posts (
          title,
          description,
          content,
          category,
          author,
          pinned,
          published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        title,
        description,
        content,
        category,
        author,
        pinned,
        publishedAt,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "News konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapNewsPostRow(row as Parameters<typeof mapNewsPostRow>[0]),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "News konnte nicht erstellt werden.",
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
