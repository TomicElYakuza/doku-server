import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "@/lib/database/db";

type HealthRow = {
  now: string;
};

export async function GET() {
  try {
    const result =
      await queryOne<HealthRow>(
        "SELECT NOW()::TEXT AS now"
      );

    return NextResponse.json({
      ok:
        true,

      database:
        "connected",

      now:
        result?.now ||
        null,
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