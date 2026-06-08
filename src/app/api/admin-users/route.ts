import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  mapAdminUserRow,
} from "../../../lib/database/mappers/adminUserMapper";

import {
  hashPassword,
} from "../../../lib/password";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

import type {
  AdminUserRow,
} from "../../../lib/database/mappers/adminUserMapper";

type CreateAdminUserBody = {
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
};

type AdminUserWithLoginRow =
  AdminUserRow & {
    username: string | null;
    password_hash: string | null;
    password_must_change: boolean;
  };

type DatabaseError = Error & {
  code?: string;
  constraint?: string;
  detail?: string;
};

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

function normalizeRole(
  value?: string
) {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeStatus(
  value?: string
) {
  if (value === "inactive") {
    return "inactive";
  }

  if (value === "invited") {
    return "invited";
  }

  return "active";
}

function getDatabaseErrorMessage(
  error: unknown
) {
  const databaseError =
    error as DatabaseError;

  if (databaseError.code === "23505") {
    const detail =
      databaseError.detail ||
      "";

    if (
      detail.includes(
        "username"
      ) ||
      databaseError.constraint?.includes(
        "username"
      )
    ) {
      return "Dieser Benutzername ist bereits vergeben.";
    }

    if (
      detail.includes(
        "email"
      ) ||
      databaseError.constraint?.includes(
        "email"
      )
    ) {
      return "Diese E-Mail-Adresse ist bereits vergeben.";
    }

    return "Benutzername oder E-Mail ist bereits vergeben.";
  }

  if (databaseError.message?.includes("password_must_change")) {
    return "Die Datenbankspalte password_must_change fehlt noch.";
  }

  if (databaseError.message?.includes("password_hash")) {
    return "Die Datenbankspalte password_hash fehlt noch.";
  }

  if (databaseError.message?.includes("username")) {
    return "Die Datenbankspalte username fehlt noch oder der Benutzername ist ungültig.";
  }

  return databaseError.message ||
    "Unbekannter Datenbankfehler.";
}

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

  return getDatabaseErrorMessage(
    error
  ) ||
    fallback;
}

export async function GET(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "users.manage_permissions",
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

    const status =
      url.searchParams.get(
        "status"
      );

    const role =
      url.searchParams.get(
        "role"
      );

    const companyId =
      url.searchParams.get(
        "companyId"
      );

    const departmentId =
      url.searchParams.get(
        "departmentId"
      );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (status) {
      params.push(
        status
      );

      whereParts.push(
        `status = $${params.length}`
      );
    }

    if (role) {
      params.push(
        role
      );

      whereParts.push(
        `role = $${params.length}`
      );
    }

    if (companyId) {
      params.push(
        companyId
      );

      whereParts.push(
        `company_id = $${params.length}`
      );
    }

    if (departmentId) {
      params.push(
        departmentId
      );

      whereParts.push(
        `department_id = $${params.length}`
      );
    }

    if (currentUser.role !== "admin") {
      if (currentUser.departmentId) {
        params.push(
          currentUser.departmentId
        );

        whereParts.push(
          `department_id = $${params.length}`
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
      await query<AdminUserWithLoginRow>(
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
        ${whereSql}
        ORDER BY name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapAdminUserWithLoginRow
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
            "Benutzer konnten nicht geladen werden."
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
      "users.create",
      "users.manage_permissions",
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen Benutzer erstellen.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as CreateAdminUserBody;

    const name =
      body.name?.trim();

    const email =
      body.email?.trim().toLowerCase();

    const username =
      normalizeUsername(
        body.username ||
        email?.split(
          "@"
        )[0] ||
        name ||
        ""
      );

    const password =
      body.password ||
      "";

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

    if (!email) {
      return NextResponse.json(
        {
          message:
            "E-Mail ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!username) {
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

    if (!password) {
      return NextResponse.json(
        {
          message:
            "Vordefiniertes Passwort ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const existingUser =
      await queryOne<{
        id: string;
        email: string;
        username: string | null;
      }>(
        `
        SELECT
          id,
          email,
          username
        FROM admin_users
        WHERE LOWER(email) = LOWER($1)
        OR LOWER(username) = LOWER($2)
        LIMIT 1
        `,
        [
          email,
          username,
        ]
      );

    if (existingUser) {
      if (
        existingUser.email.toLowerCase() ===
        email
      ) {
        return NextResponse.json(
          {
            message:
              "Diese E-Mail-Adresse ist bereits vergeben.",
          },
          {
            status:
              409,
          }
        );
      }

      return NextResponse.json(
        {
          message:
            "Dieser Benutzername ist bereits vergeben.",
        },
        {
          status:
            409,
        }
      );
    }

    const passwordHash =
      await hashPassword(
        password
      );

    const row =
      await queryOne<AdminUserWithLoginRow>(
        `
        INSERT INTO admin_users (
          name,
          email,
          username,
          password_hash,
          password_must_change,
          role,
          status,
          company_id,
          department_id,
          company,
          department
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
          $10,
          $11
        )
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
          name,
          email,
          username,
          passwordHash,
          body.passwordMustChange !== false,
          normalizeRole(
            body.role
          ),
          normalizeStatus(
            body.status
          ),
          body.companyId ||
            null,
          body.departmentId ||
            null,
          body.company ||
            "Intern",
          body.department || "",
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Benutzer konnte nicht erstellt werden.",
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
            "Benutzer konnte nicht erstellt werden."
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
