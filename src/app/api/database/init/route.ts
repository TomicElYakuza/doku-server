import {
  NextResponse,
} from "next/server";

import {
  initDatabase,
} from "../../../../lib/database/initDatabase";

export async function POST() {
  try {
    await initDatabase();

    return NextResponse.json({
      ok:
        true,

      message:
        "Datenbank wurde initialisiert.",
    });
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        message:
          "Datenbank konnte nicht initialisiert werden.",

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