import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { mapAdminUserRow } from "../../../../lib/database/mappers/adminUserMapper";
import { hashPassword } from "../../../../lib/password";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { AdminUserRow } from "../../../../lib/database/mappers/adminUserMapper";

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
};

type AdminUserWithLoginRow = AdminUserRow & {
  username: string | null;
  password_hash: string | null;
  password_must_change: boolean;
};

type ServerUser = NonNullable<Awaited<ReturnType<typeof getCurrentServerUser>>>;

type DatabaseError = Error & {
  code?: string;
  constraint?: string;
  detail?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string | null) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeEmail(value?: string | null) {
  return normalizeText(value).toLowerCase();
}

function normalizeUsername(value?: string | null) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function normalizeRole(value?: string | null, fallback = "employee") {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  if (value === "viewer") {
    return "viewer";
  }

  if (fallback === "admin") {
    return "admin";
  }

  if (fallback === "department_lead") {
    return "department_lead";
  }

  if (fallback === "viewer") {
    return "viewer";
  }

  return "employee";
}

function normalizeStatus(value?: string | null, fallback = "active") {
  if (value === "active") {
    return "active";
  }

  if (value === "inactive") {
    return "inactive";
  }

  if (value === "invited") {
    return "invited";
  }

  if (fallback === "inactive") {
    return "inactive";
  }

  if (fallback === "invited") {
    return "invited";
  }

  return "active";
}

function mapAdminUserWithLoginRow(row: AdminUserWithLoginRow) {
  return {
    ...mapAdminUserRow(row),
    username: row.username || "",
    passwordMustChange: Boolean(row.password_must_change),
    hasPassword: Boolean(row.password_hash),
  };
}

function getDatabaseErrorMessage(error: unknown) {
  const databaseError = error as DatabaseError;

  if (databaseError.code === "23505") {
    const detail = databaseError.detail || "";

    if (
      detail.includes("username") ||
      databaseError.constraint?.includes("username")
    ) {
      return "Dieser Benutzername ist bereits vergeben.";
    }

    if (
      detail.includes("email") ||
      databaseError.constraint?.includes("email")
    ) {
      return "Diese E-Mail-Adresse ist bereits vergeben.";
    }

    return "Benutzername oder E-Mail ist bereits vergeben.";
  }

  return databaseError.message || "Unbekannter Datenbankfehler.";
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return getDatabaseErrorMessage(error) || fallback;
}

function userCanAccessUser(currentUser: ServerUser, targetUser: AdminUserWithLoginRow) {
  if (currentUser.role === "admin") {
    return true;
  }

  if (currentUser.id === targetUser.id) {
    return true;
  }

  if (
    currentUser.departmentId &&
    targetUser.department_id === currentUser.departmentId
  ) {
    return true;
  }

  if (currentUser.companyId && targetUser.company_id === currentUser.companyId) {
    return true;
  }

  return false;
}

function userCanMutateTarget(currentUser: ServerUser, targetUser: AdminUserWithLoginRow) {
  if (currentUser.role === "admin") {
    return true;
  }

  return currentUser.id === targetUser.id;
}

function canAssignRole(currentUser: ServerUser, nextRole: string) {
  if (currentUser.role === "admin") {
    return true;
  }

  return nextRole !== "admin";
}

async function findAdminUserById(id: string) {
  return queryOne<AdminUserWithLoginRow>(
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
    [id],
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
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

    await requireAnyServerPermission([
      "users.view",
      "users.edit",
      "users.manage_permissions",
      "admin.view",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const row = await findAdminUserById(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessUser(currentUser, row)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapAdminUserWithLoginRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzer konnte nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
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

    await requireAnyServerPermission([
      "users.edit",
      "users.manage_permissions",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateAdminUserBody;

    const current = await findAdminUserById(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanMutateTarget(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    const isSelfUpdate = currentUser.id === current.id;
    const canEditAdministrativeFields = currentUser.role === "admin";

    const nextName =
      body.name !== undefined ? normalizeText(body.name) : current.name;

    const nextEmail =
      body.email !== undefined ? normalizeEmail(body.email) : current.email;

    const nextUsername =
      body.username !== undefined
        ? normalizeUsername(body.username)
        : current.username || "";

    const nextRole =
      canEditAdministrativeFields && body.role !== undefined
        ? normalizeRole(body.role, current.role)
        : current.role;

    const nextStatus =
      canEditAdministrativeFields && body.status !== undefined
        ? normalizeStatus(body.status, current.status)
        : current.status;

    const nextCompanyId =
      canEditAdministrativeFields && body.companyId !== undefined
        ? normalizeNullableId(body.companyId)
        : current.company_id;

    const nextDepartmentId =
      canEditAdministrativeFields && body.departmentId !== undefined
        ? normalizeNullableId(body.departmentId)
        : current.department_id;

    const nextCompany =
      canEditAdministrativeFields && body.company !== undefined
        ? normalizeText(body.company) || "Intern"
        : current.company || "Intern";

    const nextDepartment =
      canEditAdministrativeFields && body.department !== undefined
        ? normalizeText(body.department)
        : current.department || "";

    if (!nextName) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextEmail) {
      return NextResponse.json(
        {
          message: "E-Mail ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextUsername) {
      return NextResponse.json(
        {
          message: "Benutzername ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!canAssignRole(currentUser, nextRole)) {
      return NextResponse.json(
        {
          message: "Diese Rolle darf nicht vergeben werden.",
        },
        {
          status: 403,
        },
      );
    }

    if (isSelfUpdate && nextStatus !== "active") {
      return NextResponse.json(
        {
          message: "Du kannst deinen eigenen Benutzer nicht deaktivieren.",
        },
        {
          status: 400,
        },
      );
    }

    if (isSelfUpdate && current.role === "admin" && nextRole !== "admin") {
      return NextResponse.json(
        {
          message: "Du kannst dir selbst nicht die Administratorrolle entziehen.",
        },
        {
          status: 400,
        },
      );
    }

    const duplicate = await queryOne<{
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
      [decodedId, nextEmail, nextUsername],
    );

    if (duplicate) {
      if (duplicate.email.toLowerCase() === nextEmail) {
        return NextResponse.json(
          {
            message: "Diese E-Mail-Adresse ist bereits vergeben.",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json(
        {
          message: "Dieser Benutzername ist bereits vergeben.",
        },
        {
          status: 409,
        },
      );
    }

    const nextPasswordHash = body.password
      ? await hashPassword(String(body.password))
      : current.password_hash;

    const nextPasswordMustChange =
      body.passwordMustChange !== undefined
        ? Boolean(body.passwordMustChange)
        : current.password_must_change;

    const row = await queryOne<AdminUserWithLoginRow>(
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
        nextPasswordHash,
        nextPasswordMustChange,
        nextRole,
        nextStatus,
        nextCompanyId,
        nextDepartmentId,
        nextCompany,
        nextDepartment,
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Benutzer konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapAdminUserWithLoginRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzer konnte nicht aktualisiert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
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

    await requireAnyServerPermission([
      "users.delete",
      "users.manage_permissions",
      "settings.manage",
    ]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Benutzer löschen.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    if (currentUser.id === decodedId) {
      return NextResponse.json(
        {
          message: "Du kannst deinen eigenen Benutzer nicht löschen.",
        },
        {
          status: 400,
        },
      );
    }

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM admin_users
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzer konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}