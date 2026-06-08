import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import {
  mapRolePermissionTemplateRow,
} from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";
import type {
  RolePermissionTemplateRow,
} from "../../../../../lib/database/mappers/rolePermissionTemplateMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ApplyRoleTemplateBody = {
  templateKey?: string;
  replaceExisting?: boolean;
};

type AdminUserRow = {
  id: string;
  role: string;
};

type ApplyResult = {
  userId: string;
  templateKey: string;
  roleKey: string;
  appliedPermissions: string[];
  replaceExisting: boolean;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
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

function normalizeRole(value?: string | null) {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAnyServerPermission([
      "users.manage_permissions",
    ]);

    const currentUser = await getCurrentServerUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Rollen-Vorlagen anwenden.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      id,
    } = await context.params;

    const userId = decodeURIComponent(id);
    const body = await request.json() as ApplyRoleTemplateBody;
    const templateKey = normalizeText(body.templateKey);
    const replaceExisting = body.replaceExisting !== false;

    if (!templateKey) {
      return NextResponse.json(
        {
          message: "Template-Key ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await queryOne<AdminUserRow>(
      `
        SELECT
          id,
          role
        FROM admin_users
        WHERE id = $1
        LIMIT 1
      `,
      [
        userId,
      ],
    );

    if (!user) {
      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const templateRow = await queryOne<RolePermissionTemplateRow>(
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
      [
        templateKey,
      ],
    );

    if (!templateRow) {
      return NextResponse.json(
        {
          message: "Rollen-Vorlage nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!templateRow.is_active) {
      return NextResponse.json(
        {
          message: "Diese Rollen-Vorlage ist deaktiviert.",
        },
        {
          status: 400,
        },
      );
    }

    const template = mapRolePermissionTemplateRow(templateRow);
    const roleKey = normalizeRole(String(template.roleKey));
    const permissionKeys = normalizePermissionKeys(template.permissionKeys);

    await query(
      `
        UPDATE admin_users
        SET
          role = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        roleKey,
        userId,
      ],
    );

    if (replaceExisting) {
      await query(
        `
          DELETE FROM user_permissions
          WHERE user_id = $1
            AND scope_type = 'global'
            AND scope_id = ''
        `,
        [
          userId,
        ],
      );
    }

    for (const permissionKey of permissionKeys) {
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
            gen_random_uuid()::text,
            $1,
            $2,
            'global',
            ''
          )
          ON CONFLICT (user_id, permission_key, scope_type, scope_id) DO NOTHING
        `,
        [
          userId,
          permissionKey,
        ],
      );
    }

    const result: ApplyResult = {
      userId,
      templateKey: template.key,
      roleKey,
      appliedPermissions: permissionKeys,
      replaceExisting,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Rollen-Vorlage konnte nicht angewendet werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}
