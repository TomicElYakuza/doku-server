import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";
import {
  mapTicketRow,
} from "../../../../lib/database/mappers/ticketMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  TicketRow,
} from "../../../../lib/database/mappers/ticketMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateTicketBody = {
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

type CurrentServerUser = Awaited<
  ReturnType<typeof getCurrentServerUser>
>;

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

  return error instanceof Error
    ? error.message
    : fallback;
}

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string | null) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeStatus(
  value: string | undefined,
  fallback: string,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return fallback;
  }

  if (!allowedStatusValues.includes(normalized)) {
    return fallback;
  }

  return normalized;
}

function normalizePriority(
  value: string | undefined,
  fallback: string,
) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return fallback;
  }

  if (!allowedPriorityValues.includes(normalized)) {
    return fallback;
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

function userCanAccessTicket(
  currentUser: CurrentServerUser,
  ticket: TicketRow,
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.departmentId &&
    ticket.department_id === currentUser.departmentId
  ) {
    return true;
  }

  if (
    currentUser.companyId &&
    ticket.company_id === currentUser.companyId
  ) {
    return true;
  }

  return false;
}

function statusIsClosing(
  nextStatus: string | undefined,
  currentStatus: string,
) {
  return (
    nextStatus === "closed" &&
    currentStatus !== "closed"
  );
}

function assignmentIsChanging(
  nextAssignedTo: string | undefined,
  currentAssignedTo: string | null,
) {
  if (nextAssignedTo === undefined) {
    return false;
  }

  return nextAssignedTo !== (currentAssignedTo || "");
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

    const {
      id,
    } = await context.params;

    const row = await queryOne<TicketRow>(
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
        WHERE id = $1
      `,
      [
        id,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTicket(currentUser, row)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapTicketRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket konnte nicht geladen werden.",
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "tickets.edit",
      "tickets.assign",
      "tickets.close",
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

    const {
      id,
    } = await context.params;

    const body = (await request.json()) as UpdateTicketBody;

    const current = await queryOne<TicketRow>(
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
        WHERE id = $1
      `,
      [
        id,
      ],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Ticket nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTicket(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    if (statusIsClosing(body.status, current.status)) {
      await requireAnyServerPermission([
        "tickets.close",
        "tickets.manage",
      ]);
    }

    if (assignmentIsChanging(body.assignedTo, current.assigned_to)) {
      await requireAnyServerPermission([
        "tickets.assign",
        "tickets.manage",
      ]);
    }

    const canChooseScope = currentUser.role === "admin";

    const nextTitle =
      body.title !== undefined
        ? normalizeText(body.title)
        : normalizeText(current.title);

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : normalizeText(current.category);

    if (!nextTitle) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextCategory) {
      return NextResponse.json(
        {
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const nextDescription =
      body.description !== undefined
        ? normalizeText(body.description)
        : normalizeText(current.description);

    const nextStatus = normalizeStatus(
      body.status,
      current.status,
    );

    const nextPriority = normalizePriority(
      body.priority,
      current.priority,
    );

    const nextCompanyId = canChooseScope
      ? body.companyId !== undefined
        ? normalizeNullableId(body.companyId)
        : current.company_id
      : current.company_id;

    const nextDepartmentId = canChooseScope
      ? body.departmentId !== undefined
        ? normalizeNullableId(body.departmentId)
        : current.department_id
      : current.department_id;

    const nextCompany = canChooseScope
      ? body.company !== undefined
        ? normalizeText(body.company) || "Intern"
        : normalizeText(current.company) || "Intern"
      : normalizeText(current.company) ||
        currentUser.company ||
        "Intern";

    const nextDepartment = canChooseScope
      ? body.department !== undefined
        ? normalizeText(body.department)
        : normalizeText(current.department)
      : normalizeText(current.department) ||
        currentUser.department ||
        "";

    const nextAssignedTo =
      body.assignedTo !== undefined
        ? normalizeText(body.assignedTo)
        : normalizeText(current.assigned_to);

    const nextCreatedBy =
      body.createdBy !== undefined
        ? normalizeText(body.createdBy)
        : normalizeText(current.created_by);

    const nextTags = Array.isArray(body.tags)
      ? normalizeTags(body.tags)
      : current.tags || [];

    const row = await queryOne<TicketRow>(
      `
        UPDATE tickets
        SET
          title = $1,
          description = $2,
          status = $3,
          priority = $4,
          category = $5,
          company_id = $6,
          department_id = $7,
          company = $8,
          department = $9,
          assigned_to = $10,
          created_by = $11,
          tags = $12,
          updated_at = NOW()
        WHERE id = $13
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
        nextTitle,
        nextDescription,
        nextStatus,
        nextPriority,
        nextCategory,
        nextCompanyId,
        nextDepartmentId,
        nextCompany,
        nextDepartment,
        nextAssignedTo,
        nextCreatedBy,
        nextTags,
        id,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapTicketRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket konnte nicht aktualisiert werden.",
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "tickets.delete",
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

    const {
      id,
    } = await context.params;

    const current = await queryOne<TicketRow>(
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
        WHERE id = $1
      `,
      [
        id,
      ],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Ticket nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTicket(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    await queryOne(
      `
        DELETE FROM tickets
        WHERE id = $1
        RETURNING id
      `,
      [
        id,
      ],
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket konnte nicht gelöscht werden.",
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