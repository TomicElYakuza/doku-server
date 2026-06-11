import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapWikiPageRow,
  type WikiPageRow,
} from "../../../lib/database/mappers/wikiMapper";
import {
  createSlug,
} from "../../../lib/database/slug";
import {
  getCurrentServerUser,
  hasAnyServerPermission,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type {
  WikiStatus,
  WikiVisibility,
} from "../../../types/wiki";

type CreateWikiPageBody = {
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
    new Set(value.map((tag) => String(tag).trim()).filter(Boolean)),
  );
}

function normalizeStatus(value: unknown): WikiStatus {
  const status =
    String(value || "").trim();

  if (status === "draft" || status === "published" || status === "archived") {
    return status;
  }

  return "published";
}

function normalizeVisibility(value: unknown, company: string, department: string): WikiVisibility {
  const visibility =
    String(value || "").trim();

  if (visibility === "global" || visibility === "company" || visibility === "department") {
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

function addViewerScope(
  whereParts: string[],
  params: unknown[],
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
) {
  if (!currentUser) {
    whereParts.push("FALSE");
    return;
  }

  params.push(currentUser.company || "");
  const companyParam = `$${params.length}`;

  params.push(currentUser.department || "");
  const departmentParam = `$${params.length}`;

  whereParts.push(`
    (
      visibility = 'global'
      OR (
        visibility = 'company'
        AND COALESCE(company, '') = ${companyParam}
      )
      OR (
        visibility = 'department'
        AND COALESCE(department, '') = ${departmentParam}
      )
      OR (
        COALESCE(visibility, '') = ''
        AND COALESCE(company, '') = ''
        AND COALESCE(department, '') = ''
      )
    )
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
      "wiki.view",
      "wiki.manage",
      "admin.view",
    ]);

    await ensureWikiProductionColumns();

    const canManageWiki =
      await hasAnyServerPermission([
        "wiki.manage",
        "admin.view",
      ]);

    const url = new URL(request.url);
    const category = normalizeText(url.searchParams.get("category"));
    const tag = normalizeText(url.searchParams.get("tag"));
    const search = normalizeText(url.searchParams.get("search"));
    const status = normalizeText(url.searchParams.get("status"));
    const visibility = normalizeText(url.searchParams.get("visibility"));
    const pinned = normalizeText(url.searchParams.get("pinned"));

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (!canManageWiki) {
      whereParts.push("status = 'published'");
      addViewerScope(whereParts, params, currentUser);
    } else if (status && status !== "all") {
      params.push(status);
      whereParts.push(`status = $${params.length}`);
    }

    if (canManageWiki && visibility && visibility !== "all") {
      params.push(visibility);
      whereParts.push(`visibility = $${params.length}`);
    }

    if (pinned === "true" || pinned === "false") {
      params.push(pinned === "true");
      whereParts.push(`pinned = $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (tag) {
      params.push(tag);
      whereParts.push(`$${params.length} = ANY(tags)`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(
        `(title ILIKE $${params.length} OR description ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`,
      );
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<WikiPageRow>(
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
        ${whereSql}
        ORDER BY pinned DESC, updated_at DESC, title ASC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapWikiPageRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Wiki-Seiten konnten nicht geladen werden.",
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
      "wiki.create",
      "wiki.manage",
      "settings.manage",
    ]);

    await ensureWikiProductionColumns();

    const body =
      (await request.json()) as CreateWikiPageBody;

    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const excerpt = normalizeText(body.excerpt) || description;
    const category = normalizeText(body.category);
    const department = normalizeText(body.department);
    const company = normalizeText(body.company) || currentUser.company || "Intern";
    const author = normalizeText(body.author) || currentUser.name || "System";
    const content = String(body.content || "");
    const tags = normalizeTags(body.tags);
    const status = normalizeStatus(body.status);
    const visibility = normalizeVisibility(body.visibility, company, department);
    const pinned = Boolean(body.pinned);

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

    const slug = createSlug(normalizeText(body.slug) || title);

    const existing = await queryOne<{ slug: string }>(
      `
        SELECT slug
        FROM wiki_pages
        WHERE slug = $1
        LIMIT 1
      `,
      [
        slug,
      ],
    );

    if (existing) {
      return NextResponse.json(
        {
          message: "Eine Wiki-Seite mit diesem Slug existiert bereits.",
        },
        {
          status: 409,
        },
      );
    }

    const row = await queryOne<WikiPageRow>(
      `
        INSERT INTO wiki_pages (
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
          pinned
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Wiki-Seite konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapWikiPageRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Wiki-Seite konnte nicht erstellt werden.",
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
