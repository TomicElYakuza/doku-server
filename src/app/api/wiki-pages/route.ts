import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  createSlug,
} from "../../../lib/database/slug";
import {
  mapWikiPageRow,
} from "../../../lib/database/mappers/wikiMapper";
import type {
  WikiPageRow,
} from "../../../lib/database/mappers/wikiMapper";

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const company = url.searchParams.get("company");
    const department = url.searchParams.get("department");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (company) {
      params.push(company);
      whereParts.push(`company = $${params.length}`);
    }

    if (department) {
      params.push(department);
      whereParts.push(`department = $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (tag) {
      params.push(tag);
      whereParts.push(`$${params.length} = ANY(tags)`);
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

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
        ORDER BY updated_at DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapWikiPageRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Wiki-Seiten konnten nicht geladen werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateWikiPageBody;

    const title = normalizeText(body.title);
    const category = normalizeText(body.category);
    const company = normalizeText(body.company) || "Intern";
    const department = normalizeText(body.department);
    const author = normalizeText(body.author) || "System";
    const description = normalizeText(body.description);
    const excerpt = normalizeText(body.excerpt) || description;
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

    const slug = body.slug?.trim()
      ? createSlug(body.slug)
      : createSlug(title);

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
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
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

    return NextResponse.json(
      mapWikiPageRow(row),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Wiki-Seite konnte nicht erstellt werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}