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
  mapCompanyRow,
} from "../../../lib/database/mappers/companyMapper";

import type {
  CompanyRow,
} from "../../../lib/database/mappers/companyMapper";

type CreateCompanyBody = {
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
};

export async function GET() {
  try {
    const rows =
      await query<CompanyRow>(
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
        ORDER BY name ASC
        `
      );

    return NextResponse.json(
      rows.map(
        mapCompanyRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Firmen konnten nicht geladen werden.",

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
      await request.json() as CreateCompanyBody;

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

    const slug =
      body.slug?.trim()
        ? createSlug(
            body.slug
          )
        : createSlug(
            name
          );

    const row =
      await queryOne<CompanyRow>(
        `
        INSERT INTO companies (
          name,
          slug,
          description,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
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
          name,
          slug,
          body.description?.trim() ||
            "",
          body.status ||
            "active",
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Firma konnte nicht erstellt werden.",
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
          "Firma konnte nicht erstellt werden.",

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