import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../../../lib/database/db";

type RouteContext = {
  params: Promise<{
    departmentId: string;
  }>;
};

type SaveDepartmentPermissionsBody = {
  permissionKeys?: string[];
};

type DepartmentPermissionRow = {
  permission_key: string;
};

function createPermissionId(
  departmentId: string,
  permissionKey: string
) {
  return [
    "department",
    departmentId,
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
    const {
      departmentId,
    } =
      await context.params;

    const rows =
      await query<DepartmentPermissionRow>(
        `
        SELECT
          permission_key
        FROM department_permissions
        WHERE department_id = $1
        ORDER BY permission_key ASC
        `,
        [
          departmentId,
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
          "Abteilungsberechtigungen konnten nicht geladen werden.",

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

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      departmentId,
    } =
      await context.params;

    const body =
      await request.json() as SaveDepartmentPermissionsBody;

    const permissionKeys =
      Array.isArray(
        body.permissionKeys
      )
        ? body.permissionKeys
        : [];

    await query(
      `
      DELETE FROM department_permissions
      WHERE department_id = $1
      `,
      [
        departmentId,
      ]
    );

    for (const permissionKey of permissionKeys) {
      await query(
        `
        INSERT INTO department_permissions (
          id,
          department_id,
          permission_key
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (department_id, permission_key)
        DO NOTHING
        `,
        [
          createPermissionId(
            departmentId,
            permissionKey
          ),
          departmentId,
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
          "Abteilungsberechtigungen konnten nicht gespeichert werden.",

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