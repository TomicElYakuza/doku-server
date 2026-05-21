import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../../lib/database/db";

import {
  mapAdminUserRow,
} from "../../../../../lib/database/mappers/adminUserMapper";

import type {
  AdminUserRow,
} from "../../../../../lib/database/mappers/adminUserMapper";

type RouteContext = {
  params: Promise<{
    email: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      email,
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
        WHERE LOWER(email) = LOWER($1)
        `,
        [
          decodeURIComponent(
            email
          ),
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
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      email,
    } =
      await context.params;

    const row =
      await queryOne<AdminUserRow>(
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
          updated_at
        `,
        [
          decodeURIComponent(
            email
          ),
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
          "Letzter Login konnte nicht aktualisiert werden.",

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