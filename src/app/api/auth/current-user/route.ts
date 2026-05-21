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

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    const email =
      cookieStore.get(
        AUTH_COOKIE_NAME
      )?.value || "";

    if (!email) {
      return NextResponse.json({
        user:
          null,
      });
    }

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
        WHERE LOWER(email) = LOWER($1)
        AND status = 'active'
        `,
        [
          decodeURIComponent(
            email
          ),
        ]
      );

    if (!row) {
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
      },
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        user:
          null,

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