import {
  NextResponse,
} from "next/server";
import {
  queryOne,
} from "../../../../lib/database/db";
import {
  createSlug,
} from "../../../../lib/database/slug";
import {
  mapWikiPageRow,
} from "../../../../lib/database/mappers/wikiMapper";
import type {
  WikiPageRow,
} from "../../../../lib/database/mappers/wikiMapper";

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

function normalizeText(value?: string) {
  return String(value || "").trim();
}

function normalizeTags(tags?: string[]) {
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

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      slug,
    } = await context.params;

    const decodedSlug = decodeURIComponent(slug);

    const row = await queryOne<WikiPageRow>(
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
      `,
      [
        decodedSlug,
      ],
    );

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
        message: "Wiki-Seite konnte nicht geladen werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      slug,
    } = await context.params;

    const decodedSlug = decodeURIComponent(slug);
    const body = await request.json() as UpdateWikiPageBody;

    const current = await queryOne<WikiPageRow>(
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
      `,
      [
        decodedSlug,
      ],
    );

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

    const nextTitle = body.title !== undefined
      ? normalizeText(body.title)
      : current.title;

    const nextCategory = body.category !== undefined
      ? normalizeText(body.category)
      : current.category;

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

    const nextSlug = body.slug?.trim()
      ? createSlug(body.slug)
      : current.slug;

    const nextDescription = body.description !== undefined
      ? normalizeText(body.description)
      : current.description || "";

    const nextExcerpt = body.excerpt !== undefined
      ? normalizeText(body.excerpt)
      : current.excerpt || current.description || "";

    const nextCompany = body.company !== undefined
      ? normalizeText(body.company) || "Intern"
      : current.company || "Intern";

    const nextDepartment = body.department !== undefined
      ? normalizeText(body.department) || "Allgemein"
      : current.department || "Allgemein";

    const nextAuthor = body.author !== undefined
      ? normalizeText(body.author) || "Unbekannt"
      : current.author || "Unbekannt";

    const nextTags = Array.isArray(body.tags)
      ? normalizeTags(body.tags)
      : current.tags || [];

    const nextContent = body.content !== undefined
      ? String(body.content || "")
      : current.content || "";

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
        nextCompany,
        nextCategory,
        nextDepartment,
        nextAuthor,
        nextTags,
        nextContent,
        decodedSlug,
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
        message: "Wiki-Seite konnte nicht aktualisiert werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      slug,
    } = await context.params;

    const decodedSlug = decodeURIComponent(slug);

    await queryOne(
      `
        DELETE FROM wiki_pages
        WHERE slug = $1
        RETURNING id
      `,
      [
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
        message: "Wiki-Seite konnte nicht gelöscht werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}