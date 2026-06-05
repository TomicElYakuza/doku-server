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

    const whereSql = whereParts.length > 0
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
        ORDER BY updated_at DESC
      `,
      params,
    );

    return NextResponse.json(
      rows.map(mapTicketTemplateRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Ticket-Vorlagen konnten nicht geladen werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateTicketTemplateBody;

    const title = normalizeText(body.title);
    const category = normalizeText(body.category);
    const description = normalizeText(body.description);
    const status = normalizeStatus(body.status);
    const priority = normalizePriority(body.priority);
    const companyId = normalizeNullableId(body.companyId);
    const departmentId = normalizeNullableId(body.departmentId);
    const company = normalizeText(body.company) || "Intern";
    const department = normalizeText(body.department) || "Allgemein";
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

    const row = await queryOne<TicketTemplateRow>(
      `
        INSERT INTO ticket_templates (
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
          $11
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
        message: "Ticket-Vorlage konnte nicht erstellt werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}