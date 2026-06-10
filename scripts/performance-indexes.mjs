import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL ist nicht gesetzt. Starte mit: node --env-file=.env.local scripts/performance-indexes.mjs");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const statements = [
  // Tickets
  `
    CREATE INDEX IF NOT EXISTS tickets_status_idx
    ON tickets(status)
  `,
  `
    CREATE INDEX IF NOT EXISTS tickets_priority_idx
    ON tickets(priority)
  `,
  `
    CREATE INDEX IF NOT EXISTS tickets_company_department_idx
    ON tickets(company_id, department_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS tickets_category_id_idx
    ON tickets(category_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS tickets_created_at_idx
    ON tickets(created_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS tickets_id_desc_idx
    ON tickets(id DESC)
  `,

  // Ticket Templates
  `
    CREATE INDEX IF NOT EXISTS ticket_templates_updated_at_idx
    ON ticket_templates(updated_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS ticket_templates_company_department_idx
    ON ticket_templates(company_id, department_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS ticket_templates_category_id_idx
    ON ticket_templates(category_id)
  `,

  // Wiki
  `
    CREATE INDEX IF NOT EXISTS wiki_pages_updated_at_idx
    ON wiki_pages(updated_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS wiki_pages_company_department_idx
    ON wiki_pages(company_id, department_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS wiki_pages_category_id_idx
    ON wiki_pages(category_id)
  `,

  // Taxonomy
  `
    CREATE INDEX IF NOT EXISTS taxonomy_items_target_type_status_idx
    ON taxonomy_items(target, type, status)
  `,
  `
    CREATE INDEX IF NOT EXISTS taxonomy_items_parent_id_idx
    ON taxonomy_items(parent_id)
  `,

  // Activity
  `
    CREATE INDEX IF NOT EXISTS activities_created_at_idx
    ON activities(created_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS activities_company_department_idx
    ON activities(company_id, department_id)
  `,

  // News
  `
    CREATE INDEX IF NOT EXISTS news_posts_created_at_idx
    ON news_posts(created_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS news_posts_category_id_idx
    ON news_posts(category_id)
  `,

  // Files
  `
    CREATE INDEX IF NOT EXISTS files_created_at_idx
    ON files(created_at DESC)
  `,
  `
    CREATE INDEX IF NOT EXISTS files_company_department_idx
    ON files(company_id, department_id)
  `,

  // Users
  `
    CREATE INDEX IF NOT EXISTS admin_users_company_department_idx
    ON admin_users(company_id, department_id)
  `,
  `
    CREATE INDEX IF NOT EXISTS admin_users_role_status_idx
    ON admin_users(role, status)
  `,
];

async function indexExistsSafe(statement) {
  try {
    await pool.query(statement);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes("does not exist") ||
      message.includes("existiert nicht")
    ) {
      console.warn("Übersprungen:", message);
      return false;
    }

    throw error;
  }
}

async function main() {
  try {
    for (const statement of statements) {
      const compact = statement.replace(/\s+/g, " ").trim();
      console.log(compact);
      await indexExistsSafe(statement);
    }

    console.log("Performance-Indexes abgeschlossen.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});