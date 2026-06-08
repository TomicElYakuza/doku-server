import {
  NextResponse,
} from "next/server";
import {
  queryOne,
} from "../../../../lib/database/db";

type CountRow = {
  count: string;
};

type DatabaseTimeRow = {
  now: string;
};

type TableExistsRow = {
  exists: boolean;
};

async function tableExists(tableName: string) {
  const row = await queryOne<TableExistsRow>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [
      tableName,
    ],
  );

  return Boolean(row?.exists);
}

async function getCount(tableName: string) {
  const exists = await tableExists(tableName);

  if (!exists) {
    return 0;
  }

  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM ${tableName}`,
  );

  return Number(row?.count || 0);
}

async function getUsersCount() {
  const adminUsersExists = await tableExists("admin_users");
  const usersExists = await tableExists("users");

  if (adminUsersExists) {
    return getCount("admin_users");
  }

  if (usersExists) {
    return getCount("users");
  }

  return 0;
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
      ticketTemplates,
      wikiPages,
      newsPosts,
      taxonomyItems,
      adminModules,
      rolePermissionTemplates,
    ] = await Promise.all([
      getUsersCount(),
      getCount("companies"),
      getCount("departments"),
      getCount("tickets"),
      getCount("ticket_templates"),
      getCount("wiki_pages"),
      getCount("news_posts"),
      getCount("taxonomy_items"),
      getCount("admin_modules"),
      getCount("role_permission_templates"),
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
        ticketTemplates,
        wikiPages,
        newsPosts,
        taxonomyItems,
        adminModules,
        rolePermissionTemplates,
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
          ticketTemplates: 0,
          wikiPages: 0,
          newsPosts: 0,
          taxonomyItems: 0,
          adminModules: 0,
          rolePermissionTemplates: 0,
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
