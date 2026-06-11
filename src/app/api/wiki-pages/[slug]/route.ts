import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../../lib/database/db";
import {
  mapWikiPageRow,
  type WikiPageRow,
} from "../../../../lib/database/mappers/wikiMapper";
import {
  createSlug,
} from "../../../../lib/database/slug";
import {
  getCurrentServerUser,
  hasAnyServerPermission,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  WikiStatus,
  WikiVisibility,
} from "../../../../types/wiki";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type UpdateWikiPageBody = {
  slug?: string;
  title?: string;
  description?: string;
  excerpt?: string;
  company?: string;
  category?: string;
  department?: string;
  author?: string;
  tags?: string[];
  content?: string;
  status?: WikiStatus;
  visibility?: WikiVisibility;
  pinned?: boolean;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

function normalizeStatus(value: unknown): WikiStatus {
  const status =
    String(value || "").trim();

  if (
    status === "draft" ||
    status === "published" ||
    status === "archived"
  ) {
    return status;
  }

  return "published";
}

function normalizeVisibility(
  value: unknown,
  company: string,
  department: string,
): WikiVisibility {
  const visibility =
    String(value || "").trim();

  if (
    visibility === "global" ||
    visibility === "company" ||
    visibility === "department"
  ) {
    return visibility;
  }

  if (department) {
    return "department";
  }

  if (company) {
    return "company";
  }

  return "global";
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

async function ensureWikiProductionColumns() {
  await query(`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  `);

  await query(`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'company'
  `);

  await query(`
    ALTER TABLE wiki_pages
    ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await query(`
    UPDATE wiki_pages
    SET
      status = COALESCE(NULLIF(status, ''), 'published'),
      visibility = CASE
        WHEN visibility IN ('global', 'company', 'department') THEN visibility
        WHEN COALESCE(NULLIF(department, ''), '') <> '' THEN 'department'
        WHEN COALESCE(NULLIF(company, ''), '') <> '' THEN 'company'
        ELSE 'global'
      END,
      pinned = COALESCE(pinned, FALSE)
  `);
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

async function findWikiPage(slug: string) {
  await ensureWikiProductionColumns();

  return queryOne<WikiPageRow>(
    `
      SELECT
        id,
        slug,
        title,
        description,
        excerpt,
        company,
        category,
        department,
        author,
        tags,
        content,
        status,
        visibility,
        pinned,
        created_at,
        updated_at
      FROM wiki_pages
      WHERE slug = $1
      LIMIT 1
    `,
    [
      slug,
    ],
  );
}

async function saveWikiVersion(row: WikiPageRow) {
  await ensureWikiVersionTable();

  await queryOne<{ id: string }>(
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
      RETURNING id
    `,
    [
      row.slug,
      row.title || "",
      row.description || "",
      row.company || "Intern",
      row.category || "",
      row.department || "",
      row.content || "",
      Array.isArray(row.tags) ? row.tags : [],
      normalizeStatus(row.status),
      normalizeVisibility(
        row.visibility,
        row.company || "",
        row.department || "",
      ),
      Boolean(row.pinned),
    ],
  );
}

function canUserSeeWikiPage(
  row: WikiPageRow,
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  canManageWiki: boolean,
) {
  if (canManageWiki) {
    return true;
  }

  if (!currentUser) {
    return false;
  }

  if (normalizeStatus(row.status) !== "published") {
    return false;
  }

  const visibility =
    normalizeVisibility(
      row.visibility,
      row.company || "",
      row.department || "",
    );

  if (visibility === "global") {
    return true;
  }

  if (
    visibility === "company" &&
    normalizeText(row.company) &&
    normalizeText(row.company) === normalizeText(currentUser.company)
  ) {
    return true;
  }

  if (
    visibility === "department" &&
    normalizeText(row.department) &&
    normalizeText(row.department) === normalizeText(currentUser.department)
  ) {
    return true;
  }

  return false;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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
      "wiki.view",
      "wiki.manage",
      "admin.view",
    ]);

    const canManageWiki =
      await hasAnyServerPermission([
        "wiki.manage",
        "admin.view",
      ]);

    const {
      slug,
    } = await context.params;

    const row =
      await findWikiPage(decodeURIComponent(slug));

    if (!row) {
      return NextResponse.json(
        {
          message: "Wiki-Seite wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !canUserSeeWikiPage(
        row,
        currentUser,
        canManageWiki,
      )
    ) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapWikiPageRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Wiki-Seite konnte nicht geladen werden.",
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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
      "wiki.edit",
      "wiki.manage",
      "settings.manage",
    ]);

    const {
      slug,
    } = await context.params;

    const currentSlug =
      decodeURIComponent(slug);

    const current =
      await findWikiPage(currentSlug);

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

    const body =
      (await request.json()) as UpdateWikiPageBody;

    const nextTitle =
      body.title !== undefined
        ? normalizeText(body.title)
        : current.title;

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

    const nextSlug =
      createSlug(
        normalizeText(body.slug) ||
          nextTitle ||
          current.slug,
      );

    const slugExists = await queryOne<{ slug: string }>(
      `
        SELECT slug
        FROM wiki_pages
        WHERE slug = $1
          AND slug <> $2
        LIMIT 1
      `,
      [
        nextSlug,
        current.slug,
      ],
    );

    if (slugExists) {
      return NextResponse.json(
        {
          message: "Eine Wiki-Seite mit diesem Slug existiert bereits.",
        },
        {
          status: 409,
        },
      );
    }

    const nextDescription =
      body.description !== undefined
        ? normalizeText(body.description)
        : current.description || "";

    const nextExcerpt =
      body.excerpt !== undefined
        ? normalizeText(body.excerpt)
        : current.excerpt || nextDescription;

    const nextCompany =
      body.company !== undefined
        ? normalizeText(body.company) || currentUser.company || "Intern"
        : current.company || "Intern";

    const nextDepartment =
      body.department !== undefined
        ? normalizeText(body.department)
        : current.department || "";

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : current.category || "";

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

    const nextAuthor =
      body.author !== undefined
        ? normalizeText(body.author) || current.author || currentUser.name || "System"
        : current.author || currentUser.name || "System";

    const nextTags =
      body.tags !== undefined
        ? normalizeTags(body.tags)
        : Array.isArray(current.tags)
          ? current.tags
          : [];

    const nextContent =
      body.content !== undefined
        ? String(body.content || "")
        : current.content || "";

    const nextStatus =
      body.status !== undefined
        ? normalizeStatus(body.status)
        : normalizeStatus(current.status);

    const nextVisibility =
      body.visibility !== undefined
        ? normalizeVisibility(
            body.visibility,
            nextCompany,
            nextDepartment,
          )
        : normalizeVisibility(
            current.visibility,
            nextCompany,
            nextDepartment,
          );

    const nextPinned =
      body.pinned !== undefined
        ? Boolean(body.pinned)
        : Boolean(current.pinned);

    await saveWikiVersion(current);

    const row = await queryOne<WikiPageRow>(
      `
        UPDATE wiki_pages
        SET
          slug = $1,
          title = $2,
          description = $3,
          excerpt = $4,
          company = $5,
          category = $6,
          department = $7,
          author = $8,
          tags = $9,
          content = $10,
          status = $11,
          visibility = $12,
          pinned = $13,
          updated_at = NOW()
        WHERE slug = $14
        RETURNING
          id,
          slug,
          title,
          description,
          excerpt,
          company,
          category,
          department,
          author,
          tags,
          content,
          status,
          visibility,
          pinned,
          created_at,
          updated_at
      `,
      [
        nextSlug,
        nextTitle,
        nextDescription,
        nextExcerpt,
        nextCompany,
        nextCategory,
        nextDepartment,
        nextAuthor,
        nextTags,
        nextContent,
        nextStatus,
        nextVisibility,
        nextPinned,
        current.slug,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Wiki-Seite konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapWikiPageRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Wiki-Seite konnte nicht aktualisiert werden.",
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
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
      "wiki.delete",
      "wiki.manage",
      "settings.manage",
    ]);

    const {
      slug,
    } = await context.params;

    const decodedSlug =
      decodeURIComponent(slug);

    const current =
      await findWikiPage(decodedSlug);

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

    await saveWikiVersion(current);

    const deleted = await queryOne<{ slug: string }>(
      `
        DELETE FROM wiki_pages
        WHERE slug = $1
        RETURNING slug
      `,
      [
        decodedSlug,
      ],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Wiki-Seite wurde nicht gefunden.",
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
        message: getErrorMessage(
          error,
          "Wiki-Seite konnte nicht gelöscht werden.",
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