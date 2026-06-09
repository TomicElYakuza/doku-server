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
  user_label?: string | null;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string | Date;
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
  metadata?: Record<string, string | number | boolean | null>;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string | null) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeDate(value: unknown) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, string | number | boolean | null>;
}

function mapActivityRow(row: ActivityRow) {
  return {
    id: String(row.id),
    type: normalizeText(row.type) || "system",
    title: normalizeText(row.title),
    description: normalizeText(row.description),
    entityType: normalizeText(row.entity_type),
    entityId: normalizeText(row.entity_id),
    userName: normalizeText(row.user_name),
    userEmail: normalizeText(row.user_email),
    user: normalizeText(row.user_display || row.user_label || row.user_name) || "System",
    companyId: row.company_id ? String(row.company_id) : "",
    departmentId: row.department_id ? String(row.department_id) : "",
    company: normalizeText(row.company) || "Velunis",
    department: normalizeText(row.department),
    metadata: normalizeMetadata(row.metadata),
    createdAt: normalizeDate(row.created_at),
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

async function ensureActivitiesTable() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto"
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      entity_type TEXT NOT NULL DEFAULT '',
      entity_id TEXT NOT NULL DEFAULT '',
      user_name TEXT NOT NULL DEFAULT '',
      user_email TEXT NOT NULL DEFAULT '',
      user_display TEXT NOT NULL DEFAULT '',
      company_id UUID NULL,
      department_id UUID NULL,
      company TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE activities
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS entity_id TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS user_display TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS company_id UUID NULL
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS department_id UUID NULL
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  `);

  await query(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    UPDATE activities
    SET
      type = COALESCE(NULLIF(type, ''), 'system'),
      description = COALESCE(description, ''),
      entity_type = COALESCE(entity_type, ''),
      entity_id = COALESCE(entity_id, ''),
      user_name = COALESCE(user_name, ''),
      user_email = COALESCE(user_email, ''),
      user_display = COALESCE(user_display, user_name, ''),
      company = COALESCE(NULLIF(company, ''), 'Velunis'),
      department = COALESCE(department, ''),
      metadata = COALESCE(metadata, '{}'::jsonb),
      created_at = COALESCE(created_at, NOW())
  `);
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
    ]);

    await ensureActivitiesTable();

    const url = new URL(request.url);
    const type = normalizeText(url.searchParams.get("type"));
    const entityType = normalizeText(url.searchParams.get("entityType"));
    const entityId = normalizeText(url.searchParams.get("entityId"));
    const companyId = normalizeText(url.searchParams.get("companyId"));
    const departmentId = normalizeText(url.searchParams.get("departmentId"));

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

    await ensureActivitiesTable();

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
          $11, $12, $13
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
        normalizeText(body.type) || "system",
        title,
        normalizeText(body.description),
        normalizeText(body.entityType) || "system",
        normalizeText(body.entityId),
        normalizeText(body.userName) || currentUser.name || "System",
        normalizeText(body.userEmail) || currentUser.email || "",
        normalizeText(body.user || body.userName) || currentUser.name || "System",
        normalizeNullableId(body.companyId) || currentUser.companyId || null,
        normalizeNullableId(body.departmentId) || currentUser.departmentId || null,
        normalizeText(body.company) || currentUser.company || "Velunis",
        normalizeText(body.department) || currentUser.department || "",
        normalizeMetadata(body.metadata),
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