import { NextResponse } from "next/server";

import { getSystemDatabaseHealth } from "../../../../lib/database/systemSchemaStore";

export async function GET() {
  try {
    const health = await getSystemDatabaseHealth();

    return NextResponse.json(health);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: "Datenbankstatus konnte nicht geladen werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}