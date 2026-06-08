import { NextResponse } from "next/server";

import { getEffectivePermissionResultForUserId } from "../../../../../lib/database/permissionStore";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;
    const decodedUserId = decodeURIComponent(userId);

    const currentUser = await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    const isOwnUser = currentUser.id === decodedUserId;

    if (!isOwnUser) {
      await requireAnyServerPermission([
        "users.manage_permissions",
        "admin.view",
      ]);
    }

    const result = await getEffectivePermissionResultForUserId(decodedUserId);

    if (!result) {
      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Effektive Berechtigungen konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}