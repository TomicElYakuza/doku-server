import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapTicketTemplateRow,
} from "../../../../lib/database/mappers/ticketMapper";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

import type {
  TicketTemplateRow,
} from "../../../../lib/database/mappers/ticketMapper";

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

function userCanAccessTemplate(
  currentUser: Awaited<ReturnType<typeof getCurrentServerUser>>,
  template: TicketTemplateRow
) {
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (
    currentUser.departmentId &&
    template.department_id === currentUser.departmentId
  ) {
    return true;
  }

  if (
    currentUser.companyId &&
    template.company_id === currentUser.companyId
  ) {
    return true;
  }

  return false;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "tickets.templates.view",
      "tickets.templates.manage",
      "tickets.templates.create",
      "tickets.templates.edit",
      "tickets.templates.delete",
      "tickets.manage",
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

    const {
      id,
    } =
      await context.params;

    const row =
      await queryOne<TicketTemplateRow>(
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
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Ticket-Vorlage nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      !userCanAccessTemplate(
        currentUser,
        row
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
        }
      );
    }

    return NextResponse.json(
      mapTicketTemplateRow(
        row
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
            "Ticket-Vorlage konnte nicht geladen werden."
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "tickets.templates.edit",
      "tickets.templates.manage",
      "tickets.manage",
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

    const {
      id,
    } =
      await context.params;

    const current =
      await queryOne<TicketTemplateRow>(
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
        `,
        [
          id,
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Ticket-Vorlage nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      !userCanAccessTemplate(
        currentUser,
        current
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
        }
      );
    }

    const body =
      await request.json() as UpdateTicketTemplateBody;

    const canChooseScope =
      currentUser.role === "admin";

    const row =
      await queryOne<TicketTemplateRow>(
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
          body.title?.trim() ||
            current.title,
          body.description !== undefined
            ? body.description.trim()
            : current.description ||
              "",
          body.status ||
            current.status,
          body.priority ||
            current.priority,
          body.category ||
            current.category ||
            "Allgemein",
          canChooseScope
            ? body.companyId !== undefined
              ? body.companyId ||
                null
              : current.company_id
            : current.company_id,
          canChooseScope
            ? body.departmentId !== undefined
              ? body.departmentId ||
                null
              : current.department_id
            : current.department_id,
          canChooseScope
            ? body.company !== undefined
              ? body.company ||
                "Intern"
              : current.company ||
                "Intern"
            : current.company ||
              currentUser.company ||
              "Intern",
          canChooseScope
            ? body.department !== undefined
              ? body.department ||
                "Allgemein"
              : current.department ||
                "Allgemein"
            : current.department ||
              currentUser.department ||
              "Allgemein",
          body.assignedTo !== undefined
            ? body.assignedTo
            : current.assigned_to ||
              "",
          Array.isArray(
            body.tags
          )
            ? body.tags
            : current.tags ||
              [],
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Ticket-Vorlage konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapTicketTemplateRow(
        row
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
            "Ticket-Vorlage konnte nicht aktualisiert werden."
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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "tickets.templates.delete",
      "tickets.templates.manage",
      "tickets.manage",
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

    const {
      id,
    } =
      await context.params;

    const current =
      await queryOne<TicketTemplateRow>(
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
        `,
        [
          id,
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Ticket-Vorlage nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      !userCanAccessTemplate(
        currentUser,
        current
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Keine Berechtigung.",
        },
        {
          status:
            403,
        }
      );
    }

    await queryOne(
      `
      DELETE FROM ticket_templates
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
      ]
    );

    return NextResponse.json({
      ok:
        true,
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Ticket-Vorlage konnte nicht gelöscht werden."
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