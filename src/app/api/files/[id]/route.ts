import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type RouteContext = {
  params: Promise<{
    id: string;
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
      id,
    } =
      await context.params;

    const row =
      await queryOne<{
        id: string;
      }>(
        `
        DELETE FROM files
        WHERE id = $1
        RETURNING id
        `,
        [
          id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Datei nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

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
            "Datei konnte nicht gelöscht werden."
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
