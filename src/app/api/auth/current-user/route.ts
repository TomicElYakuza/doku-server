import {
  cookies,
} from "next/headers";

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

const AUTH_COOKIE_NAME =
  "dms_user_email";

type CurrentUserRow =
  AdminUserRow & {
    password_must_change: boolean;
  };

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const rawEmail =
      cookieStore.get(
        AUTH_COOKIE_NAME
      )?.value;

    if (!rawEmail) {
      return NextResponse.json({
        user:
          null,
      });
    }

    const email =
      decodeURIComponent(
        rawEmail
      );

    const row =
      await queryOne<CurrentUserRow>(
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
        AND status = 'active'
        LIMIT 1
        `,
        [
          email,
        ]
      );

    if (!row) {
      cookieStore.delete(
        AUTH_COOKIE_NAME
      );

      return NextResponse.json({
        user:
          null,
      });
    }

    const adminUser =
      mapAdminUserRow(
        row
      );

    return NextResponse.json({
      user: {
        id:
          adminUser.id,

        name:
          adminUser.name,

        email:
          adminUser.email,

        role:
          adminUser.role,

        companyId:
          adminUser.companyId,

        departmentId:
          adminUser.departmentId,

        company:
          adminUser.company,

        department:
          adminUser.department,

        passwordMustChange:
          Boolean(
            row.password_must_change
          ),
      },
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Aktueller Benutzer konnte nicht geladen werden.",

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
