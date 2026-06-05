import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  createSlug,
} from "../../../lib/database/slug";

import {
  mapTaxonomyItemRow,
} from "../../../lib/database/mappers/taxonomyMapper";

import type {
  TaxonomyItemRow,
} from "../../../lib/database/mappers/taxonomyMapper";

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

function normalizeType(
  value?: string
) {
  if (
    value === "category" ||
    value === "tag"
  ) {
    return value;
  }

  return "category";
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

  return "ticket";
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

  return "active";
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const type =
      url.searchParams.get(
        "type"
      );

    const target =
      url.searchParams.get(
        "target"
      );

    const status =
      url.searchParams.get(
        "status"
      );

    const parentId =
      url.searchParams.get(
        "parentId"
      );

    const params: unknown[] =
      [];

    const whereParts: string[] =
      [];

    if (type) {
      params.push(
        type
      );

      whereParts.push(
        `type = $${params.length}`
      );
    }

    if (target) {
      params.push(
        target
      );

      whereParts.push(
        `target = $${params.length}`
      );
    }

    if (status) {
      params.push(
        status
      );

      whereParts.push(
        `status = $${params.length}`
      );
    }

    if (parentId) {
      params.push(
        parentId
      );

      whereParts.push(
        `parent_id = $${params.length}`
      );
    }

    const whereSql =
      whereParts.length > 0
        ? `WHERE ${whereParts.join(
            " AND "
          )}`
        : "";

    const rows =
      await query<TaxonomyItemRow>(
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
          ORDER BY
            target ASC,
            type ASC,
            sort_order ASC,
            name ASC
        `,
        params
      );

    return NextResponse.json(
      rows.map(
        mapTaxonomyItemRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Taxonomie konnte nicht geladen werden.",

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

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json() as CreateTaxonomyBody;

    const name =
      body.name?.trim();

    if (!name) {
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

    const type =
      normalizeType(
        body.type
      );

    const target =
      normalizeTarget(
        body.target
      );

    const slug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : createSlug(
            name
          );

    const row =
      await queryOne<TaxonomyItemRow>(
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
            $6,
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
          slug,
          body.description?.trim() ||
            "",
          body.parentId ||
            null,
          Number(
            body.sortOrder ||
              0
          ),
          normalizeStatus(
            body.status
          ),
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Taxonomie-Eintrag konnte nicht erstellt werden.",
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
          "Taxonomie-Eintrag konnte nicht erstellt werden.",

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