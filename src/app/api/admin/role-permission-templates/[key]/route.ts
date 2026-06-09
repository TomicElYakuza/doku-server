import { NextResponse } from "next/server";

import { queryOne } from "../../../../../lib/database/db";
import { mapRolePermissionTemplateRow } from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type { RolePermissionTemplateRow } from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";

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

const legacyPermissionPairs = [
  ["news", "manage", "news", "edit"],
  ["wiki", "manage", "wiki", "edit"],
  ["tickets", "manage", "tickets", "edit"],
  ["tickets.templates", "manage", "tickets.templates", "edit"],
  ["files", "manage", "files", "upload"],
  ["activity", "manage", "activity", "view"],
];

const validPermissionKeys = new Set([
  "*",
  "dashboard.view",
  "admin.view",
  "settings.view",
  "settings.manage",
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.manage",
  "users.manage_permissions",
  "organization.view",
  "organization.manage",
  "companies.manage",
  "departments.manage",
  "taxonomy.manage",
  "wiki.view",
  "wiki.create",
  "wiki.edit",
  "wiki.delete",
  "tickets.view",
  "tickets.create",
  "tickets.edit",
  "tickets.assign",
  "tickets.close",
  "tickets.delete",
  "tickets.templates.view",
  "tickets.templates.create",
  "tickets.templates.edit",
  "tickets.templates.delete",
  "files.view",
  "files.upload",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "inventory.delete",
  "inventory.assign",
  "inventory.hardware.manage",
  "inventory.software.manage",
  "inventory.servers.manage",
  "files.delete",
  "news.view",
  "news.create",
  "news.edit",
  "news.delete",
  "activity.view",
]);

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeRole(value?: string | null, fallback = "employee") {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  if (value === "employee") {
    return "employee";
  }

  if (fallback === "admin" || fallback === "department_lead") {
    return fallback;
  }

  return "employee";
}

function normalizeSortOrder(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function getLegacyPermissionKey(fromNamespace: string, fromAction: string) {
  return [fromNamespace, fromAction].join(".");
}

function getNextPermissionKey(toNamespace: string, toAction: string) {
  return [toNamespace, toAction].join(".");
}

function mapLegacyPermissionKey(permissionKey: string) {
  for (const [fromNamespace, fromAction, toNamespace, toAction] of legacyPermissionPairs) {
    if (permissionKey === getLegacyPermissionKey(fromNamespace, fromAction)) {
      return getNextPermissionKey(toNamespace, toAction);
    }
  }

  return permissionKey;
}

function normalizePermissionKey(value: unknown) {
  const permissionKey = normalizeText(String(value || ""));
  const mappedPermissionKey = mapLegacyPermissionKey(permissionKey);

  if (!validPermissionKeys.has(mappedPermissionKey)) {
    return "";
  }

  return mappedPermissionKey;
}

function normalizePermissionKeys(permissionKeys?: string[]) {
  if (!Array.isArray(permissionKeys)) {
    return [];
  }

  return Array.from(
    new Set(permissionKeys.map(normalizePermissionKey).filter(Boolean)),
  );
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

async function findTemplate(templateKey: string) {
  return queryOne<RolePermissionTemplateRow>(
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
      LIMIT 1
    `,
    [templateKey],
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
      "admin.view",
    ]);

    const { key } = await context.params;
    const templateKey = decodeURIComponent(key);

    const row = await findTemplate(templateKey);

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

    return NextResponse.json(mapRolePermissionTemplateRow(row));
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const { key } = await context.params;
    const templateKey = decodeURIComponent(key);
    const body = (await request.json()) as UpdateTemplateBody;

    const current = await findTemplate(templateKey);

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

    const nextName =
      body.name !== undefined ? normalizeText(body.name) : current.name;

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

    const nextDescription =
      body.description !== undefined
        ? normalizeText(body.description)
        : current.description;

    const nextRoleKey =
      body.roleKey !== undefined
        ? normalizeRole(body.roleKey, current.role_key)
        : normalizeRole(current.role_key);

    const nextPermissionKeys = Array.isArray(body.permissionKeys)
      ? normalizePermissionKeys(body.permissionKeys)
      : normalizePermissionKeys(current.permission_keys || []);

    const nextIsDefault =
      typeof body.isDefault === "boolean" ? body.isDefault : current.is_default;

    const nextIsActive =
      typeof body.isActive === "boolean" ? body.isActive : current.is_active;

    const nextSortOrder =
      body.sortOrder !== undefined
        ? normalizeSortOrder(body.sortOrder, current.sort_order)
        : current.sort_order;

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
        nextDescription,
        nextRoleKey,
        nextPermissionKeys,
        nextIsDefault,
        nextIsActive,
        nextSortOrder,
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

    return NextResponse.json(mapRolePermissionTemplateRow(row));
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const { key } = await context.params;
    const templateKey = decodeURIComponent(key);

    const deleted = await queryOne<{ template_key: string }>(
      `
        DELETE FROM role_permission_templates
        WHERE template_key = $1
        RETURNING template_key
      `,
      [templateKey],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

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