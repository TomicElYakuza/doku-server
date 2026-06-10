import { NextResponse } from "next/server";

import { query } from "../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type AssignableUserRow = {
  id: string;
  name: string;
  email: string;
};

let assignableUsersTablePromise: Promise<string | null> | null = null;

async function tableExists(tableName: string) {
  const rows = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return Boolean(rows[0]?.exists);
}

async function getAssignableUsersTable() {
  if (!assignableUsersTablePromise) {
    assignableUsersTablePromise = (async () => {
      const hasAdminUsers = await tableExists("admin_users");

      if (hasAdminUsers) {
        return "admin_users";
      }

      const hasUsers = await tableExists("users");

      if (hasUsers) {
        return "users";
      }

      return null;
    })().catch((error) => {
      assignableUsersTablePromise = null;
      throw error;
    });
  }

  return assignableUsersTablePromise;
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : "Benutzer konnten nicht geladen werden.";
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "tickets.assign",
      "tickets.edit",
      "inventory.assign",
      "inventory.edit",
      "service.assign",
      "service.edit",
      "users.view",
      "admin.view",
    ]);

    const tableName = await getAssignableUsersTable();

    if (!tableName) {
      return NextResponse.json([]);
    }

    const rows = await query<AssignableUserRow>(
      `
        SELECT
          id::text AS id,
          COALESCE(NULLIF(name, ''), email, id::text) AS name,
          COALESCE(email, '') AS email
        FROM ${tableName}
        ORDER BY name ASC, email ASC
      `,
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name || row.email || row.id,
        email: row.email || "",
      })),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error),
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}