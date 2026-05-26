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

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

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

function getErrorStatus(
  error: unknown
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

export async function GET(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "wiki.view",
      "wiki.manage",
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
    ]);

    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const company =
      url.searchParams.get(
        "company"
      );

    const department =
      url.searchParams.get(
        "department"
      );

    const category =
      url.searchParams.get(
        "category"
      );

    const tag =
      url.searchParams.get(
        "tag"
      );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (company) {
      params.push(
        company
      );

      whereParts.push(
        `company = $${params.length}`
      );
    }

    if (department) {
      params.push(
        department
      );

      whereParts.push(
        `(department = $${params.length} OR category = $${params.length})`
      );
    }

    if (category) {
      params.push(
        category
      );

      whereParts.push(
        `category = $${params.length}`
      );
    }

    if (tag) {
      params.push(
        tag
      );

      whereParts.push(
        `$${params.length} = ANY(tags)`
      );
    }

    if (currentUser.role !== "admin") {
      if (currentUser.department) {
        params.push(
          currentUser.department
        );

        whereParts.push(
          `(department = $${params.length} OR category = $${params.length})`
        );
      } else if (currentUser.company) {
        params.push(
          currentUser.company
        );

        whereParts.push(
          `company = $${params.length}`
        );
      } else {
        whereParts.push(
          "1 = 0"
        );
      }
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<WikiPageRow>(
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
        params
      );

    return NextResponse.json(
      rows.map(
        mapWikiPageRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Wiki-Seiten konnten nicht geladen werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "wiki.create",
      "wiki.manage",
    ]);

    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const body =
      await request.json() as CreateWikiPageBody;

    const title =
      body.title?.trim();

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Titel ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const slug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : createSlug(
            title
          );

    const canChooseScope =
      currentUser.role === "admin";

    const company =
      canChooseScope
        ? body.company ||
          "Intern"
        : currentUser.company ||
          "Intern";

    const department =
      canChooseScope
        ? body.department ||
          body.category ||
          "Allgemein"
        : currentUser.department ||
          "Allgemein";

    const row =
      await queryOne<WikiPageRow>(
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
          body.description?.trim() ||
            "",
          body.excerpt?.trim() ||
            body.description?.trim() ||
            "",
          company,
          department,
          department,
          body.author ||
            currentUser.name ||
            "Unbekannt",
          Array.isArray(
            body.tags
          )
            ? body.tags
            : [],
          body.content ||
            "",
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Wiki-Seite konnte nicht erstellt werden.",
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
      ),
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Wiki-Seite konnte nicht erstellt werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}