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
    userId: string;
  }>;
};

type UserPermissionRow = {
  id: string;
  user_id: string;
  permission_key: string;
  scope_type: string;
  scope_id: string;
  created_at: string;
};

type SaveUserPermissionsBody = {
  permissions?: Array<{
    permissionKey?: string;
    scopeType?: string;
    scopeId?: string;
  }>;
};

function mapUserPermissionRow(
  row: UserPermissionRow
) {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    permissionKey:
      row.permission_key,

    scopeType:
      row.scope_type,

    scopeId:
      row.scope_id,

    createdAt:
      row.created_at,
  };
}

function createPermissionId(
  userId: string,
  permissionKey: string,
  scopeType: string,
  scopeId: string
) {
  return [
    "user",
    userId,
    permissionKey,
    scopeType,
    scopeId,
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
      userId,
    } =
      await context.params;

    const rows =
      await query<UserPermissionRow>(
        `
        SELECT
          id,
          user_id,
          permission_key,
          scope_type,
          scope_id,
          created_at
        FROM user_permissions
        WHERE user_id = $1
        ORDER BY permission_key ASC
        `,
        [
          userId,
        ]
      );

    return NextResponse.json(
      rows.map(
        mapUserPermissionRow
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
            : "Benutzerberechtigungen konnten nicht geladen werden.",

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
      userId,
    } =
      await context.params;

    const body =
      await request.json() as SaveUserPermissionsBody;

    const permissions =
      Array.isArray(
        body.permissions
      )
        ? body.permissions
        : [];

    await query(
      `
      DELETE FROM user_permissions
      WHERE user_id = $1
      `,
      [
        userId,
      ]
    );

    for (const permission of permissions) {
      const permissionKey =
        permission.permissionKey ||
        "";

      if (!permissionKey) {
        continue;
      }

      const scopeType =
        permission.scopeType ||
        "global";

      const scopeId =
        permission.scopeId ||
        "";

      await query(
        `
        INSERT INTO user_permissions (
          id,
          user_id,
          permission_key,
          scope_type,
          scope_id
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT (user_id, permission_key, scope_type, scope_id)
        DO NOTHING
        `,
        [
          createPermissionId(
            userId,
            permissionKey,
            scopeType,
            scopeId
          ),
          userId,
          permissionKey,
          scopeType,
          scopeId,
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
            : "Benutzerberechtigungen konnten nicht gespeichert werden.",

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
