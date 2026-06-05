import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../../lib/database/db";
import {
  mapAdminModuleRow,
} from "../../../../lib/database/mappers/adminModuleMapper";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  AdminModuleRow,
} from "../../../../lib/database/mappers/adminModuleMapper";

type CreateAdminModuleBody = {
  key?: string;
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
      "admin.view",
      "users.manage_permissions",
    ]);

    const rows = await query<AdminModuleRow>(
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
        ORDER BY sort_order ASC, title ASC
      `,
    );

    return NextResponse.json(
      rows.map(mapAdminModuleRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Admin-Module konnten nicht geladen werden.",
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

    const body = await request.json() as CreateAdminModuleBody;

    const key = normalizeText(body.key);
    const title = normalizeText(body.title);
    const href = normalizeText(body.href);

    if (!key) {
      return NextResponse.json(
        {
          message: "Modul-Key ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!href) {
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
        INSERT INTO admin_modules (
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
          is_core
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
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
        key,
        title,
        normalizeText(body.description),
        href,
        normalizeText(body.icon) || "🧩",
        normalizeText(body.category) || "admin",
        normalizeText(body.badgeLabel),
        normalizeSortOrder(body.sortOrder),
        body.isEnabled ?? true,
        body.isVisible ?? true,
        body.isCore ?? false,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Admin-Modul konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapAdminModuleRow(row),
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
          "Admin-Modul konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}