import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      permission_key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'System',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'System'
  `);

  await pool.query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(
    `
      INSERT INTO permissions (
        id,
        permission_key,
        label,
        description,
        category
      )
      VALUES (
        'permission_dashboard.view',
        'dashboard.view',
        'Dashboard anzeigen',
        'Darf das Dashboard sehen.',
        'System'
      )
      ON CONFLICT (permission_key)
      DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_at = NOW()
    `,
  );

  const result = await pool.query(`
    SELECT permission_key, label, category
    FROM permissions
    WHERE permission_key = 'dashboard.view'
  `);

  console.table(result.rows);
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
