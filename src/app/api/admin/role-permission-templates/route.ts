import { NextResponse } from "next/server";

import { query, queryOne } from "../../../../lib/database/db";
import { mapRolePermissionTemplateRow } from "../../../../lib/database/mappers/rolePermissionTemplateMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { RolePermissionTemplateRow } from "../../../../lib/database/mappers/rolePermissionTemplateMapper";

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

function normalizeTemplateKey(value?: string | null) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRole(value?: string | null) {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeSortOrder(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
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

async function normalizeLegacyTemplates() {
  await query(`
    UPDATE role_permission_templates
    SET
      role_key = CASE
        WHEN role_key IN ('admin', 'department_lead', 'employee') THEN role_key
        ELSE 'employee'
      END,
      updated_at = NOW()
  `);

  for (const [fromNamespace, fromAction, toNamespace, toAction] of legacyPermissionPairs) {
    await query(
      `
        UPDATE role_permission_templates
        SET
          permission_keys = array_replace(permission_keys, $1, $2),
          updated_at = NOW()
        WHERE $1 = ANY(permission_keys)
      `,
      [
        getLegacyPermissionKey(fromNamespace, fromAction),
        getNextPermissionKey(toNamespace, toAction),
      ],
    );
  }

  await query(`
    UPDATE role_permission_templates
    SET
      permission_keys = ARRAY(
        SELECT DISTINCT permission_key
        FROM unnest(permission_keys) AS permission_key
        WHERE permission_key IS NOT NULL
          AND permission_key <> ''
      ),
      updated_at = NOW()
  `);
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
      "admin.view",
    ]);

    await normalizeLegacyTemplates();

    const rows = await query<RolePermissionTemplateRow>(`
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
    `);

    return NextResponse.json(rows.map(mapRolePermissionTemplateRow));
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

    const body = (await request.json()) as CreateTemplateBody;

    const key = normalizeTemplateKey(body.key);
    const name = normalizeText(body.name);
    const description = normalizeText(body.description);
    const roleKey = normalizeRole(body.roleKey);
    const permissionKeys = normalizePermissionKeys(body.permissionKeys);

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
        description,
        roleKey,
        permissionKeys,
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

    return NextResponse.json(mapRolePermissionTemplateRow(row), {
      status: 201,
    });
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