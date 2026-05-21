import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapAdminUserRow,
} from "../../../../lib/database/mappers/adminUserMapper";

import type {
  AdminUserRow,
} from "../../../../lib/database/mappers/adminUserMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateAdminUserBody = {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  lastLoginAt?: string;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const row =
      await queryOne<AdminUserRow>(
        `
        SELECT
          id,
          name,
          email,
          role,
          status,
          company_id,
          department_id,
          company,
          department,
          last_login_at,
          created_at,
          updated_at
        FROM admin_users
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
            "Benutzer nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapAdminUserRow(
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
          "Benutzer konnte nicht geladen werden.",

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
      id,
    } =
      await context.params;

    const body =
      await request.json() as UpdateAdminUserBody;

    const current =
      await queryOne<AdminUserRow>(
        `
        SELECT
          id,
          name,
          email,
          role,
          status,
          company_id,
          department_id,
          company,
          department,
          last_login_at,
          created_at,
          updated_at
        FROM admin_users
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
            "Benutzer nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const row =
      await queryOne<AdminUserRow>(
        `
        UPDATE admin_users
        SET
          name = $1,
          email = $2,
          role = $3,
          status = $4,
          company_id = $5,
          department_id = $6,
          company = $7,
          department = $8,
          last_login_at = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING
          id,
          name,
          email,
          role,
          status,
          company_id,
          department_id,
          company,
          department,
          last_login_at,
          created_at,
          updated_at
        `,
        [
          body.name?.trim() ||
            current.name,
          body.email?.trim().toLowerCase() ||
            current.email,
          body.role ||
            current.role,
          body.status ||
            current.status,
          body.companyId !== undefined
            ? body.companyId ||
              null
            : current.company_id,
          body.departmentId !== undefined
            ? body.departmentId ||
              null
            : current.department_id,
          body.company !== undefined
            ? body.company ||
              "Intern"
            : current.company ||
              "Intern",
          body.department !== undefined
            ? body.department ||
              "Allgemein"
            : current.department ||
              "Allgemein",
          body.lastLoginAt !== undefined
            ? body.lastLoginAt
            : current.last_login_at ||
              "",
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Benutzer konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapAdminUserRow(
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
          "Benutzer konnte nicht aktualisiert werden.",

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
      id,
    } =
      await context.params;

    await queryOne(
      `
      DELETE FROM admin_users
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
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
          "Benutzer konnte nicht gelöscht werden.",

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