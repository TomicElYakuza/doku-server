import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type ActivityRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_display: string | null;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
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

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeLimit(value: string | null) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 100;
  }

  if (numberValue < 1) {
    return 1;
  }

  if (numberValue > 500) {
    return 500;
  }

  return Math.floor(numberValue);
}

function createActivityId() {
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapActivityRow(row: ActivityRow) {
  return {
    id: row.id,
    type: normalizeText(row.type) || "system",
    title: normalizeText(row.title),
    description: normalizeText(row.description),
    entityType: normalizeText(row.entity_type) || "system",
    entityId: normalizeText(row.entity_id),
    userName: normalizeText(row.user_name) || "System",
    userEmail: normalizeText(row.user_email),
    user:
      normalizeText(row.user_display) ||
      normalizeText(row.user_name) ||
      "System",
    userDisplay:
      normalizeText(row.user_display) ||
      normalizeText(row.user_name) ||
      "System",
    companyId: normalizeText(row.company_id),
    departmentId: normalizeText(row.department_id),
    company: normalizeText(row.company) || "Intern",
    department: normalizeText(row.department),
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
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

  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
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
      "activity.view",
      "admin.view",
      "settings.manage",
    ]);

    const url = new URL(request.url);
    const type = normalizeText(url.searchParams.get("type"));
    const entityType = normalizeText(url.searchParams.get("entityType"));
    const entityId = normalizeText(url.searchParams.get("entityId"));
    const userEmail = normalizeText(url.searchParams.get("userEmail"));
    const companyId = normalizeText(url.searchParams.get("companyId"));
    const departmentId = normalizeText(url.searchParams.get("departmentId"));
    const limit = normalizeLimit(url.searchParams.get("limit"));

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (type) {
      params.push(type);
      whereParts.push(`type = $${params.length}`);
    }

    if (entityType) {
      params.push(entityType);
      whereParts.push(`entity_type = $${params.length}`);
    }

    if (entityId) {
      params.push(entityId);
      whereParts.push(`entity_id = $${params.length}`);
    }

    if (userEmail) {
      params.push(userEmail);
      whereParts.push(`LOWER(user_email) = LOWER($${params.length})`);
    }

    if (companyId) {
      params.push(companyId);
      whereParts.push(`company_id = $${params.length}`);
    }

    if (departmentId) {
      params.push(departmentId);
      whereParts.push(`department_id = $${params.length}`);
    }

    if (currentUser.role !== "admin") {
      if (currentUser.departmentId) {
        params.push(currentUser.departmentId);
        whereParts.push(`department_id = $${params.length}`);
      } else if (currentUser.companyId) {
        params.push(currentUser.companyId);
        whereParts.push(`company_id = $${params.length}`);
      } else {
        whereParts.push("1 = 0");
      }
    }

    params.push(limit);
    const limitParamIndex = params.length;

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<ActivityRow>(
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
        LIMIT $${limitParamIndex}
      `,
      params,
    );

    return NextResponse.json(rows.map(mapActivityRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Aktivitäten konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
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
      "activity.view",
      "admin.view",
      "settings.manage",
    ]);

    const body = (await request.json()) as CreateActivityBody;
    const title = normalizeText(body.title);

    if (!title) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<ActivityRow>(
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
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14
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
        normalizeText(body.type) || "system",
        title,
        normalizeText(body.description),
        normalizeText(body.entityType) || "system",
        normalizeText(body.entityId),
        normalizeText(body.userName) || currentUser.name || "System",
        normalizeText(body.userEmail) || currentUser.email || "",
        normalizeText(body.user) ||
          normalizeText(body.userName) ||
          currentUser.name ||
          "System",
        normalizeText(body.companyId) || currentUser.companyId || null,
        normalizeText(body.departmentId) || currentUser.departmentId || null,
        normalizeText(body.company) || currentUser.company || "Intern",
        normalizeText(body.department) || currentUser.department || "",
        body.metadata || {},
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Aktivität konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapActivityRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Aktivität konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}