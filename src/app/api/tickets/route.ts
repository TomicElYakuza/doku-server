import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapTicketRow,
} from "../../../lib/database/mappers/ticketMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type {
  TicketRow,
} from "../../../lib/database/mappers/ticketMapper";

type CreateTicketBody = {
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
  createdBy?: string;
  tags?: string[];
};

const allowedStatusValues = [
  "open",
  "in_progress",
  "waiting",
  "done",
  "closed",
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

  return error instanceof Error ? error.message : fallback;
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
    return "open";
  }

  if (!allowedStatusValues.includes(normalized)) {
    return "open";
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

export async function GET(request: Request) {
  try {
    await requireAnyServerPermission([
      "tickets.view",
      "tickets.manage",
      "tickets.create",
      "tickets.edit",
      "tickets.assign",
      "tickets.close",
      "tickets.delete",
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

    const url = new URL(request.url);

    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const companyId = url.searchParams.get("companyId");
    const departmentId = url.searchParams.get("departmentId");

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (status) {
      params.push(status);
      whereParts.push(`status = $${params.length}`);
    }

    if (priority) {
      params.push(priority);
      whereParts.push(`priority = $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (tag) {
      params.push(tag);
      whereParts.push(`$${params.length} = ANY(tags)`);
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

    const whereSql = whereParts.length > 0
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const rows = await query<TicketRow>(
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
          created_by,
          tags,
          created_at,
          updated_at
        FROM tickets
        ${whereSql}
        ORDER BY id DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapTicketRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Tickets konnten nicht geladen werden.",
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

    const body = await request.json() as CreateTicketBody;

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
      ? normalizeText(body.department) || currentUser.department || "Allgemein"
      : currentUser.department || "Allgemein";

    const createdBy = normalizeText(body.createdBy) || currentUser.name || "System";

    const row = await queryOne<TicketRow>(
      `
        INSERT INTO tickets (
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
          created_by,
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
          created_by,
          tags,
          created_at,
          updated_at
      `,
      [
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
        createdBy,
        tags,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapTicketRow(row),
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
          "Ticket konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}