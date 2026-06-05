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

type ServerUser = Awaited<ReturnType<typeof getCurrentServerUser>>;

function normalizeText(value?: string | null) {
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

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

function userCanAccessPage(
  currentUser: ServerUser,
  page: WikiPageRow,
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.department &&
    page.department === currentUser.department
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
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "wiki.view",
      "wiki.manage",
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
    ]);

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

    if (!userCanAccessPage(currentUser, row)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(
      mapWikiPageRow(row),
    );
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "wiki.edit",
      "wiki.manage",
    ]);

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

    const {
      slug,
    } = await context.params;

    const decodedSlug = decodeURIComponent(slug);

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

    if (!userCanAccessPage(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json() as UpdateWikiPageBody;
    const canChooseScope = currentUser.role === "admin";

    const nextTitle = body.title !== undefined
      ? normalizeText(body.title)
      : current.title;

    const nextSlug = body.slug !== undefined
      ? createSlug(body.slug)
      : current.slug;

    const nextCategory = body.category !== undefined
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

    if (!nextSlug) {
      return NextResponse.json(
        {
          message: "Slug ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextCategory) {
      return NextResponse.json(
        {
          message: "Wiki-Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const nextCompany = canChooseScope
      ? body.company !== undefined
        ? normalizeText(body.company) || "Intern"
        : current.company || "Intern"
      : current.company || currentUser.company || "Intern";

    const nextDepartment = canChooseScope
      ? body.department !== undefined
        ? normalizeText(body.department) || "Allgemein"
        : current.department || "Allgemein"
      : current.department || currentUser.department || "Allgemein";

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
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description || "",
        body.excerpt !== undefined
          ? normalizeText(body.excerpt)
          : current.excerpt || current.description || "",
        nextCompany,
        nextCategory,
        nextDepartment,
        body.author !== undefined
          ? normalizeText(body.author) || currentUser.name || "System"
          : current.author || "System",
        Array.isArray(body.tags)
          ? normalizeTags(body.tags)
          : current.tags || [],
        body.content !== undefined
          ? String(body.content || "")
          : current.content || "",
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

    return NextResponse.json(
      mapWikiPageRow(row),
    );
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "wiki.delete",
      "wiki.manage",
    ]);

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

    const {
      slug,
    } = await context.params;

    const decodedSlug = decodeURIComponent(slug);

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

    if (!userCanAccessPage(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
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