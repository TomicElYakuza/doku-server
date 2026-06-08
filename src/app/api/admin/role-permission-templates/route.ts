import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../../lib/database/db";
import {
  mapRolePermissionTemplateRow,
} from "../../../../lib/database/mappers/rolePermissionTemplateMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  RolePermissionTemplateRow,
} from "../../../../lib/database/mappers/rolePermissionTemplateMapper";

type CreateTemplateBody = {
  key?: string;
  name?: string;
  description?: string;
  roleKey?: string;
  permissionKeys?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

function normalizeText(value?: string) {
  return String(value || "").trim();
}

function normalizeSortOrder(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.floor(numberValue);
}

function normalizePermissionKeys(permissionKeys?: string[]) {
  if (!Array.isArray(permissionKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      permissionKeys
        .map((permissionKey) => String(permissionKey).trim())
        .filter(Boolean),
    ),
  );
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const rows = await query<RolePermissionTemplateRow>(
      `
        SELECT
          template_key,
          name,
          description,
          role_key,
          permission_keys,
          is_default,
          is_active,
          sort_order,
          created_at,
          updated_at
        FROM role_permission_templates
        ORDER BY sort_order ASC, name ASC
      `,
    );

    return NextResponse.json(
      rows.map(mapRolePermissionTemplateRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlagen konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const body = await request.json() as CreateTemplateBody;

    const key = normalizeText(body.key);
    const name = normalizeText(body.name);

    if (!key) {
      return NextResponse.json(
        {
          message: "Template-Key ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<RolePermissionTemplateRow>(
      `
        INSERT INTO role_permission_templates (
          template_key,
          name,
          description,
          role_key,
          permission_keys,
          is_default,
          is_active,
          sort_order
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
          template_key,
          name,
          description,
          role_key,
          permission_keys,
          is_default,
          is_active,
          sort_order,
          created_at,
          updated_at
      `,
      [
        key,
        name,
        normalizeText(body.description),
        normalizeText(body.roleKey) || "employee",
        normalizePermissionKeys(body.permissionKeys),
        body.isDefault ?? false,
        body.isActive ?? true,
        normalizeSortOrder(body.sortOrder),
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapRolePermissionTemplateRow(row),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlage konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}
