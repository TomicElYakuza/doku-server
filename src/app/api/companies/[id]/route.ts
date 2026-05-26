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
  mapCompanyRow,
} from "../../../../lib/database/mappers/companyMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

import type {
  CompanyRow,
} from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateCompanyBody = {
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
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

function userCanAccessCompany(
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  companyId: string
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  return currentUser.companyId === companyId;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
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
      id,
    } =
      await context.params;

    const row =
      await queryOne<CompanyRow>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM companies
        WHERE id = $1
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      !userCanAccessCompany(
        currentUser,
        row.id
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
      mapCompanyRow(
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
            "Firma konnte nicht geladen werden."
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
      "organization.manage",
      "companies.manage",
    ]);

    const currentUser =
      await getCurrentServerUser();

    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen Firmen bearbeiten.",
        },
        {
          status:
            403,
        }
      );
    }

    const {
      id,
    } =
      await context.params;

    const body =
      await request.json() as UpdateCompanyBody;

    const current =
      await queryOne<CompanyRow>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM companies
        WHERE id = $1
        `,
        [
          id,
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Firma nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const nextName =
      body.name?.trim() ||
      current.name;

    const nextSlug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : current.slug;

    const row =
      await queryOne<CompanyRow>(
        `
        UPDATE companies
        SET
          name = $1,
          slug = $2,
          description = $3,
          status = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        `,
        [
          nextName,
          nextSlug,
          body.description !== undefined
            ? body.description.trim()
            : current.description ||
              "",
          body.status ||
            current.status,
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapCompanyRow(
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
            "Firma konnte nicht aktualisiert werden."
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
      "organization.manage",
      "companies.manage",
    ]);

    const currentUser =
      await getCurrentServerUser();

    if (
      !currentUser ||
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen Firmen löschen.",
        },
        {
          status:
            403,
        }
      );
    }

    const {
      id,
    } =
      await context.params;

    const row =
      await queryOne<{
        id: string;
      }>(
        `
        DELETE FROM companies
        WHERE id = $1
        RETURNING id
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

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
            "Firma konnte nicht gelöscht werden."
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