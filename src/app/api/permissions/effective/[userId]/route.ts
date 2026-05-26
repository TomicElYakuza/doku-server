import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../../../lib/database/db";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

type UserRow = {
  id: string;
  role: string;
  company_id: string | null;
  department_id: string | null;
};

type PermissionKeyRow = {
  permission_key: string;
};

const ADMIN_PERMISSION_KEY =
  "*";

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      userId,
    } =
      await context.params;

    const user =
      await queryOne<UserRow>(
        `
        SELECT
          id,
          role,
          company_id,
          department_id
        FROM admin_users
        WHERE id = $1
        LIMIT 1
        `,
        [
          userId,
        ]
      );

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Benutzer nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    if (user.role === "admin") {
      return NextResponse.json({
        permissionKeys: [
          ADMIN_PERMISSION_KEY,
        ],
      });
    }

    const permissionKeys =
      new Set<string>();

    if (user.company_id) {
      const companyPermissions =
        await query<PermissionKeyRow>(
          `
          SELECT
            permission_key
          FROM company_permissions
          WHERE company_id = $1
          `,
          [
            user.company_id,
          ]
        );

      companyPermissions.forEach(
        (permission) =>
          permissionKeys.add(
            permission.permission_key
          )
      );
    }

    if (user.department_id) {
      const departmentPermissions =
        await query<PermissionKeyRow>(
          `
          SELECT
            permission_key
          FROM department_permissions
          WHERE department_id = $1
          `,
          [
            user.department_id,
          ]
        );

      departmentPermissions.forEach(
        (permission) =>
          permissionKeys.add(
            permission.permission_key
          )
      );
    }

    const userPermissions =
      await query<PermissionKeyRow>(
        `
        SELECT
          permission_key
        FROM user_permissions
        WHERE user_id = $1
        `,
        [
          user.id,
        ]
      );

    userPermissions.forEach(
      (permission) =>
        permissionKeys.add(
          permission.permission_key
        )
    );

    if (user.role === "department_lead") {
      [
        "wiki.view",
        "wiki.create",
        "wiki.edit",
        "tickets.view",
        "tickets.create",
        "tickets.edit",
        "tickets.assign",
        "tickets.close",
        "files.view",
        "files.upload",
        "news.view",
        "users.view",
        "organization.view",
      ].forEach(
        (permissionKey) =>
          permissionKeys.add(
            permissionKey
          )
      );
    }

    if (user.role === "employee") {
      [
        "wiki.view",
        "tickets.view",
        "tickets.create",
        "files.view",
        "files.upload",
        "news.view",
      ].forEach(
        (permissionKey) =>
          permissionKeys.add(
            permissionKey
          )
      );
    }

    return NextResponse.json({
      permissionKeys:
        Array.from(
          permissionKeys
        ).sort(),
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Effektive Berechtigungen konnten nicht geladen werden.",

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