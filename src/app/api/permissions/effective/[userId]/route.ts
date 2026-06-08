import {
  NextResponse,
} from "next/server";

import {
  getCurrentServerUser,
  getEffectiveServerPermissionKeys,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      userId,
    } =
      await context.params;

    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const isOwnUser =
      currentUser.id === userId;

    if (!isOwnUser) {
      await requireAnyServerPermission([
        "users.manage_permissions",
      ]);
    }

    const permissionKeys =
      await getEffectiveServerPermissionKeys(
        currentUser
      );

    return NextResponse.json({
      permissionKeys,
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          isPermissionError(
            error
          )
            ? "Keine Berechtigung."
            : "Effektive Berechtigungen konnten nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          isPermissionError(
            error
          )
            ? 403
            : 500,
      }
    );
  }
}
