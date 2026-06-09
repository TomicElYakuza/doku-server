import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import { createSlug } from "../../../lib/database/slug";
import {
  mapTaxonomyItemRow,
  type TaxonomyItemRow,
} from "../../../lib/database/mappers/taxonomyMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type CreateTaxonomyBody = {
  type?: string;
  target?: string;
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  status?: string;
};

function normalizeType(value?: string | null) {
  if (value === "category" || value === "tag") {
    return value;
  }

  return "category";
}

function normalizeTarget(value?: string | null) {
  if (
    value === "ticket" ||
    value === "wiki" ||
    value === "news" ||
    value === "global"
  ) {
    return value;
  }

  return "ticket";
}

function normalizeStatus(value?: string | null) {
  if (value === "active" || value === "inactive" || value === "archived") {
    return value;
  }

  return "active";
}

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeSortOrder(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.floor(numberValue);
}

function normalizeSlug(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  return createSlug(normalized);
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

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function validateTaxonomyCombination(type: string, target: string) {
  if (target === "global" && type === "category") {
    return "Globale Taxonomie darf nur Tags enthalten.";
  }

  return "";
}

export async function GET(request: Request) {
  try {
    await requireAnyServerPermission([
      "taxonomy.manage",
      "tickets.view",
      "tickets.create",
      "wiki.view",
      "wiki.create",
      "news.view",
      "news.create",
      "admin.view",
      "settings.manage",
    ]);

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const target = url.searchParams.get("target");
    const status = url.searchParams.get("status");
    const parentId = url.searchParams.get("parentId");

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (type) {
      params.push(normalizeType(type));
      whereParts.push(`type = $${params.length}`);
    }

    if (target) {
      params.push(normalizeTarget(target));
      whereParts.push(`target = $${params.length}`);
    }

    if (status) {
      params.push(normalizeStatus(status));
      whereParts.push(`status = $${params.length}`);
    }

    if (parentId) {
      params.push(parentId);
      whereParts.push(`parent_id = $${params.length}`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<TaxonomyItemRow>(
      `
        SELECT
          id,
          type,
          target,
          name,
          slug,
          description,
          parent_id,
          sort_order,
          status,
          created_at,
          updated_at
        FROM taxonomy_items
        ${whereSql}
        ORDER BY target ASC, type ASC, sort_order ASC, name ASC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapTaxonomyItemRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Taxonomie konnte nicht geladen werden."),
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
    await requireAnyServerPermission(["taxonomy.manage", "settings.manage"]);

    const body = (await request.json()) as CreateTaxonomyBody;

    const name = normalizeText(body.name);

    if (!name) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const type = normalizeType(body.type);
    const target = normalizeTarget(body.target);
    const status = normalizeStatus(body.status);
    const validationMessage = validateTaxonomyCombination(type, target);

    if (validationMessage) {
      return NextResponse.json(
        {
          message: validationMessage,
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<TaxonomyItemRow>(
      `
        INSERT INTO taxonomy_items (
          type,
          target,
          name,
          slug,
          description,
          parent_id,
          sort_order,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          NULLIF($6, ''),
          $7,
          $8
        )
        RETURNING
          id,
          type,
          target,
          name,
          slug,
          description,
          parent_id,
          sort_order,
          status,
          created_at,
          updated_at
      `,
      [
        type,
        target,
        name,
        normalizeSlug(body.slug),
        normalizeText(body.description),
        normalizeText(body.parentId),
        normalizeSortOrder(body.sortOrder),
        status,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapTaxonomyItemRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}