import {
  NextResponse,
} from "next/server";

import {
  query,
} from "../../../../../lib/database/db";

import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

function getErrorStatus(
  error: unknown
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAnyServerPermission([
      "files.delete",
      "files.manage",
    ]);

    const {
      key,
    } =
      await context.params;

    const decodedKey =
      decodeURIComponent(
        key
      );

    await query(
      `
      DELETE FROM files
      WHERE storage_key = $1
      `,
      [
        decodedKey,
      ]
    );

    return NextResponse.json({
      ok:
        true,
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "Dateien konnten nicht gelöscht werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}
