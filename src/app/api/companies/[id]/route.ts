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
  mapCompanyRow,
} from "../../../../lib/database/mappers/companyMapper";

import type {
  CompanyRow,
} from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateCompanyBody = {
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
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
      await queryOne<CompanyRow>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM companies
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
            "Firma nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapCompanyRow(
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
          "Firma konnte nicht geladen werden.",

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
      await request.json() as UpdateCompanyBody;

    const current =
      await queryOne<CompanyRow>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM companies
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
            "Firma nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const nextName =
      body.name?.trim() ||
      current.name;

    const nextSlug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : current.slug;

    const row =
      await queryOne<CompanyRow>(
        `
        UPDATE companies
        SET
          name = $1,
          slug = $2,
          description = $3,
          status = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        `,
        [
          nextName,
          nextSlug,
          body.description !== undefined
            ? body.description.trim()
            : current.description ||
              "",
          body.status ||
            current.status,
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapCompanyRow(
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
          "Firma konnte nicht aktualisiert werden.",

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
      DELETE FROM companies
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
          "Firma konnte nicht gelöscht werden.",

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