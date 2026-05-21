import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  mapTicketRow,
} from "../../../../lib/database/mappers/ticketMapper";

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
      await queryOne<TicketRow>(
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
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Ticket nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapTicketRow(
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
          "Ticket konnte nicht geladen werden.",

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
      await request.json() as UpdateTicketBody;

    const current =
      await queryOne<TicketRow>(
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
        ]
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Ticket nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const row =
      await queryOne<TicketRow>(
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
          body.createdBy !== undefined
            ? body.createdBy
            : current.created_by ||
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
            "Ticket konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapTicketRow(
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
          "Ticket konnte nicht aktualisiert werden.",

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
      DELETE FROM tickets
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
          "Ticket konnte nicht gelöscht werden.",

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