import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapAdminUserRow,
} from "../../../../lib/database/mappers/adminUserMapper";

import {
  hashPassword,
} from "../../../../lib/password";

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
  username?: string;
  password?: string;
  passwordMustChange?: boolean;
  role?: string;
  status?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  lastLoginAt?: string;
};

type AdminUserWithLoginRow =
  AdminUserRow & {
    username: string | null;
    password_hash?: string | null;
    password_must_change: boolean;
  };

function normalizeUsername(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "."
    );
}

function mapAdminUserWithLoginRow(
  row: AdminUserWithLoginRow
) {
  return {
    ...mapAdminUserRow(
      row
    ),

    username:
      row.username ||
      "",

    passwordMustChange:
      Boolean(
        row.password_must_change
      ),

    hasPassword:
      Boolean(
        row.password_hash
      ),
  };
}

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
      await queryOne<AdminUserWithLoginRow>(
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
          updated_at,
          username,
          password_hash,
          password_must_change
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
      mapAdminUserWithLoginRow(
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
      await queryOne<AdminUserWithLoginRow>(
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
          updated_at,
          username,
          password_hash,
          password_must_change
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

    const nextName =
      body.name?.trim() ||
      current.name;

    const nextEmail =
      body.email?.trim().toLowerCase() ||
      current.email;

    const nextUsername =
      body.username !== undefined
        ? normalizeUsername(
            body.username
          )
        : current.username ||
          normalizeUsername(
            nextEmail.split(
              "@"
            )[0] ||
            nextName
          );

    if (!nextUsername) {
      return NextResponse.json(
        {
          message:
            "Benutzername ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const nextPasswordHash =
      body.password
        ? await hashPassword(
            body.password
          )
        : current.password_hash ||
          null;

    const nextPasswordMustChange =
      body.passwordMustChange !== undefined
        ? body.passwordMustChange
        : current.password_must_change;

    const row =
      await queryOne<AdminUserWithLoginRow>(
        `
        UPDATE admin_users
        SET
          name = $1,
          email = $2,
          username = $3,
          password_hash = $4,
          password_must_change = $5,
          role = $6,
          status = $7,
          company_id = $8,
          department_id = $9,
          company = $10,
          department = $11,
          last_login_at = $12,
          updated_at = NOW()
        WHERE id = $13
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
          updated_at,
          username,
          password_hash,
          password_must_change
        `,
        [
          nextName,
          nextEmail,
          nextUsername,
          nextPasswordHash,
          nextPasswordMustChange,
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
            ? body.lastLoginAt ||
              null
            : current.last_login_at ||
              null,
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
      mapAdminUserWithLoginRow(
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