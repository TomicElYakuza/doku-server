import { query, queryOne } from "./db";
import {
  mapAdminModuleRow,
  type AdminModuleRow,
} from "./mappers/adminModuleMapper";
import type {
  AdminModuleConfig,
  AdminModuleCreateInput,
  AdminModuleUpdateInput,
} from "../../types/adminModule";

const defaultAdminModules: AdminModuleCreateInput[] = [
  {
    key: "settings",
    title: "Systemeinstellungen",
    description:
      "App-Name, Firma, Standardwerte, Feature-Schalter und Darstellung zentral verwalten.",
    href: "/admin/settings",
    icon: "⚙️",
    category: "system",
    badgeLabel: "Settings",
    sortOrder: 10,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "modules",
    title: "Admin-Module",
    description:
      "Verwaltungsbereiche zentral aktivieren, ausblenden, sortieren und konfigurieren.",
    href: "/admin/modules",
    icon: "▦",
    category: "system",
    badgeLabel: "Module",
    sortOrder: 20,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "taxonomy",
    title: "Kategorien & Tags",
    description:
      "Zentrale Taxonomie für Tickets, Wiki, News und weitere Inhalte verwalten.",
    href: "/admin/taxonomy",
    icon: "🧩",
    category: "content",
    badgeLabel: "Taxonomie",
    sortOrder: 30,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "database",
    title: "Datenbank",
    description:
      "Datenbankstatus, Tabellen und Systemzustand prüfen.",
    href: "/admin/database",
    icon: "🗄️",
    category: "system",
    badgeLabel: "DB",
    sortOrder: 40,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "users",
    title: "Benutzerverwaltung",
    description:
      "Benutzer, Rollen, Status und Zuordnungen verwalten.",
    href: "/admin/users",
    icon: "👥",
    category: "admin",
    badgeLabel: "Benutzer",
    sortOrder: 50,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "companies",
    title: "Firmen & Abteilungen",
    description:
      "Organisationen, Firmenbereiche und Abteilungsstruktur verwalten.",
    href: "/admin/companies",
    icon: "🏢",
    category: "admin",
    badgeLabel: "Organisation",
    sortOrder: 60,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "permissions",
    title: "Berechtigungen",
    description:
      "Rollen, effektive Berechtigungen und Zugriffsebenen prüfen und verwalten.",
    href: "/admin/permissions",
    icon: "🔐",
    category: "admin",
    badgeLabel: "Rechte",
    sortOrder: 70,
    isEnabled: true,
    isVisible: true,
    isCore: true,
  },
  {
    key: "news",
    title: "News",
    description:
      "Beiträge, Ankündigungen und interne Neuigkeiten administrieren.",
    href: "/admin/news",
    icon: "📰",
    category: "content",
    badgeLabel: "News",
    sortOrder: 80,
    isEnabled: true,
    isVisible: true,
    isCore: false,
  },
  {
    key: "ticket-templates",
    title: "Ticket-Vorlagen",
    description:
      "Vorlagen für wiederkehrende Tickettypen verwalten.",
    href: "/tickets/templates",
    icon: "🎫",
    category: "tickets",
    badgeLabel: "Vorlagen",
    sortOrder: 90,
    isEnabled: true,
    isVisible: true,
    isCore: false,
  },
  {
    key: "activity",
    title: "Aktivitätsprotokoll",
    description:
      "Systemaktivitäten, Änderungen und relevante Ereignisse einsehen.",
    href: "/activity",
    icon: "📋",
    category: "system",
    badgeLabel: "Logs",
    sortOrder: 100,
    isEnabled: true,
    isVisible: true,
    isCore: false,
  },
];

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeSortOrder(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizeCategory(value: unknown) {
  return normalizeText(value) || "admin";
}

function normalizeIcon(value: unknown) {
  return normalizeText(value);
}

function normalizeBadgeLabel(value: unknown) {
  return normalizeText(value);
}

function normalizeHref(value: unknown) {
  const href = normalizeText(value);

  if (!href) {
    return "";
  }

  if (href.startsWith("/")) {
    return href;
  }

  return `/${href}`;
}

export async function ensureAdminModulesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_modules (
      module_key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      href TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'admin',
      badge_label TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      is_core BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'admin'
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS badge_label TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS is_core BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE admin_modules
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    UPDATE admin_modules
    SET
      description = COALESCE(description, ''),
      icon = COALESCE(icon, ''),
      category = COALESCE(NULLIF(category, ''), 'admin'),
      badge_label = COALESCE(badge_label, ''),
      sort_order = COALESCE(sort_order, 0),
      is_enabled = COALESCE(is_enabled, TRUE),
      is_visible = COALESCE(is_visible, TRUE),
      is_core = COALESCE(is_core, FALSE),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW())
  `);
}

export async function seedDefaultAdminModules() {
  await ensureAdminModulesTable();

  for (const module of defaultAdminModules) {
    await query(
      `
        INSERT INTO admin_modules (
          module_key,
          title,
          description,
          href,
          icon,
          category,
          badge_label,
          sort_order,
          is_enabled,
          is_visible,
          is_core
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11
        )
        ON CONFLICT (module_key) DO NOTHING
      `,
      [
        module.key,
        module.title,
        module.description || "",
        module.href,
        module.icon || "",
        module.category || "admin",
        module.badgeLabel || "",
        normalizeSortOrder(module.sortOrder, 0),
        module.isEnabled ?? true,
        module.isVisible ?? true,
        module.isCore ?? false,
      ],
    );
  }
}

export async function listAdminModules() {
  await seedDefaultAdminModules();

  const rows = await query<AdminModuleRow>(`
    SELECT
      module_key,
      title,
      description,
      href,
      icon,
      category,
      badge_label,
      sort_order,
      is_enabled,
      is_visible,
      is_core,
      created_at,
      updated_at
    FROM admin_modules
    ORDER BY sort_order ASC, title ASC
  `);

  return rows.map(mapAdminModuleRow);
}

export async function findAdminModuleByKey(key: string) {
  await seedDefaultAdminModules();

  const moduleKey = normalizeText(key);

  if (!moduleKey) {
    return null;
  }

  const row = await queryOne<AdminModuleRow>(
    `
      SELECT
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core,
        created_at,
        updated_at
      FROM admin_modules
      WHERE module_key = $1
    `,
    [moduleKey],
  );

  return row ? mapAdminModuleRow(row) : null;
}

export async function createAdminModule(
  input: AdminModuleCreateInput,
): Promise<AdminModuleConfig> {
  await seedDefaultAdminModules();

  const key = normalizeText(input.key);
  const title = normalizeText(input.title);
  const href = normalizeHref(input.href);

  if (!key) {
    throw new Error("Modul-Key ist erforderlich.");
  }

  if (!title) {
    throw new Error("Titel ist erforderlich.");
  }

  if (!href) {
    throw new Error("Link ist erforderlich.");
  }

  const existing = await queryOne<AdminModuleRow>(
    `
      SELECT module_key
      FROM admin_modules
      WHERE module_key = $1
    `,
    [key],
  );

  if (existing) {
    throw new Error("Ein Admin-Modul mit diesem Key existiert bereits.");
  }

  const row = await queryOne<AdminModuleRow>(
    `
      INSERT INTO admin_modules (
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11
      )
      RETURNING
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core,
        created_at,
        updated_at
    `,
    [
      key,
      title,
      normalizeText(input.description),
      href,
      normalizeIcon(input.icon),
      normalizeCategory(input.category),
      normalizeBadgeLabel(input.badgeLabel),
      normalizeSortOrder(input.sortOrder, 0),
      normalizeBoolean(input.isEnabled, true),
      normalizeBoolean(input.isVisible, true),
      normalizeBoolean(input.isCore, false),
    ],
  );

  if (!row) {
    throw new Error("Admin-Modul konnte nicht erstellt werden.");
  }

  return mapAdminModuleRow(row);
}

export async function updateAdminModule(
  key: string,
  input: AdminModuleUpdateInput,
): Promise<AdminModuleConfig | null> {
  await seedDefaultAdminModules();

  const moduleKey = normalizeText(key);

  if (!moduleKey) {
    throw new Error("Modul-Key ist erforderlich.");
  }

  const current = await queryOne<AdminModuleRow>(
    `
      SELECT
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core,
        created_at,
        updated_at
      FROM admin_modules
      WHERE module_key = $1
    `,
    [moduleKey],
  );

  if (!current) {
    return null;
  }

  const nextTitle =
    input.title !== undefined ? normalizeText(input.title) : current.title;

  const nextHref =
    input.href !== undefined ? normalizeHref(input.href) : current.href;

  if (!nextTitle) {
    throw new Error("Titel ist erforderlich.");
  }

  if (!nextHref) {
    throw new Error("Link ist erforderlich.");
  }

  const row = await queryOne<AdminModuleRow>(
    `
      UPDATE admin_modules
      SET
        title = $1,
        description = $2,
        href = $3,
        icon = $4,
        category = $5,
        badge_label = $6,
        sort_order = $7,
        is_enabled = $8,
        is_visible = $9,
        is_core = $10,
        updated_at = NOW()
      WHERE module_key = $11
      RETURNING
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core,
        created_at,
        updated_at
    `,
    [
      nextTitle,
      input.description !== undefined
        ? normalizeText(input.description)
        : current.description,
      nextHref,
      input.icon !== undefined ? normalizeIcon(input.icon) : current.icon,
      input.category !== undefined
        ? normalizeCategory(input.category)
        : current.category,
      input.badgeLabel !== undefined
        ? normalizeBadgeLabel(input.badgeLabel)
        : current.badge_label,
      input.sortOrder !== undefined
        ? normalizeSortOrder(input.sortOrder, current.sort_order)
        : current.sort_order,
      input.isEnabled !== undefined
        ? normalizeBoolean(input.isEnabled, current.is_enabled)
        : current.is_enabled,
      input.isVisible !== undefined
        ? normalizeBoolean(input.isVisible, current.is_visible)
        : current.is_visible,
      input.isCore !== undefined
        ? normalizeBoolean(input.isCore, current.is_core)
        : current.is_core,
      moduleKey,
    ],
  );

  return row ? mapAdminModuleRow(row) : null;
}

export async function deleteAdminModule(key: string) {
  await seedDefaultAdminModules();

  const moduleKey = normalizeText(key);

  if (!moduleKey) {
    return;
  }

  const current = await queryOne<AdminModuleRow>(
    `
      SELECT
        module_key,
        title,
        description,
        href,
        icon,
        category,
        badge_label,
        sort_order,
        is_enabled,
        is_visible,
        is_core,
        created_at,
        updated_at
      FROM admin_modules
      WHERE module_key = $1
    `,
    [moduleKey],
  );

  if (!current) {
    return;
  }

  if (current.is_core) {
    throw new Error(
      "Kernmodule können nicht gelöscht werden. Du kannst sie deaktivieren oder ausblenden.",
    );
  }

  await query(
    `
      DELETE FROM admin_modules
      WHERE module_key = $1
    `,
    [moduleKey],
  );
}