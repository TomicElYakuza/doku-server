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
  mapDepartmentRow,
} from "../../../lib/database/mappers/companyMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

import type {
  DepartmentRow,
} from "../../../lib/database/mappers/companyMapper";

type CreateDepartmentBody = {
  companyId?: string;
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

export async function GET(
  request: Request
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

    const url =
      new URL(
        request.url
      );

    const companyId =
      url.searchParams.get(
        "companyId"
      );

    const onlyActive =
      url.searchParams.get(
        "active"
      ) === "true";

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (companyId) {
      params.push(
        companyId
      );

      whereParts.push(
        `company_id = $${params.length}`
      );
    }

    if (onlyActive) {
      params.push(
        "active"
      );

      whereParts.push(
        `status = $${params.length}`
      );
    }

    if (currentUser.role !== "admin") {
      if (currentUser.departmentId) {
        params.push(
          currentUser.departmentId
        );

        whereParts.push(
          `id = $${params.length}`
        );
      } else if (currentUser.companyId) {
        params.push(
          currentUser.companyId
        );

        whereParts.push(
          `company_id = $${params.length}`
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
      await query<DepartmentRow>(
        `
        SELECT
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM departments
        ${whereSql}
        ORDER BY name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapDepartmentRow
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
            "Abteilungen konnten nicht geladen werden."
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
      "departments.manage",
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
            "Nur Administratoren dürfen Abteilungen erstellen.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as CreateDepartmentBody;

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

    if (!body.companyId) {
      return NextResponse.json(
        {
          message:
            "Firma ist erforderlich.",
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
      await queryOne<DepartmentRow>(
        `
        INSERT INTO departments (
          company_id,
          name,
          slug,
          description,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        `,
        [
          body.companyId,
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
            "Abteilung konnte nicht erstellt werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapDepartmentRow(
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
            "Abteilung konnte nicht erstellt werden."
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