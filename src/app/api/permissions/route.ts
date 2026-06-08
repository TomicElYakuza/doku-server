import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../lib/database/db";

import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type PermissionRow = {
  id: string;
  permission_key: string;
  label: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
};

function mapPermissionRow(
  row: PermissionRow
) {
  return {
    id:
      row.id,

    permissionKey:
      row.permission_key,

    label:
      row.label,

    description:
      row.description,

    category:
      row.category,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
    ]);

    const rows =
      await query<PermissionRow>(
        `
        SELECT
          id,
          permission_key,
          label,
          description,
          category,
          created_at,
          updated_at
        FROM permissions
        ORDER BY category ASC, label ASC
        `
      );

    return NextResponse.json(
      rows.map(
        mapPermissionRow
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
            : "Berechtigungen konnten nicht geladen werden.",

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
