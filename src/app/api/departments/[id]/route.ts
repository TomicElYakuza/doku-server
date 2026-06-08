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
  mapDepartmentRow,
} from "../../../../lib/database/mappers/companyMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

import type {
  DepartmentRow,
} from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateDepartmentBody = {
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

function userCanAccessDepartment(
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  department: DepartmentRow
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.departmentId &&
    department.id === currentUser.departmentId
  ) {
    return true;
  }

  if (
    currentUser.companyId &&
    department.company_id === currentUser.companyId
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
      await queryOne<DepartmentRow>(
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
            "Abteilung nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      !userCanAccessDepartment(
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
      mapDepartmentRow(
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
            "Abteilung konnte nicht geladen werden."
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
            "Nur Administratoren dürfen Abteilungen bearbeiten.",
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
      await request.json() as UpdateDepartmentBody;

    const current =
      await queryOne<DepartmentRow>(
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
            "Abteilung nicht gefunden.",
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
      await queryOne<DepartmentRow>(
        `
        UPDATE departments
        SET
          company_id = $1,
          name = $2,
          slug = $3,
          description = $4,
          status = $5,
          updated_at = NOW()
        WHERE id = $6
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
          body.companyId ||
            current.company_id,
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
            "Abteilung konnte nicht aktualisiert werden.",
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
            "Abteilung konnte nicht aktualisiert werden."
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
            "Nur Administratoren dürfen Abteilungen löschen.",
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
        DELETE FROM departments
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
            "Abteilung nicht gefunden.",
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
            "Abteilung konnte nicht gelöscht werden."
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
