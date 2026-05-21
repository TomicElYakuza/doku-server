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

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      slug,
    } =
      await context.params;

    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const row =
      await queryOne<WikiPageRow>(
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
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Wiki-Seite nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapWikiPageRow(
        row
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Wiki-Seite konnte nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      slug,
    } =
      await context.params;

    const decodedSlug =
      decodeURIComponent(
        slug
      );

    const body =
      await request.json() as UpdateWikiPageBody;

    const current =
      await queryOne<WikiPageRow>(
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
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Wiki-Seite nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const nextTitle =
      body.title?.trim() ||
      current.title;

    const nextSlug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : current.slug;

    const row =
      await queryOne<WikiPageRow>(
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
          body.description !== undefined
            ? body.description.trim()
            : current.description ||
              "",
          body.excerpt !== undefined
            ? body.excerpt.trim()
            : current.excerpt ||
              current.description ||
              "",
          body.company !== undefined
            ? body.company ||
              "Intern"
            : current.company ||
              "Intern",
          body.category !== undefined
            ? body.category ||
              "Allgemein"
            : current.category ||
              "Allgemein",
          body.department !== undefined
            ? body.department ||
              "Allgemein"
            : current.department ||
              current.category ||
              "Allgemein",
          body.author !== undefined
            ? body.author ||
              "Unbekannt"
            : current.author ||
              "Unbekannt",
          Array.isArray(
            body.tags
          )
            ? body.tags
            : current.tags ||
              [],
          body.content !== undefined
            ? body.content
            : current.content ||
              "",
          decodedSlug,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Wiki-Seite konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapWikiPageRow(
        row
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Wiki-Seite konnte nicht aktualisiert werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      slug,
    } =
      await context.params;

    const decodedSlug =
      decodeURIComponent(
        slug
      );

    await queryOne(
      `
      DELETE FROM wiki_pages
      WHERE slug = $1
      RETURNING id
      `,
      [
        decodedSlug,
      ]
    );

    return NextResponse.json({
      ok:
        true,
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Wiki-Seite konnte nicht gelöscht werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}