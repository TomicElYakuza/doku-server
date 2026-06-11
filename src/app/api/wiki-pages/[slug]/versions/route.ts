import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type {
  WikiStatus,
  WikiVersion,
  WikiVisibility,
} from "../../../../../types/wiki";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type WikiVersionRow = {
  id: string;
  wiki_slug: string;
  title: string;
  description: string | null;
  company: string | null;
  category: string | null;
  department: string | null;
  content: string | null;
  tags: string[] | null;
  status: string | null;
  visibility: string | null;
  pinned: boolean | null;
  created_at: string;
};

function normalizeText(value: string | null) {
  return String(value || "").trim();
}

function normalizeTags(tags: string[] | null) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

function normalizeStatus(value: string | null): WikiStatus {
  if (
    value === "draft" ||
    value === "published" ||
    value === "archived"
  ) {
    return value;
  }

  return "published";
}

function normalizeVisibility(value: string | null): WikiVisibility {
  if (
    value === "global" ||
    value === "company" ||
    value === "department"
  ) {
    return value;
  }

  return "company";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function mapWikiVersionRow(row: WikiVersionRow): WikiVersion {
  return {
    id: row.id,
    wikiSlug: row.wiki_slug,
    title: row.title,
    description: normalizeText(row.description),
    company: normalizeText(row.company) || "Intern",
    category: normalizeText(row.category),
    department: normalizeText(row.department),
    content: row.content || "",
    tags: normalizeTags(row.tags),
    status: normalizeStatus(row.status),
    visibility: normalizeVisibility(row.visibility),
    pinned: Boolean(row.pinned),
    createdAt: formatDate(row.created_at),
  };
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

async function ensureWikiVersionTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS wiki_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wiki_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT 'Intern',
      category TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      status TEXT NOT NULL DEFAULT 'published',
      visibility TEXT NOT NULL DEFAULT 'company',
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE wiki_versions
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
  `);

  await query(`
    ALTER TABLE wiki_versions
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  `);

  await query(`
    ALTER TABLE wiki_versions
    ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'company'
  `);

  await query(`
    ALTER TABLE wiki_versions
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE
  `);
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "wiki.edit",
      "wiki.manage",
      "admin.view",
    ]);

    await ensureWikiVersionTable();

    const {
      slug,
    } = await context.params;

    const decodedSlug =
      decodeURIComponent(slug);

    const pageExists = await queryOne<{ slug: string }>(
      `
        SELECT slug
        FROM wiki_pages
        WHERE slug = $1
        LIMIT 1
      `,
      [
        decodedSlug,
      ],
    );

    if (!pageExists) {
      return NextResponse.json(
        {
          message: "Wiki-Seite wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const rows = await query<WikiVersionRow>(
      `
        SELECT
          id,
          wiki_slug,
          title,
          description,
          company,
          category,
          department,
          content,
          tags,
          status,
          visibility,
          pinned,
          created_at
        FROM wiki_versions
        WHERE wiki_slug = $1
        ORDER BY created_at DESC
      `,
      [
        decodedSlug,
      ],
    );

    return NextResponse.json(
      rows.map(mapWikiVersionRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Wiki-Versionen konnten nicht geladen werden.",
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