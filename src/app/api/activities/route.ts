import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type ActivityRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  user_name: string;
  user_email: string;
  user_display: string;
  company_id: string | null;
  department_id: string | null;
  company: string;
  department: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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

function mapActivityRow(
  row: ActivityRow
) {
  return {
    id:
      row.id,

    type:
      row.type,

    title:
      row.title,

    description:
      row.description,

    entityType:
      row.entity_type,

    entityId:
      row.entity_id,

    userName:
      row.user_name,

    userEmail:
      row.user_email,

    user:
      row.user_display,

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company,

    department:
      row.department,

    metadata:
      row.metadata ||
      {},

    createdAt:
      row.created_at,
  };
}

function createActivityId() {
  return `activity-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
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

export async function GET(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "activity.view",
      "activity.manage",
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

    if (entityType) {
      params.push(
        entityType
      );

      whereParts.push(
        `entity_type = $${params.length}`
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

    if (currentUser.role !== "admin") {
      if (currentUser.departmentId) {
        params.push(
          currentUser.departmentId
        );

        whereParts.push(
          `department_id = $${params.length}`
        );
      } else if (currentUser.companyId) {
        params.push(
          currentUser.companyId
        );

        whereParts.push(
          `company_id = $${params.length}`
        );
      } else {
        whereParts.push(
          "1 = 0"
        );
      }
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
          user_display,
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
          getErrorMessage(
            error,
            "Aktivitäten konnten nicht geladen werden."
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

export async function POST(
  request: Request
) {
  try {
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

    const body =
      await request.json() as CreateActivityBody;

    const title =
      body.title?.trim();

    if (!title) {
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
          id,
          type,
          title,
          description,
          entity_type,
          entity_id,
          user_name,
          user_email,
          user_display,
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
          $13,
          $14
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
          user_display,
          company_id,
          department_id,
          company,
          department,
          metadata,
          created_at
        `,
        [
          createActivityId(),
          body.type ||
            "system",
          title,
          body.description?.trim() ||
            "",
          body.entityType ||
            "system",
          body.entityId ||
            "",
          body.userName ||
            currentUser.name ||
            "System",
          body.userEmail ||
            currentUser.email ||
            "",
          body.user ||
            body.userName ||
            currentUser.name ||
            "System",
          body.companyId ||
            currentUser.companyId ||
            null,
          body.departmentId ||
            currentUser.departmentId ||
            null,
          body.company ||
            currentUser.company ||
            "Intern",
          body.department ||
            currentUser.department ||
            "Allgemein",
          body.metadata ||
            {},
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Aktivität konnte nicht erstellt werden.",
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
          getErrorMessage(
            error,
            "Aktivität konnte nicht erstellt werden."
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