import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  mapActivityRow,
} from "../../../lib/database/mappers/activityMapper";

import type {
  ActivityRow,
} from "../../../lib/database/mappers/activityMapper";

type CreateActivityBody = {
  type?: string;
  title?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  userName?: string;
  userEmail?: string;
  user?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const type =
      url.searchParams.get(
        "type"
      );

    const entityType =
      url.searchParams.get(
        "entityType"
      );

    const entityId =
      url.searchParams.get(
        "entityId"
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

    if (type) {
      params.push(
        type
      );

      whereParts.push(
        `type = $${params.length}`
      );
    }

    if (
      entityType &&
      entityId
    ) {
      params.push(
        entityType
      );

      whereParts.push(
        `entity_type = $${params.length}`
      );

      params.push(
        entityId
      );

      whereParts.push(
        `entity_id = $${params.length}`
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
      await query<ActivityRow>(
        `
        SELECT
          id,
          type,
          title,
          description,
          entity_type,
          entity_id,
          user_name,
          user_email,
          user_label,
          company_id,
          department_id,
          company,
          department,
          metadata,
          created_at
        FROM activities
        ${whereSql}
        ORDER BY created_at DESC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapActivityRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Aktivitäten konnten nicht geladen werden.",

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
      await request.json() as CreateActivityBody;

    if (!body.type) {
      return NextResponse.json(
        {
          message:
            "Aktivitätstyp ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        {
          message:
            "Titel ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const row =
      await queryOne<ActivityRow>(
        `
        INSERT INTO activities (
          type,
          title,
          description,
          entity_type,
          entity_id,
          user_name,
          user_email,
          user_label,
          company_id,
          department_id,
          company,
          department,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13
        )
        RETURNING
          id,
          type,
          title,
          description,
          entity_type,
          entity_id,
          user_name,
          user_email,
          user_label,
          company_id,
          department_id,
          company,
          department,
          metadata,
          created_at
        `,
        [
          body.type,
          body.title,
          body.description ||
            "",
          body.entityType ||
            "",
          body.entityId ||
            "",
          body.userName ||
            body.user ||
            "",
          body.userEmail ||
            "",
          body.user ||
            body.userName ||
            "Unbekannt",
          body.companyId ||
            null,
          body.departmentId ||
            null,
          body.company ||
            "Intern",
          body.department ||
            "Allgemein",
          body.metadata ||
            {},
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Aktivität konnte nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapActivityRow(
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
          "Aktivität konnte nicht gespeichert werden.",

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