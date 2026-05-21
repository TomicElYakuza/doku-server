import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  createSlug,
} from "../../../lib/database/slug";

import {
  mapDepartmentRow,
} from "../../../lib/database/mappers/companyMapper";

import type {
  DepartmentRow,
} from "../../../lib/database/mappers/companyMapper";

type CreateDepartmentBody = {
  companyId?: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
};

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const companyId =
      url.searchParams.get(
        "companyId"
      );

    const onlyActive =
      url.searchParams.get(
        "active"
      ) === "true";

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (companyId) {
      params.push(
        companyId
      );

      whereParts.push(
        `company_id = $${params.length}`
      );
    }

    if (onlyActive) {
      params.push(
        "active"
      );

      whereParts.push(
        `status = $${params.length}`
      );
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<DepartmentRow>(
        `
        SELECT
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM departments
        ${whereSql}
        ORDER BY name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapDepartmentRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Abteilungen konnten nicht geladen werden.",

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
      await request.json() as CreateDepartmentBody;

    const name =
      body.name?.trim();

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

    if (!body.companyId) {
      return NextResponse.json(
        {
          message:
            "Firma ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const slug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : createSlug(
            name
          );

    const row =
      await queryOne<DepartmentRow>(
        `
        INSERT INTO departments (
          company_id,
          name,
          slug,
          description,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        `,
        [
          body.companyId,
          name,
          slug,
          body.description?.trim() ||
            "",
          body.status ||
            "active",
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Abteilung konnte nicht erstellt werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapDepartmentRow(
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
          "Abteilung konnte nicht erstellt werden.",

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