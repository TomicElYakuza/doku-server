import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  mapWikiPageRow,
  type WikiPageRow,
} from "../../../../lib/database/mappers/wikiMapper";
import { createSlug } from "../../../../lib/database/slug";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

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
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeTags(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
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

async function findWikiPage(slug: string) {
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
        created_at,
        updated_at
      FROM wiki_pages
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );
}

async function saveWikiVersion(row: WikiPageRow) {
  await queryOne<{ id: string }>(
    `
      INSERT INTO wiki_versions (
        wiki_slug,
        title,
        description,
        company,
        category,
        department,
        tags,
        content
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      row.slug,
      row.title || "",
      row.description || "",
      row.company || "Intern",
      row.category || "",
      row.department || "",
      Array.isArray(row.tags) ? row.tags : [],
      row.content || "",
    ],
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
      "wiki.view",
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
      "admin.view",
    ]);

    const { slug } = await context.params;
    const row = await findWikiPage(decodeURIComponent(slug));

    if (!row) {
      return NextResponse.json(
        {
          message: "Wiki-Seite nicht gefunden.",
        },
        {
          status: 404,
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

    await requireAnyServerPermission(["wiki.edit", "settings.manage"]);

    const { slug } = await context.params;
    const currentSlug = decodeURIComponent(slug);
    const body = (await request.json()) as UpdateWikiPageBody;

    const current = await findWikiPage(currentSlug);

    if (!current) {
      return NextResponse.json(
        {
          message: "Wiki-Seite nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    await saveWikiVersion(current);

    const nextTitle =
      body.title !== undefined ? normalizeText(body.title) : current.title;

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : current.category || "";

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

    const nextSlug =
      body.slug !== undefined
        ? createSlug(normalizeText(body.slug) || nextTitle)
        : current.slug;

    if (nextSlug !== current.slug) {
      const slugExists = await queryOne<{ slug: string }>(
        `
          SELECT slug
          FROM wiki_pages
          WHERE slug = $1
            AND slug <> $2
          LIMIT 1
        `,
        [nextSlug, current.slug],
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
    }

    const nextDescription =
      body.description !== undefined
        ? normalizeText(body.description)
        : current.description || "";

    const nextExcerpt =
      body.excerpt !== undefined
        ? normalizeText(body.excerpt) || nextDescription
        : current.excerpt || nextDescription;

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
          updated_at = NOW()
        WHERE slug = $11
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
        nextSlug,
        nextTitle,
        nextDescription,
        nextExcerpt,
        body.company !== undefined
          ? normalizeText(body.company) || currentUser.company || "Intern"
          : current.company || "Intern",
        nextCategory,
        body.department !== undefined
          ? normalizeText(body.department)
          : current.department || "",
        body.author !== undefined
          ? normalizeText(body.author) || currentUser.name || "System"
          : current.author || "System",
        normalizeTags(body.tags, Array.isArray(current.tags) ? current.tags : []),
        body.content !== undefined
          ? String(body.content || "")
          : current.content || "",
        currentSlug,
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

    await requireAnyServerPermission(["wiki.delete", "settings.manage"]);

    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    const deleted = await queryOne<{ slug: string }>(
      `
        DELETE FROM wiki_pages
        WHERE slug = $1
        RETURNING slug
      `,
      [decodedSlug],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Wiki-Seite nicht gefunden.",
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
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}