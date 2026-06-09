import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { createSlug } from "../../../../lib/database/slug";
import {
  mapTaxonomyItemRow,
  type TaxonomyItemRow,
} from "../../../../lib/database/mappers/taxonomyMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateTaxonomyBody = {
  type?: string;
  target?: string;
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  status?: string;
};

function normalizeType(value?: string | null, fallback = "category") {
  if (value === "category" || value === "tag") {
    return value;
  }

  if (fallback === "tag") {
    return "tag";
  }

  return "category";
}

function normalizeTarget(value?: string | null, fallback = "ticket") {
  if (
    value === "ticket" ||
    value === "wiki" ||
    value === "news" ||
    value === "global"
  ) {
    return value;
  }

  if (
    fallback === "wiki" ||
    fallback === "news" ||
    fallback === "global"
  ) {
    return fallback;
  }

  return "ticket";
}

function normalizeStatus(value?: string | null, fallback = "active") {
  if (value === "active" || value === "inactive" || value === "archived") {
    return value;
  }

  if (fallback === "inactive" || fallback === "archived") {
    return fallback;
  }

  return "active";
}

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeSortOrder(value: unknown, fallback: unknown) {
  const numberValue = Number(value);

  if (Number.isFinite(numberValue)) {
    return Math.floor(numberValue);
  }

  const fallbackValue = Number(fallback);

  if (Number.isFinite(fallbackValue)) {
    return Math.floor(fallbackValue);
  }

  return 0;
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

async function findTaxonomyItem(id: string) {
  return queryOne<TaxonomyItemRow>(
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
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
}

export async function GET(_request: Request, context: RouteContext) {
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

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const row = await findTaxonomyItem(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(mapTaxonomyItemRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht geladen werden.",
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
    await requireAnyServerPermission(["taxonomy.manage", "settings.manage"]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateTaxonomyBody;

    const currentRow = await findTaxonomyItem(decodedId);

    if (!currentRow) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextName =
      body.name !== undefined ? normalizeText(body.name) : currentRow.name;

    if (!nextName) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const nextType =
      body.type !== undefined
        ? normalizeType(body.type, currentRow.type)
        : normalizeType(currentRow.type);

    const nextTarget =
      body.target !== undefined
        ? normalizeTarget(body.target, currentRow.target)
        : normalizeTarget(currentRow.target);

    const validationMessage = validateTaxonomyCombination(nextType, nextTarget);

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

    const nextSlug =
      body.slug !== undefined ? normalizeSlug(body.slug) : currentRow.slug || "";

    const row = await queryOne<TaxonomyItemRow>(
      `
        UPDATE taxonomy_items
        SET
          type = $1,
          target = $2,
          name = $3,
          slug = $4,
          description = $5,
          parent_id = $6,
          sort_order = $7,
          status = $8,
          updated_at = NOW()
        WHERE id = $9
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
        nextType,
        nextTarget,
        nextName,
        nextSlug,
        body.description !== undefined
          ? normalizeText(body.description)
          : currentRow.description || "",
        body.parentId !== undefined
          ? normalizeText(body.parentId) || null
          : currentRow.parent_id,
        body.sortOrder !== undefined
          ? normalizeSortOrder(body.sortOrder, currentRow.sort_order)
          : normalizeSortOrder(currentRow.sort_order, 0),
        body.status !== undefined
          ? normalizeStatus(body.status, currentRow.status)
          : normalizeStatus(currentRow.status),
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag konnte nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapTaxonomyItemRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht gespeichert werden.",
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
    await requireAnyServerPermission(["taxonomy.manage", "settings.manage"]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM taxonomy_items
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}