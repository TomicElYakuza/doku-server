import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../../../lib/database/db";

import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

type SaveCompanyPermissionsBody = {
  permissionKeys?: string[];
};

type CompanyPermissionRow = {
  permission_key: string;
};

function createPermissionId(
  companyId: string,
  permissionKey: string
) {
  return [
    "company",
    companyId,
    permissionKey,
  ]
    .join("_")
    .replace(
      /[^a-zA-Z0-9_.-]/g,
      "_"
    );
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
    ]);

    const {
      companyId,
    } =
      await context.params;

    const rows =
      await query<CompanyPermissionRow>(
        `
        SELECT
          permission_key
        FROM company_permissions
        WHERE company_id = $1
        ORDER BY permission_key ASC
        `,
        [
          companyId,
        ]
      );

    return NextResponse.json(
      rows.map(
        (row) =>
          row.permission_key
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          isPermissionError(
            error
          )
            ? "Keine Berechtigung."
            : "Firmenberechtigungen konnten nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          isPermissionError(
            error
          )
            ? 403
            : 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
    ]);

    const {
      companyId,
    } =
      await context.params;

    const body =
      await request.json() as SaveCompanyPermissionsBody;

    const permissionKeys =
      Array.isArray(
        body.permissionKeys
      )
        ? body.permissionKeys
        : [];

    await query(
      `
      DELETE FROM company_permissions
      WHERE company_id = $1
      `,
      [
        companyId,
      ]
    );

    for (const permissionKey of permissionKeys) {
      await query(
        `
        INSERT INTO company_permissions (
          id,
          company_id,
          permission_key
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (company_id, permission_key)
        DO NOTHING
        `,
        [
          createPermissionId(
            companyId,
            permissionKey
          ),
          companyId,
          permissionKey,
        ]
      );
    }

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
          isPermissionError(
            error
          )
            ? "Keine Berechtigung."
            : "Firmenberechtigungen konnten nicht gespeichert werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          isPermissionError(
            error
          )
            ? 403
            : 500,
      }
    );
  }
}