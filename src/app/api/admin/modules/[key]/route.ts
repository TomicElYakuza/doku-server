import {
  NextResponse,
} from "next/server";
import {
  queryOne,
} from "../../../../../lib/database/db";
import {
  mapAdminModuleRow,
} from "../../../../../lib/database/mappers/adminModuleMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type {
  AdminModuleRow,
} from "../../../../../lib/database/mappers/adminModuleMapper";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

type UpdateAdminModuleBody = {
  title?: string;
  description?: string;
  href?: string;
  icon?: string;
  category?: string;
  badgeLabel?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isCore?: boolean;
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
      "admin.view",
      "users.manage_permissions",
    ]);

    const {
      key,
    } = await context.params;

    const row = await queryOne<AdminModuleRow>(
      `
        SELECT
          module_key,
          title,
          description,
          href,
          icon,
          category,
          badge_label,
          sort_order,
          is_enabled,
          is_visible,
          is_core,
          created_at,
          updated_at
        FROM admin_modules
        WHERE module_key = $1
      `,
      [
        decodeURIComponent(key),
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Admin-Modul nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      mapAdminModuleRow(row),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Admin-Modul konnte nicht geladen werden.",
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

    const moduleKey = decodeURIComponent(key);
    const body = await request.json() as UpdateAdminModuleBody;

    const current = await queryOne<AdminModuleRow>(
      `
        SELECT
          module_key,
          title,
          description,
          href,
          icon,
          category,
          badge_label,
          sort_order,
          is_enabled,
          is_visible,
          is_core,
          created_at,
          updated_at
        FROM admin_modules
        WHERE module_key = $1
      `,
      [
        moduleKey,
      ],
    );

    if (!current) {
      return NextResponse.json(
        {
          message: "Admin-Modul nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextTitle = body.title !== undefined
      ? normalizeText(body.title)
      : current.title;

    const nextHref = body.href !== undefined
      ? normalizeText(body.href)
      : current.href;

    if (!nextTitle) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextHref) {
      return NextResponse.json(
        {
          message: "Link ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<AdminModuleRow>(
      `
        UPDATE admin_modules
        SET
          title = $1,
          description = $2,
          href = $3,
          icon = $4,
          category = $5,
          badge_label = $6,
          sort_order = $7,
          is_enabled = $8,
          is_visible = $9,
          is_core = $10,
          updated_at = NOW()
        WHERE module_key = $11
        RETURNING
          module_key,
          title,
          description,
          href,
          icon,
          category,
          badge_label,
          sort_order,
          is_enabled,
          is_visible,
          is_core,
          created_at,
          updated_at
      `,
      [
        nextTitle,
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description,
        nextHref,
        body.icon !== undefined
          ? normalizeText(body.icon) || "🧩"
          : current.icon,
        body.category !== undefined
          ? normalizeText(body.category) || "admin"
          : current.category,
        body.badgeLabel !== undefined
          ? normalizeText(body.badgeLabel)
          : current.badge_label,
        body.sortOrder !== undefined
          ? normalizeSortOrder(body.sortOrder, current.sort_order)
          : current.sort_order,
        typeof body.isEnabled === "boolean"
          ? body.isEnabled
          : current.is_enabled,
        typeof body.isVisible === "boolean"
          ? body.isVisible
          : current.is_visible,
        typeof body.isCore === "boolean"
          ? body.isCore
          : current.is_core,
        moduleKey,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Admin-Modul konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapAdminModuleRow(row),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Admin-Modul konnte nicht aktualisiert werden.",
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

    const moduleKey = decodeURIComponent(key);

    const current = await queryOne<AdminModuleRow>(
      `
        SELECT
          module_key,
          title,
          description,
          href,
          icon,
          category,
          badge_label,
          sort_order,
          is_enabled,
          is_visible,
          is_core,
          created_at,
          updated_at
        FROM admin_modules
        WHERE module_key = $1
      `,
      [
        moduleKey,
      ],
    );

    if (!current) {
      return NextResponse.json({
        ok: true,
      });
    }

    if (current.is_core) {
      return NextResponse.json(
        {
          message: "Kernmodule können nicht gelöscht werden. Du kannst sie deaktivieren oder ausblenden.",
        },
        {
          status: 400,
        },
      );
    }

    await queryOne(
      `
        DELETE FROM admin_modules
        WHERE module_key = $1
        RETURNING module_key
      `,
      [
        moduleKey,
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
          "Admin-Modul konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}
