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

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

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

function userCanAccessTargetUser(
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  targetUser: AdminUserWithLoginRow
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.departmentId &&
    targetUser.department_id === currentUser.departmentId
  ) {
    return true;
  }

  if (
    currentUser.companyId &&
    targetUser.company_id === currentUser.companyId
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
      "users.view",
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
        LIMIT 1
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

    if (
      !userCanAccessTargetUser(
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
          getErrorMessage(
            error,
            "Benutzer konnte nicht geladen werden."
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
      "users.edit",
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

    const {
      id,
    } =
      await context.params;

    const existingUser =
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
        LIMIT 1
        `,
        [
          id,
        ]
      );

    if (!existingUser) {
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

    if (
      currentUser.role !== "admin"
    ) {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dÃ¼rfen Benutzer bearbeiten.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as UpdateAdminUserBody;

    const nextName =
      body.name?.trim() ||
      existingUser.name;

    const nextEmail =
      body.email?.trim().toLowerCase() ||
      existingUser.email;

    const nextUsername =
      normalizeUsername(
        body.username ||
        existingUser.username ||
        nextEmail.split(
          "@"
        )[0] ||
        nextName
      );

    const duplicateUser =
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
        WHERE id <> $1
        AND (
          LOWER(email) = LOWER($2)
          OR LOWER(username) = LOWER($3)
        )
        LIMIT 1
        `,
        [
          id,
          nextEmail,
          nextUsername,
        ]
      );

    if (duplicateUser) {
      if (
        duplicateUser.email.toLowerCase() ===
        nextEmail
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

    const password =
      body.password ||
      "";

    const passwordHash =
      password
        ? await hashPassword(
            password
          )
        : existingUser.password_hash;

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
          updated_at = NOW()
        WHERE id = $12
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
          passwordHash,
          typeof body.passwordMustChange === "boolean"
            ? body.passwordMustChange
            : existingUser.password_must_change,
          normalizeRole(
            body.role ||
            existingUser.role
          ),
          normalizeStatus(
            body.status ||
            existingUser.status
          ),
          body.companyId !== undefined
            ? body.companyId ||
              null
            : existingUser.company_id,
          body.departmentId !== undefined
            ? body.departmentId ||
              null
            : existingUser.department_id,
          body.company !== undefined
            ? body.company ||
              "Intern"
            : existingUser.company,
          body.department !== undefined
            ? body.department || ""
            : existingUser.department,
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
          getErrorMessage(
            error,
            "Benutzer konnte nicht aktualisiert werden."
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dÃ¼rfen Benutzer lÃ¶schen.",
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

    if (currentUser.id === id) {
      return NextResponse.json(
        {
          message:
            "Du kannst deinen eigenen Benutzer nicht lÃ¶schen.",
        },
        {
          status:
            400,
        }
      );
    }

    const row =
      await queryOne<{
        id: string;
      }>(
        `
        DELETE FROM admin_users
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
            "Benutzer nicht gefunden.",
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
            "Benutzer konnte nicht gelÃ¶scht werden."
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
