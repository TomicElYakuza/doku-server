import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../../lib/database/db";

type DatabaseInfoRow = {
  database_name: string;
  schema_name: string;
  database_time: string;
  postgres_version: string;
};

type TableRow = {
  table_name: string;
  row_count: string;
};

type ColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type IndexRow = {
  tablename: string;
  indexname: string;
  indexdef: string;
};

type MigrationTableRow = {
  table_name: string;
};

type CountRow = {
  count: string;
};

async function getTableCount(tableName: string) {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM ${tableName}`,
  );

  return Number(row?.count || 0);
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const databaseInfo = await queryOne<DatabaseInfoRow>(
      `
        SELECT
          current_database()::text AS database_name,
          current_schema()::text AS schema_name,
          NOW()::text AS database_time,
          version()::text AS postgres_version
      `,
    );

    const baseTables = await query<{
      table_name: string;
    }>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
      `,
    );

    const tables: TableRow[] = [];

    for (const table of baseTables) {
      const rowCount = await getTableCount(table.table_name);

      tables.push({
        table_name: table.table_name,
        row_count: String(rowCount),
      });
    }

    const columns = await query<ColumnRow>(
      `
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name ASC, ordinal_position ASC
      `,
    );

    const indexes = await query<IndexRow>(
      `
        SELECT
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename ASC, indexname ASC
      `,
    );

    const migrationTables = await query<MigrationTableRow>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'schema_migrations',
            'migrations',
            'knex_migrations',
            '_prisma_migrations'
          )
        ORDER BY table_name ASC
      `,
    );

    const expectedTables = [
      "users",
      "companies",
      "departments",
      "tickets",
      "ticket_templates",
      "wiki_pages",
      "news_posts",
      "activity_logs",
      "app_settings",
      "taxonomy_items",
    ];

    const existingTableNames = new Set(
      baseTables.map((table) => table.table_name),
    );

    const expectedStatus = expectedTables.map((tableName) => ({
      tableName,
      exists: existingTableNames.has(tableName),
    }));

    const taxonomyColumns = columns
      .filter((column) => column.table_name === "taxonomy_items")
      .map((column) => column.column_name);

    const taxonomyChecks = [
      "id",
      "type",
      "target",
      "name",
      "slug",
      "parent_id",
      "sort_order",
      "is_active",
      "created_at",
      "updated_at",
    ].map((columnName) => ({
      columnName,
      exists: taxonomyColumns.includes(columnName),
    }));

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: {
        name: databaseInfo?.database_name || null,
        schema: databaseInfo?.schema_name || "public",
        time: databaseInfo?.database_time || null,
        version: databaseInfo?.postgres_version || null,
      },
      tables,
      columns,
      indexes,
      migrations: {
        detectedTables: migrationTables.map((table) => table.table_name),
        hasMigrationTable: migrationTables.length > 0,
      },
      checks: {
        expectedTables: expectedStatus,
        taxonomyColumns: taxonomyChecks,
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
          name: null,
          schema: "public",
          time: null,
          version: null,
        },
        tables: [],
        columns: [],
        indexes: [],
        migrations: {
          detectedTables: [],
          hasMigrationTable: false,
        },
        checks: {
          expectedTables: [],
          taxonomyColumns: [],
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