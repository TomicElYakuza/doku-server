import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL ist nicht gesetzt. Bitte .env.local prüfen."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var dmsPostgresPool:
    | Pool
    | undefined;
}

export const db =
  globalThis.dmsPostgresPool ||
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.dmsPostgresPool =
    db;
}

export async function query<T>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result =
    await db.query(
      text,
      params
    );

  return result.rows as T[];
}

export async function queryOne<T>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows =
    await query<T>(
      text,
      params
    );

  return rows[0] || null;
}