import {
  NextResponse,
} from "next/server";
import {
  queryOne,
} from "../../../../../lib/database/db";
import {
  mapRolePermissionTemplateRow,
} from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type {
  RolePermissionTemplateRow,
} from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

type UpdateTemplateBody = {
  name?: string;
  description?: string;
  roleKey?: string;
  permissionKeys?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeSortOrder(
  value: unknown,
  fallback: number,
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
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

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const {
      key,
    } = await context.params;

    const templateKey = decodeURIComponent(key);

    const row = await queryOne<RolePermissionTemplateRow>(
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
        WHERE template_key = $1
      `,
      [
        templateKey,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      mapRolePermissionTemplateRow(row),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlage konnte nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const {
      key,
    } = await context.params;

    const templateKey = decodeURIComponent(key);
    const body = await request.json() as UpdateTemplateBody;

    const current = await queryOne<RolePermissionTemplateRow>(
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
        WHERE template_key = $1
      `,
      [
        templateKey,
      ],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextName = body.name !== undefined
      ? normalizeText(body.name)
      : current.name;

    if (!nextName) {
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
        UPDATE role_permission_templates
        SET
          name = $1,
          description = $2,
          role_key = $3,
          permission_keys = $4,
          is_default = $5,
          is_active = $6,
          sort_order = $7,
          updated_at = NOW()
        WHERE template_key = $8
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
        nextName,
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description,
        body.roleKey !== undefined
          ? normalizeText(body.roleKey) || "employee"
          : current.role_key,
        Array.isArray(body.permissionKeys)
          ? normalizePermissionKeys(body.permissionKeys)
          : current.permission_keys || [],
        typeof body.isDefault === "boolean"
          ? body.isDefault
          : current.is_default,
        typeof body.isActive === "boolean"
          ? body.isActive
          : current.is_active,
        body.sortOrder !== undefined
          ? normalizeSortOrder(body.sortOrder, current.sort_order)
          : current.sort_order,
        templateKey,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapRolePermissionTemplateRow(row),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlage konnte nicht aktualisiert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const {
      key,
    } = await context.params;

    await queryOne(
      `
        DELETE FROM role_permission_templates
        WHERE template_key = $1
        RETURNING template_key
      `,
      [
        decodeURIComponent(key),
      ],
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlage konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}
