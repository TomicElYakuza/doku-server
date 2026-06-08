import { NextResponse } from "next/server";

import {
  deleteAdminModule,
  findAdminModuleByKey,
  updateAdminModule,
} from "../../../../../lib/database/adminModuleStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";
import type { AdminModuleUpdateInput } from "../../../../../types/adminModule";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  if (
    error instanceof Error &&
    (error.message === "Modul-Key ist erforderlich." ||
      error.message === "Titel ist erforderlich." ||
      error.message === "Link ist erforderlich." ||
      error.message.startsWith("Kernmodule können nicht gelöscht werden"))
  ) {
    return 400;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "admin.view",
      "users.manage_permissions",
    ]);

    const { key } = await context.params;
    const module = await findAdminModuleByKey(decodeURIComponent(key));

    if (!module) {
      return NextResponse.json(
        {
          message: "Admin-Modul nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(module);
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const { key } = await context.params;
    const body = (await request.json()) as AdminModuleUpdateInput;

    const module = await updateAdminModule(decodeURIComponent(key), body);

    if (!module) {
      return NextResponse.json(
        {
          message: "Admin-Modul nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(module);
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "users.manage_permissions",
    ]);

    const { key } = await context.params;

    await deleteAdminModule(decodeURIComponent(key));

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