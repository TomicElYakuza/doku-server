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

type LoginBody = {
  email?: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json() as LoginBody;

    const email =
      body.email?.trim().toLowerCase();

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

    const row =
      await queryOne<AdminUserRow>(
        `
        UPDATE admin_users
        SET
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE LOWER(email) = LOWER($1)
        AND status = 'active'
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
          email,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Benutzer nicht gefunden oder nicht aktiv.",
        },
        {
          status:
            401,
        }
      );
    }

    const adminUser =
      mapAdminUserRow(
        row
      );

    const cookieStore =
      await cookies();

    cookieStore.set(
      AUTH_COOKIE_NAME,
      encodeURIComponent(
        adminUser.email
      ),
      {
        httpOnly:
          true,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          60 * 60 * 24 * 7,
      }
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
        message:
          "Login konnte nicht durchgeführt werden.",

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