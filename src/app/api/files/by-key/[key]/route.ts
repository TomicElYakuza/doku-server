import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../../lib/database/db";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      key,
    } =
      await context.params;

    const decodedKey =
      decodeURIComponent(
        key
      );

    await queryOne(
      `
      DELETE FROM files
      WHERE storage_key = $1
      RETURNING id
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
          "Dateien konnten nicht gelöscht werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}