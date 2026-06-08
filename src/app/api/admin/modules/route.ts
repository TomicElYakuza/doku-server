import { NextResponse } from "next/server";

import {
  createAdminModule,
  listAdminModules,
} from "../../../../lib/database/adminModuleStore";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { AdminModuleCreateInput } from "../../../../types/adminModule";

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  if (
    error instanceof Error &&
    (error.message === "Modul-Key ist erforderlich." ||
      error.message === "Titel ist erforderlich." ||
      error.message === "Link ist erforderlich.")
  ) {
    return 400;
  }

  if (
    error instanceof Error &&
    error.message === "Ein Admin-Modul mit diesem Key existiert bereits."
  ) {
    return 409;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
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

    const modules = await listAdminModules();

    return NextResponse.json(modules);
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

    const body = (await request.json()) as AdminModuleCreateInput;
    const module = await createAdminModule(body);

    return NextResponse.json(module, {
      status: 201,
    });
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