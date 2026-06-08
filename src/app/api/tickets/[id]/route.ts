import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  mapTicketRow,
  type TicketRow,
} from "../../../../lib/database/mappers/ticketMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

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

type ServerUser = NonNullable<Awaited<ReturnType<typeof getCurrentServerUser>>>;

const allowedStatusValues = [
  "open",
  "in_progress",
  "waiting",
  "done",
  "closed",
];

const allowedPriorityValues = ["low", "medium", "high", "urgent"];

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableId(value?: string | null) {
  const normalized = normalizeText(value);

  return normalized || null;
}

function normalizeStatus(value: string | undefined, fallback: string) {
  const normalized = normalizeText(value);

  if (!normalized || !allowedStatusValues.includes(normalized)) {
    return fallback;
  }

  return normalized;
}

function normalizePriority(value: string | undefined, fallback: string) {
  const normalized = normalizeText(value);

  if (!normalized || !allowedPriorityValues.includes(normalized)) {
    return fallback;
  }

  return normalized;
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return Array.from(
    new Set(tags.map((tag) => String(tag).trim()).filter(Boolean)),
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

function userCanAccessTicket(currentUser: ServerUser, ticket: TicketRow) {
  if (currentUser.role === "admin") {
    return true;
  }

  if (currentUser.departmentId && ticket.department_id === currentUser.departmentId) {
    return true;
  }

  if (currentUser.companyId && ticket.company_id === currentUser.companyId) {
    return true;
  }

  return false;
}

function statusIsClosing(nextStatus: string | undefined, currentStatus: string) {
  return nextStatus === "closed" && currentStatus !== "closed";
}

function assignmentIsChanging(
  nextAssignedTo: string | undefined,
  currentAssignedTo: string | null,
) {
  if (nextAssignedTo === undefined) {
    return false;
  }

  return normalizeText(nextAssignedTo) !== normalizeText(currentAssignedTo);
}

async function findTicketById(id: string) {
  return queryOne<TicketRow>(
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
      LIMIT 1
    `,
    [id],
  );
}

export async function GET(_request: Request, context: RouteContext) {
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
      "tickets.view",
      "tickets.create",
      "tickets.edit",
      "tickets.assign",
      "tickets.close",
      "tickets.delete",
      "admin.view",
    ]);

    const { id } = await context.params;
    const row = await findTicketById(decodeURIComponent(id));

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
        message: getErrorMessage(error, "Ticket konnte nicht geladen werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
      "tickets.edit",
      "tickets.assign",
      "tickets.close",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateTicketBody;

    const current = await findTicketById(decodedId);

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
      await requireAnyServerPermission(["tickets.close", "settings.manage"]);
    }

    if (assignmentIsChanging(body.assignedTo, current.assigned_to)) {
      await requireAnyServerPermission(["tickets.assign", "settings.manage"]);
    }

    const canChooseScope = currentUser.role === "admin";

    const nextTitle =
      body.title !== undefined ? normalizeText(body.title) : current.title;

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : current.category || "";

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
          message: "Ticket-Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

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
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description || "",
        normalizeStatus(body.status, current.status),
        normalizePriority(body.priority, current.priority),
        nextCategory,
        canChooseScope
          ? body.companyId !== undefined
            ? normalizeNullableId(body.companyId)
            : current.company_id
          : current.company_id,
        canChooseScope
          ? body.departmentId !== undefined
            ? normalizeNullableId(body.departmentId)
            : current.department_id
          : current.department_id,
        canChooseScope
          ? body.company !== undefined
            ? normalizeText(body.company) || "Intern"
            : current.company || "Intern"
          : current.company || currentUser.company || "Intern",
        canChooseScope
          ? body.department !== undefined
            ? normalizeText(body.department)
            : current.department || ""
          : current.department || currentUser.department || "",
        body.assignedTo !== undefined
          ? normalizeText(body.assignedTo)
          : current.assigned_to || "",
        body.createdBy !== undefined
          ? normalizeText(body.createdBy) || "System"
          : current.created_by || "",
        Array.isArray(body.tags) ? normalizeTags(body.tags) : current.tags || [],
        decodedId,
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
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    await requireAnyServerPermission(["tickets.delete", "settings.manage"]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const current = await findTicketById(decodedId);

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

    await queryOne<{ id: string }>(
      `
        DELETE FROM tickets
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Ticket konnte nicht gelöscht werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}