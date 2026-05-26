import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../../lib/database/db";

import {
  mapAdminUserRow,
} from "../../../../../lib/database/mappers/adminUserMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

import type {
  AdminUserRow,
} from "../../../../../lib/database/mappers/adminUserMapper";

type RouteContext = {
  params: Promise<{
    email: string;
  }>;
};

type AdminUserWithLoginRow =
  AdminUserRow & {
    username: string | null;
    password_hash: string | null;
    password_must_change: boolean;
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
    currentUser.email.toLowerCase() ===
    targetUser.email.toLowerCase()
  ) {
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
      email,
    } =
      await context.params;

    const decodedEmail =
      decodeURIComponent(
        email
      );

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
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [
          decodedEmail,
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
  _request: Request,
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen Login-Daten aktualisieren.",
        },
        {
          status:
            403,
        }
      );
    }

    const {
      email,
    } =
      await context.params;

    const decodedEmail =
      decodeURIComponent(
        email
      );

    const row =
      await queryOne<AdminUserWithLoginRow>(
        `
        UPDATE admin_users
        SET
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE LOWER(email) = LOWER($1)
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
          decodedEmail,
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
          getErrorMessage(
            error,
            "Login-Daten konnten nicht aktualisiert werden."
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