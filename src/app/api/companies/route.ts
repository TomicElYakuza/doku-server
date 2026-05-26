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
  mapCompanyRow,
} from "../../../lib/database/mappers/companyMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

import type {
  CompanyRow,
} from "../../../lib/database/mappers/companyMapper";

type CreateCompanyBody = {
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

export async function GET() {
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

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (currentUser.role !== "admin") {
      if (currentUser.companyId) {
        params.push(
          currentUser.companyId
        );

        whereParts.push(
          `id = $${params.length}`
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
      await query<CompanyRow>(
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
        ${whereSql}
        ORDER BY name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapCompanyRow
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
            "Firmen konnten nicht geladen werden."
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
            "Nur Administratoren dürfen Firmen erstellen.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as CreateCompanyBody;

    const name =
      body.name?.trim();

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Name ist erforderlich.",
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
            name
          );

    const row =
      await queryOne<CompanyRow>(
        `
        INSERT INTO companies (
          name,
          slug,
          description,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
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
          name,
          slug,
          body.description?.trim() ||
            "",
          body.status ||
            "active",
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma konnte nicht erstellt werden.",
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
            "Firma konnte nicht erstellt werden."
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