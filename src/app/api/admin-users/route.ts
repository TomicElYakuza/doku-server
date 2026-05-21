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

import type {
  AdminUserRow,
} from "../../../lib/database/mappers/adminUserMapper";

type CreateAdminUserBody = {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
};

export async function GET(
  request: Request
) {
  try {
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

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<AdminUserRow>(
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
        ${whereSql}
        ORDER BY name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapAdminUserRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Benutzer konnten nicht geladen werden.",

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

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json() as CreateAdminUserBody;

    const name =
      body.name?.trim();

    const email =
      body.email?.trim().toLowerCase();

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

    const row =
      await queryOne<AdminUserRow>(
        `
        INSERT INTO admin_users (
          name,
          email,
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
          $8
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
          updated_at
        `,
        [
          name,
          email,
          body.role ||
            "viewer",
          body.status ||
            "active",
          body.companyId ||
            null,
          body.departmentId ||
            null,
          body.company ||
            "Intern",
          body.department ||
            "Allgemein",
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
      mapAdminUserRow(
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
          "Benutzer konnte nicht erstellt werden.",

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