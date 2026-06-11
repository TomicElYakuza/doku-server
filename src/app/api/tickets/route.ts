import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapTicketRow,
  type TicketRow,
} from "../../../lib/database/mappers/ticketMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

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

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string | null) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeStatus(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized || !allowedStatusValues.includes(normalized)) {
    return "open";
  }

  return normalized;
}

function normalizePriority(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized || !allowedPriorityValues.includes(normalized)) {
    return "medium";
  }

  return normalized;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 200;
  }

  return Math.min(
    Math.floor(parsed),
    500,
  );
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
    const currentUser =
      await getCurrentServerUser();

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
      "tickets.view",
      "admin.view",
    ]);

    const url = new URL(request.url);
    const status = normalizeText(url.searchParams.get("status"));
    const priority = normalizeText(url.searchParams.get("priority"));
    const category = normalizeText(url.searchParams.get("category"));
    const tag = normalizeText(url.searchParams.get("tag"));
    const companyId = normalizeText(url.searchParams.get("companyId"));
    const departmentId = normalizeText(url.searchParams.get("departmentId"));
    const hideClosed = url.searchParams.get("hideClosed");
    const limit = normalizeLimit(url.searchParams.get("limit"));

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

    if (hideClosed === "true") {
      whereParts.push(`status <> 'closed'`);
    }

    if (currentUser.role !== "admin") {
      const scopeParts: string[] = [];

      const currentUserDepartmentId =
        String(currentUser.departmentId || "").trim();

      const currentUserCompanyId =
        String(currentUser.companyId || "").trim();

      const currentUserDepartment =
        String(currentUser.department || "").trim();

      const currentUserCompany =
        String(currentUser.company || "").trim();

      if (currentUserDepartmentId) {
        params.push(currentUserDepartmentId);
        scopeParts.push(`department_id = $${params.length}`);
      }

      if (currentUserDepartment) {
        params.push(currentUserDepartment);
        scopeParts.push(`department = $${params.length}`);
      }

      if (!currentUserDepartmentId && !currentUserDepartment) {
        if (currentUserCompanyId) {
          params.push(currentUserCompanyId);
          scopeParts.push(`company_id = $${params.length}`);
        }

        if (currentUserCompany) {
          params.push(currentUserCompany);
          scopeParts.push(`company = $${params.length}`);
        }
      }

      const userScopeValues = [
        currentUser.name,
        currentUser.email,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      userScopeValues.forEach((value) => {
        params.push(`%${value}%`);
        scopeParts.push(`assigned_to ILIKE $${params.length}`);
        scopeParts.push(`created_by ILIKE $${params.length}`);
      });

      if (scopeParts.length > 0) {
        whereParts.push(`(${scopeParts.join(" OR ")})`);
      } else {
        whereParts.push("1 = 0");
      }
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    params.push(limit);

    const rows = await query(
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
        LIMIT $${params.length}
      `,
      params,
    );

    return NextResponse.json(
      (rows as TicketRow[]).map(mapTicketRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Tickets konnten nicht geladen werden.",
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
    const currentUser =
      await getCurrentServerUser();

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
      "tickets.create",
      "settings.manage",
    ]);

    const body =
      (await request.json()) as CreateTicketBody;

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
          message: "Ticket-Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const canChooseScope =
      currentUser.role === "admin";

    const companyId =
      canChooseScope
        ? normalizeNullableId(body.companyId)
        : currentUser.companyId || null;

    const departmentId =
      canChooseScope
        ? normalizeNullableId(body.departmentId)
        : currentUser.departmentId || null;

    const company =
      canChooseScope
        ? normalizeText(body.company) || currentUser.company || "Intern"
        : currentUser.company || "Intern";

    const department =
      canChooseScope
        ? normalizeText(body.department)
        : currentUser.department || "";

    const createdBy =
      normalizeText(body.createdBy) || currentUser.name || "System";

    const row = await queryOne(
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
      mapTicketRow(row as TicketRow),
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