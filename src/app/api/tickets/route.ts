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

export async function GET(
  request: Request
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

    const url =
      new URL(
        request.url
      );

    const status =
      url.searchParams.get(
        "status"
      );

    const priority =
      url.searchParams.get(
        "priority"
      );

    const companyId =
      url.searchParams.get(
        "companyId"
      );

    const departmentId =
      url.searchParams.get(
        "departmentId"
      );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (status) {
      params.push(
        status
      );

      whereParts.push(
        `status = $${params.length}`
      );
    }

    if (priority) {
      params.push(
        priority
      );

      whereParts.push(
        `priority = $${params.length}`
      );
    }

    if (companyId) {
      params.push(
        companyId
      );

      whereParts.push(
        `company_id = $${params.length}`
      );
    }

    if (departmentId) {
      params.push(
        departmentId
      );

      whereParts.push(
        `department_id = $${params.length}`
      );
    }

    if (currentUser.role !== "admin") {
      if (currentUser.departmentId) {
        params.push(
          currentUser.departmentId
        );

        whereParts.push(
          `department_id = $${params.length}`
        );
      } else if (currentUser.companyId) {
        params.push(
          currentUser.companyId
        );

        whereParts.push(
          `company_id = $${params.length}`
        );
      } else {
        whereParts.push(
          "1 = 0"
        );
      }
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const rows =
      await query<TicketRow>(
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
        params
      );

    return NextResponse.json(
      rows.map(
        mapTicketRow
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
            "Tickets konnten nicht geladen werden."
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

export async function POST(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "tickets.create",
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

    const body =
      await request.json() as CreateTicketBody;

    const title =
      body.title?.trim();

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Titel ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const canChooseScope =
      currentUser.role === "admin";

    const companyId =
      canChooseScope
        ? body.companyId ||
          null
        : currentUser.companyId ||
          null;

    const departmentId =
      canChooseScope
        ? body.departmentId ||
          null
        : currentUser.departmentId ||
          null;

    const company =
      canChooseScope
        ? body.company ||
          currentUser.company ||
          "Intern"
        : currentUser.company ||
          "Intern";

    const department =
      canChooseScope
        ? body.department ||
          currentUser.department ||
          "Allgemein"
        : currentUser.department ||
          "Allgemein";

    const row =
      await queryOne<TicketRow>(
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
          body.description?.trim() ||
            "",
          body.status ||
            "open",
          body.priority ||
            "medium",
          body.category ||
            "Allgemein",
          companyId,
          departmentId,
          company,
          department,
          body.assignedTo ||
            "",
          body.createdBy ||
            currentUser.name ||
            "System",
          Array.isArray(
            body.tags
          )
            ? body.tags
            : [],
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Ticket konnte nicht erstellt werden.",
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
      ),
      {
        status:
          201,
      }
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
            "Ticket konnte nicht erstellt werden."
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