import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  mapWikiPageRow,
  type WikiPageRow,
} from "../../../lib/database/mappers/wikiMapper";
import { createSlug } from "../../../lib/database/slug";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

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

export async function GET(request: Request) {
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
      "wiki.view",
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
      "admin.view",
    ]);

    const url = new URL(request.url);
    const category = normalizeText(url.searchParams.get("category"));
    const tag = normalizeText(url.searchParams.get("tag"));
    const search = normalizeText(url.searchParams.get("search"));

    const params: unknown[] = [];
    const whereParts: string[] = [];

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
          created_at,
          updated_at
        FROM wiki_pages
        ${whereSql}
        ORDER BY updated_at DESC, title ASC
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

    await requireAnyServerPermission(["wiki.create", "settings.manage"]);

    const body = (await request.json()) as CreateWikiPageBody;

    const title = normalizeText(body.title);
    const description = normalizeText(body.description);
    const excerpt = normalizeText(body.excerpt) || description;
    const category = normalizeText(body.category);
    const department = normalizeText(body.department);
    const company =
      normalizeText(body.company) || currentUser.company || "Intern";
    const author = normalizeText(body.author) || currentUser.name || "System";
    const content = String(body.content || "");
    const tags = normalizeTags(body.tags);

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
      [slug],
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
          content
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}