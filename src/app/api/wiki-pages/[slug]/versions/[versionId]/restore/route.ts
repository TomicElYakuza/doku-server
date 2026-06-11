import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../../../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    slug: string;
    versionId: string;
  }>;
};

type WikiPageRow = {
  slug: string;
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
};

type WikiVersionRow = WikiPageRow & {
  id: string;
  wiki_slug: string;
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
}

async function saveCurrentAsVersion(current: WikiPageRow) {
  await ensureWikiVersionTable();

  await query(
    `
      INSERT INTO wiki_versions (
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
        pinned
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      current.slug,
      current.title || "",
      current.description || "",
      current.company || "Intern",
      current.category || "",
      current.department || "",
      current.content || "",
      Array.isArray(current.tags) ? current.tags : [],
      current.status || "published",
      current.visibility || "company",
      Boolean(current.pinned),
    ],
  );
}

export async function POST(
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
      versionId,
    } = await context.params;

    const decodedSlug =
      decodeURIComponent(slug);

    const current = await queryOne<WikiPageRow>(
      `
        SELECT
          slug,
          title,
          description,
          company,
          category,
          department,
          content,
          tags,
          status,
          visibility,
          pinned
        FROM wiki_pages
        WHERE slug = $1
        LIMIT 1
      `,
      [
        decodedSlug,
      ],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Wiki-Seite wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const version = await queryOne<WikiVersionRow>(
      `
        SELECT
          id,
          wiki_slug,
          wiki_slug AS slug,
          title,
          description,
          company,
          category,
          department,
          content,
          tags,
          status,
          visibility,
          pinned
        FROM wiki_versions
        WHERE id = $1
          AND wiki_slug = $2
        LIMIT 1
      `,
      [
        versionId,
        decodedSlug,
      ],
    );

    if (!version) {
      return NextResponse.json(
        {
          message: "Wiki-Version wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    await saveCurrentAsVersion(current);

    await query(
      `
        UPDATE wiki_pages
        SET
          title = $1,
          description = $2,
          excerpt = $3,
          company = $4,
          category = $5,
          department = $6,
          content = $7,
          tags = $8,
          status = $9,
          visibility = $10,
          pinned = $11,
          updated_at = NOW()
        WHERE slug = $12
      `,
      [
        version.title || "",
        version.description || "",
        version.description || "",
        version.company || "Intern",
        version.category || "",
        version.department || "",
        version.content || "",
        Array.isArray(version.tags) ? version.tags : [],
        version.status || "published",
        version.visibility || "company",
        Boolean(version.pinned),
        decodedSlug,
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
          "Wiki-Version konnte nicht wiederhergestellt werden.",
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