import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  createSlug,
} from "../../../../lib/database/slug";

import {
  mapTaxonomyItemRow,
} from "../../../../lib/database/mappers/taxonomyMapper";

import type {
  TaxonomyItemRow,
} from "../../../../lib/database/mappers/taxonomyMapper";

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

function normalizeType(
  value?: string
) {
  if (
    value === "category" ||
    value === "tag"
  ) {
    return value;
  }

  return undefined;
}

function normalizeTarget(
  value?: string
) {
  if (
    value === "ticket" ||
    value === "wiki" ||
    value === "global"
  ) {
    return value;
  }

  return undefined;
}

function normalizeStatus(
  value?: string
) {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "archived"
  ) {
    return value;
  }

  return undefined;
}

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
      await queryOne<TaxonomyItemRow>(
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
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapTaxonomyItemRow(
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
          "Taxonomie-Eintrag konnte nicht geladen werden.",

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
      await request.json() as UpdateTaxonomyBody;

    const currentRow =
      await queryOne<TaxonomyItemRow>(
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
        `,
        [
          id,
        ]
      );

    if (!currentRow) {
      return NextResponse.json(
        {
          message:
            "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const nextName =
      body.name !== undefined
        ? body.name.trim()
        : currentRow.name;

    if (!nextName) {
      return NextResponse.json(
        {
          message:
            "Name ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const nextSlug =
      body.slug !== undefined
        ? createSlug(
            body.slug ||
              nextName
          )
        : currentRow.slug;

    const row =
      await queryOne<TaxonomyItemRow>(
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
            status = $8
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
          normalizeType(
            body.type
          ) ||
            currentRow.type,
          normalizeTarget(
            body.target
          ) ||
            currentRow.target,
          nextName,
          nextSlug,
          body.description !== undefined
            ? body.description.trim()
            : currentRow.description ||
              "",
          body.parentId !== undefined
            ? body.parentId ||
              null
            : currentRow.parent_id,
          body.sortOrder !== undefined
            ? Number(
                body.sortOrder
              )
            : Number(
                currentRow.sort_order ||
                  0
              ),
          normalizeStatus(
            body.status
          ) ||
            currentRow.status,
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Taxonomie-Eintrag konnte nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapTaxonomyItemRow(
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
          "Taxonomie-Eintrag konnte nicht gespeichert werden.",

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
        DELETE FROM taxonomy_items
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
          "Taxonomie-Eintrag konnte nicht gelöscht werden.",

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
