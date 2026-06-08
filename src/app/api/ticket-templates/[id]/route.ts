import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  mapTicketTemplateRow,
  type TicketTemplateRow,
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

type UpdateTicketTemplateBody = {
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

function userCanAccessTemplate(
  currentUser: ServerUser,
  template: TicketTemplateRow,
) {
  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.departmentId &&
    template.department_id === currentUser.departmentId
  ) {
    return true;
  }

  if (currentUser.companyId && template.company_id === currentUser.companyId) {
    return true;
  }

  return false;
}

async function findTicketTemplate(id: string) {
  return queryOne<TicketTemplateRow>(
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
      "tickets.templates.view",
      "tickets.templates.create",
      "tickets.templates.edit",
      "tickets.templates.delete",
      "tickets.view",
      "admin.view",
    ]);

    const { id } = await context.params;
    const row = await findTicketTemplate(decodeURIComponent(id));

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTemplate(currentUser, row)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapTicketTemplateRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket-Vorlage konnte nicht geladen werden.",
        ),
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
      "tickets.templates.edit",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateTicketTemplateBody;

    const current = await findTicketTemplate(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "Ticket-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTemplate(currentUser, current)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
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
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<TicketTemplateRow>(
      `
        UPDATE ticket_templates
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
          tags = $11,
          updated_at = NOW()
        WHERE id = $12
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
        Array.isArray(body.tags) ? normalizeTags(body.tags) : current.tags || [],
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Ticket-Vorlage konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapTicketTemplateRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Ticket-Vorlage konnte nicht aktualisiert werden.",
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

    await requireAnyServerPermission([
      "tickets.templates.delete",
      "settings.manage",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const current = await findTicketTemplate(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "Ticket-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessTemplate(currentUser, current)) {
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
        DELETE FROM ticket_templates
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
        message: getErrorMessage(
          error,
          "Ticket-Vorlage konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}