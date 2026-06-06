import {
  randomUUID,
} from "crypto";
import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapTicketTemplateRow,
} from "../../../lib/database/mappers/ticketMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type {
  TicketTemplateRow,
} from "../../../lib/database/mappers/ticketMapper";

type CreateTicketTemplateBody = {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  assignedTo?: string;
  tags?: string[];
};

const allowedStatusValues = [
  "active",
  "inactive",
];

const allowedPriorityValues = [
  "low",
  "medium",
  "high",
  "urgent",
];

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

function normalizeText(value?: string) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeStatus(value?: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "active";
  }

  if (!allowedStatusValues.includes(normalized)) {
    return "active";
  }

  return normalized;
}

function normalizePriority(value?: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "medium";
  }

  if (!allowedPriorityValues.includes(normalized)) {
    return "medium";
  }

  return normalized;
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "tickets.view",
      "tickets.create",
      "tickets.edit",
      "tickets.manage",
    ]);

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

    const params: unknown[] = [];
    const whereParts: string[] = [];

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
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows = await query<TicketTemplateRow>(
      `
        SELECT
          id,
          title,
          description,
          status,
          priority,
          category,
          company_id,
          department_id,
          company,
          department,
          assigned_to,
          tags,
          created_at,
          updated_at
        FROM ticket_templates
        ${whereSql}
        ORDER BY created_at DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapTicketTemplateRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket-Vorlagen konnten nicht geladen werden.",
        ),
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAnyServerPermission([
      "tickets.create",
      "tickets.manage",
    ]);

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

    const body = (await request.json()) as CreateTicketTemplateBody;

    const title = normalizeText(body.title);
    const category = normalizeText(body.category);
    const description = normalizeText(body.description);
    const status = normalizeStatus(body.status);
    const priority = normalizePriority(body.priority);
    const assignedTo = normalizeText(body.assignedTo);
    const tags = normalizeTags(body.tags);

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

    if (!category) {
      return NextResponse.json(
        {
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const canChooseScope = currentUser.role === "admin";

    const companyId = canChooseScope
      ? normalizeNullableId(body.companyId)
      : currentUser.companyId || null;

    const departmentId = canChooseScope
      ? normalizeNullableId(body.departmentId)
      : currentUser.departmentId || null;

    const company = canChooseScope
      ? normalizeText(body.company) || currentUser.company || "Intern"
      : currentUser.company || "Intern";

    const department = canChooseScope
      ? normalizeText(body.department)
      : currentUser.department || "";

    const row = await queryOne<TicketTemplateRow>(
      `
        INSERT INTO ticket_templates (
          id,
          title,
          description,
          status,
          priority,
          category,
          company_id,
          department_id,
          company,
          department,
          assigned_to,
          tags
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
          $12
        )
        RETURNING
          id,
          title,
          description,
          status,
          priority,
          category,
          company_id,
          department_id,
          company,
          department,
          assigned_to,
          tags,
          created_at,
          updated_at
      `,
      [
        randomUUID(),
        title,
        description,
        status,
        priority,
        category,
        companyId,
        departmentId,
        company,
        department,
        assignedTo,
        tags,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket-Vorlage konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapTicketTemplateRow(row),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket-Vorlage konnte nicht erstellt werden.",
        ),
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}