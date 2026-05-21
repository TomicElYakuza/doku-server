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
  mapDepartmentRow,
} from "../../../../lib/database/mappers/companyMapper";

import type {
  DepartmentRow,
} from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateDepartmentBody = {
  companyId?: string;
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
      await queryOne<DepartmentRow>(
        `
        SELECT
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM departments
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
            "Abteilung nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapDepartmentRow(
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
          "Abteilung konnte nicht geladen werden.",

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
      await request.json() as UpdateDepartmentBody;

    const current =
      await queryOne<DepartmentRow>(
        `
        SELECT
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        FROM departments
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
            "Abteilung nicht gefunden.",
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
      await queryOne<DepartmentRow>(
        `
        UPDATE departments
        SET
          company_id = $1,
          name = $2,
          slug = $3,
          description = $4,
          status = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
        `,
        [
          body.companyId ||
            current.company_id,
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
            "Abteilung konnte nicht aktualisiert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapDepartmentRow(
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
          "Abteilung konnte nicht aktualisiert werden.",

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
      DELETE FROM departments
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
          "Abteilung konnte nicht gelöscht werden.",

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