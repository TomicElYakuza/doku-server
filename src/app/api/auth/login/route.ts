import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { mapAdminUserRow } from "../../../../lib/database/mappers/adminUserMapper";
import { verifyPassword } from "../../../../lib/password";
import type { AdminUserRow } from "../../../../lib/database/mappers/adminUserMapper";

const AUTH_COOKIE_NAME = "dms_user_email";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type LoginBody = {
  username?: string;
  password?: string;
};

type LoginUserRow = AdminUserRow & {
  username: string | null;
  password_hash: string | null;
  password_must_change: boolean;
};

function normalizeLoginName(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizePassword(value?: string | null) {
  return String(value || "");
}

function mapLoginUser(row: LoginUserRow) {
  const adminUser = mapAdminUserRow(row);

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    status: adminUser.status,
    companyId: adminUser.companyId,
    departmentId: adminUser.departmentId,
    company: adminUser.company,
    department: adminUser.department,
    username: row.username || "",
    passwordMustChange: Boolean(row.password_must_change),
  };
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const username = normalizeLoginName(body.username);
    const password = normalizePassword(body.password);

    if (!username) {
      return NextResponse.json(
        {
          message: "Benutzername ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          message: "Passwort ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<LoginUserRow>(
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
        WHERE (
            LOWER(username) = LOWER($1)
            OR LOWER(email) = LOWER($1)
          )
          AND status = 'active'
        LIMIT 1
      `,
      [username],
    );

    if (!row || !row.password_hash) {
      return NextResponse.json(
        {
          message: "Benutzername oder Passwort ist falsch.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordValid = await verifyPassword(password, row.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          message: "Benutzername oder Passwort ist falsch.",
        },
        {
          status: 401,
        },
      );
    }

    const updatedRow = await queryOne<LoginUserRow>(
      `
        UPDATE admin_users
        SET
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
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
      [row.id],
    );

    if (!updatedRow) {
      return NextResponse.json(
        {
          message: "Login konnte nicht abgeschlossen werden.",
        },
        {
          status: 500,
        },
      );
    }

    const user = mapLoginUser(updatedRow);
    const cookieStore = await cookies();

    cookieStore.set(
      AUTH_COOKIE_NAME,
      encodeURIComponent(user.email),
      getCookieOptions(),
    );

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Login konnte nicht durchgeführt werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}