import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../../lib/database/db";

type HealthRow = {
  now: string;
  database: string;
};

export async function GET() {
  try {
    const row =
      await queryOne<HealthRow>(
        `
        SELECT
          NOW()::TEXT AS now,
          current_database() AS database
        `
      );

    return NextResponse.json({
      ok:
        true,

      database:
        row?.database ||
        "unknown",

      now:
        row?.now ||
        "",
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        database:
          "error",

        message:
          "Datenbankstatus konnte nicht geladen werden.",

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
