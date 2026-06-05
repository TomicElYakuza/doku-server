import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../../lib/database/db";

type CountRow = {
  count: string;
};

type DatabaseTimeRow = {
  now: string;
};

async function getCount(tableName: string) {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM ${tableName}`,
  );

  return Number(row?.count || 0);
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const databaseTime = await queryOne<DatabaseTimeRow>(
      "SELECT NOW()::text AS now",
    );

    const [
      users,
      companies,
      departments,
      tickets,
      wikiPages,
      newsPosts,
      taxonomyItems,
    ] = await Promise.all([
      getCount("users"),
      getCount("companies"),
      getCount("departments"),
      getCount("tickets"),
      getCount("wiki_pages"),
      getCount("news_posts"),
      getCount("taxonomy_items"),
    ]);

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: {
        connected: true,
        time: databaseTime?.now || null,
      },
      counts: {
        users,
        companies,
        departments,
        tickets,
        wikiPages,
        newsPosts,
        taxonomyItems,
      },
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        database: {
          connected: false,
          time: null,
        },
        counts: {
          users: 0,
          companies: 0,
          departments: 0,
          tickets: 0,
          wikiPages: 0,
          newsPosts: 0,
          taxonomyItems: 0,
        },
        responseTimeMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}