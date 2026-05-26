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

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

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

function userCanAccessPage(
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  page: WikiPageRow
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  const pageDepartment =
    page.department ||
    page.category ||
    "";

  if (
    currentUser.department &&
    pageDepartment === currentUser.department
  ) {
    return true;
  }

  if (
    currentUser.company &&
    page.company === currentUser.company
  ) {
    return true;
  }

  return false;
}

export async function GET(
  _request: Request,
  context: RouteContext
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

    if (
      !userCanAccessPage(
        currentUser,
        row
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
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
          getErrorMessage(
            error,
            "Wiki-Seite konnte nicht geladen werden."
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "wiki.edit",
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

    const {
      slug,
    } =
      await context.params;

    const decodedSlug =
      decodeURIComponent(
        slug
      );

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

    if (
      !userCanAccessPage(
        currentUser,
        current
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as UpdateWikiPageBody;

    const canChooseScope =
      currentUser.role === "admin";

    const nextTitle =
      body.title?.trim() ||
      current.title;

    const nextSlug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : current.slug;

    const nextCompany =
      canChooseScope
        ? body.company !== undefined
          ? body.company ||
            "Intern"
          : current.company ||
            "Intern"
        : current.company ||
          currentUser.company ||
          "Intern";

    const nextDepartment =
      canChooseScope
        ? body.department !== undefined
          ? body.department ||
            body.category ||
            "Allgemein"
          : current.department ||
            current.category ||
            "Allgemein"
        : current.department ||
          current.category ||
          currentUser.department ||
          "Allgemein";

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
          nextCompany,
          nextDepartment,
          nextDepartment,
          body.author !== undefined
            ? body.author ||
              currentUser.name ||
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
          getErrorMessage(
            error,
            "Wiki-Seite konnte nicht aktualisiert werden."
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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "wiki.delete",
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

    const {
      slug,
    } =
      await context.params;

    const decodedSlug =
      decodeURIComponent(
        slug
      );

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

    if (
      !userCanAccessPage(
        currentUser,
        current
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
        }
      );
    }

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
          getErrorMessage(
            error,
            "Wiki-Seite konnte nicht gelöscht werden."
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