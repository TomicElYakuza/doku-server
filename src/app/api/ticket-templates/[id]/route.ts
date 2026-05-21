import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapTicketTemplateRow,
} from "../../../../lib/database/mappers/ticketMapper";

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

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
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
          "Ticket-Vorlage konnte nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const body =
      await request.json() as UpdateTicketTemplateBody;

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
          body.companyId !== undefined
            ? body.companyId ||
              null
            : current.company_id,
          body.departmentId !== undefined
            ? body.departmentId ||
              null
            : current.department_id,
          body.company !== undefined
            ? body.company ||
              "Intern"
            : current.company ||
              "Intern",
          body.department !== undefined
            ? body.department ||
              "Allgemein"
            : current.department ||
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
          "Ticket-Vorlage konnte nicht aktualisiert werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

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
          "Ticket-Vorlage konnte nicht gelöscht werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}