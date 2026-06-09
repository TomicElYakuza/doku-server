import { query, queryOne } from "./db";
import type {
  EffectivePermissionResult,
  Permission,
  PermissionScopeType,
  UserPermission,
} from "../../types/permission";

export type PermissionUserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  status: string;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
};

type PermissionRow = {
  id: string;
  permission_key: string;
  label: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
};

type PermissionKeyRow = {
  permission_key: string;
};

type UserPermissionRow = {
  id: string;
  user_id: string;
  permission_key: string;
  scope_type: PermissionScopeType;
  scope_id: string;
  created_at: string;
};

type OptionalSchemaError = Error & {
  code?: string;
};

const ADMIN_PERMISSION_KEY = "*";

const rolePermissionDefaults: Record<string, string[]> = {
  admin: [ADMIN_PERMISSION_KEY],
  department_lead: [
    "dashboard.view",
    "wiki.view",
    "wiki.create",
    "wiki.edit",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.assign",
    "tickets.close",
    "tickets.templates.view",
    "tickets.templates.create",
    "tickets.templates.edit",
    "files.view",
    "files.upload",
    "news.view",
    "users.view",
    "organization.view",
    "activity.view",
  ],
  employee: [
    "dashboard.view",
    "wiki.view",
    "tickets.view",
    "tickets.create",
    "tickets.templates.view",
    "files.view",
    "files.upload",
    "news.view",
  ],
};

const defaultPermissions: Array<{
  permissionKey: string;
  label: string;
  description: string;
  category: string;
}> = [
  {
    permissionKey: ADMIN_PERMISSION_KEY,
    label: "Vollzugriff",
    description: "Hat Zugriff auf alle Bereiche und Aktionen.",
    category: "System",
  },
  {
    permissionKey: "dashboard.view",
    label: "Dashboard anzeigen",
    description: "Darf das Dashboard sehen.",
    category: "System",
  },
  {
    permissionKey: "admin.view",
    label: "Admin-Bereich anzeigen",
    description: "Darf das Admin-Dashboard öffnen.",
    category: "System",
  },
  {
    permissionKey: "settings.view",
    label: "Einstellungen anzeigen",
    description: "Darf Einstellungsseiten sehen.",
    category: "System",
  },
  {
    permissionKey: "settings.manage",
    label: "Systemeinstellungen verwalten",
    description: "Darf App-, System- und Moduleinstellungen ändern.",
    category: "System",
  },
  {
    permissionKey: "users.view",
    label: "Benutzer anzeigen",
    description: "Darf Benutzerlisten und Benutzerdetails sehen.",
    category: "Benutzer",
  },
  {
    permissionKey: "users.create",
    label: "Benutzer erstellen",
    description: "Darf neue Benutzer anlegen.",
    category: "Benutzer",
  },
  {
    permissionKey: "users.edit",
    label: "Benutzer bearbeiten",
    description: "Darf Benutzer bearbeiten.",
    category: "Benutzer",
  },
  {
    permissionKey: "users.delete",
    label: "Benutzer löschen",
    description: "Darf Benutzer deaktivieren oder löschen.",
    category: "Benutzer",
  },
  {
    permissionKey: "users.manage",
    label: "Benutzer verwalten",
    description: "Darf Benutzer anlegen, bearbeiten und deaktivieren.",
    category: "Benutzer",
  },
  {
    permissionKey: "users.manage_permissions",
    label: "Berechtigungen verwalten",
    description: "Darf Rollen-, Firmen-, Abteilungs- und Benutzerrechte verwalten.",
    category: "Benutzer",
  },
  {
    permissionKey: "organization.view",
    label: "Organisation anzeigen",
    description: "Darf Firmen und Abteilungen sehen.",
    category: "Organisation",
  },
  {
    permissionKey: "organization.manage",
    label: "Organisation verwalten",
    description: "Darf Firmen und Abteilungen verwalten.",
    category: "Organisation",
  },
  {
    permissionKey: "companies.manage",
    label: "Firmen verwalten",
    description: "Darf Firmen verwalten.",
    category: "Organisation",
  },
  {
    permissionKey: "departments.manage",
    label: "Abteilungen verwalten",
    description: "Darf Abteilungen verwalten.",
    category: "Organisation",
  },
  {
    permissionKey: "taxonomy.manage",
    label: "Kategorien & Tags verwalten",
    description: "Darf zentrale Taxonomie-Einträge verwalten.",
    category: "System",
  },
  {
    permissionKey: "wiki.view",
    label: "Wiki anzeigen",
    description: "Darf Wiki-Seiten lesen.",
    category: "Wiki",
  },
  {
    permissionKey: "wiki.create",
    label: "Wiki erstellen",
    description: "Darf neue Wiki-Seiten erstellen.",
    category: "Wiki",
  },
  {
    permissionKey: "wiki.edit",
    label: "Wiki bearbeiten",
    description: "Darf Wiki-Seiten bearbeiten.",
    category: "Wiki",
  },
  {
    permissionKey: "wiki.delete",
    label: "Wiki löschen",
    description: "Darf Wiki-Seiten löschen.",
    category: "Wiki",
  },
  {
    permissionKey: "tickets.view",
    label: "Tickets anzeigen",
    description: "Darf Tickets sehen.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.create",
    label: "Tickets erstellen",
    description: "Darf neue Tickets erstellen.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.edit",
    label: "Tickets bearbeiten",
    description: "Darf Tickets bearbeiten.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.assign",
    label: "Tickets zuweisen",
    description: "Darf Tickets Benutzern zuweisen.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.close",
    label: "Tickets schließen",
    description: "Darf Tickets schließen oder wieder öffnen.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.delete",
    label: "Tickets löschen",
    description: "Darf Tickets löschen.",
    category: "Tickets",
  },
  {
    permissionKey: "tickets.templates.view",
    label: "Ticket-Vorlagen anzeigen",
    description: "Darf Ticket-Vorlagen sehen und verwenden.",
    category: "Ticket-Vorlagen",
  },
  {
    permissionKey: "tickets.templates.create",
    label: "Ticket-Vorlagen erstellen",
    description: "Darf neue Ticket-Vorlagen erstellen.",
    category: "Ticket-Vorlagen",
  },
  {
    permissionKey: "tickets.templates.edit",
    label: "Ticket-Vorlagen bearbeiten",
    description: "Darf Ticket-Vorlagen bearbeiten.",
    category: "Ticket-Vorlagen",
  },
  {
    permissionKey: "tickets.templates.delete",
    label: "Ticket-Vorlagen löschen",
    description: "Darf Ticket-Vorlagen löschen.",
    category: "Ticket-Vorlagen",
  },
  {
    permissionKey: "files.view",
    label: "Dateien anzeigen",
    description: "Darf Dateien sehen und herunterladen.",
    category: "Dateien",
  },
  {
    permissionKey: "files.upload",
    label: "Dateien hochladen",
    description: "Darf Dateien hochladen.",
    category: "Dateien",
  },
  {
    permissionKey: "files.delete",
    label: "Dateien löschen",
    description: "Darf Dateien löschen.",
    category: "Dateien",
  },
  {
    permissionKey: "news.view",
    label: "News anzeigen",
    description: "Darf News lesen.",
    category: "News",
  },
  {
    permissionKey: "news.create",
    label: "News erstellen",
    description: "Darf News erstellen.",
    category: "News",
  },
  {
    permissionKey: "news.edit",
    label: "News bearbeiten",
    description: "Darf News bearbeiten.",
    category: "News",
  },
  {
    permissionKey: "news.delete",
    label: "News löschen",
    description: "Darf News löschen.",
    category: "News",
  },  {
    permissionKey: "inventory.view",
    label: "IT-Inventar anzeigen",
    description: "Darf IT-Inventar und Geräte anzeigen.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.create",
    label: "IT-Inventar erstellen",
    description: "Darf neue Geräte und Assets anlegen.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.edit",
    label: "IT-Inventar bearbeiten",
    description: "Darf Geräte- und Assetdaten bearbeiten.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.delete",
    label: "IT-Inventar löschen",
    description: "Darf Geräte und Assets löschen.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.assign",
    label: "IT-Inventar zuweisen",
    description: "Darf Geräte Benutzern, Firmen und Abteilungen zuweisen.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.hardware.manage",
    label: "Hardware verwalten",
    description: "Darf Hardwaredaten im IT-Inventar verwalten.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.software.manage",
    label: "Software verwalten",
    description: "Darf Software- und Betriebssystemdaten im IT-Inventar verwalten.",
    category: "IT-Inventar",
  },
  {
    permissionKey: "inventory.servers.manage",
    label: "Server verwalten",
    description: "Darf Server und virtuelle Systeme im IT-Inventar verwalten.",
    category: "IT-Inventar",
  },

  {
    permissionKey: "activity.view",
    label: "Aktivitäten anzeigen",
    description: "Darf das Aktivitätsprotokoll sehen.",
    category: "System",
  },
];

const legacyPermissionRenames = [
  {
    from: ["news", "manage"].join("."),
    to: "news.edit",
  },
  {
    from: ["wiki", "manage"].join("."),
    to: "wiki.edit",
  },
  {
    from: ["tickets", "manage"].join("."),
    to: "tickets.edit",
  },
  {
    from: ["tickets", "templates", "manage"].join("."),
    to: "tickets.templates.edit",
  },
  {
    from: ["files", "manage"].join("."),
    to: "files.upload",
  },
  {
    from: ["activity", "manage"].join("."),
    to: "activity.view",
  },
];

function normalizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function createPermissionCatalogId(permissionKey: string) {
  return `permission_${normalizeIdPart(permissionKey)}`;
}

function createAssignmentId(parts: string[]) {
  return parts.map(normalizeIdPart).join("_");
}

function normalizePermissionKey(value: unknown) {
  return String(value || "").trim();
}

function normalizePermissionUserRole(value: unknown) {
  const role = String(value || "").trim();

  if (role === "admin" || role === "department_lead" || role === "employee") {
    return role;
  }

  return "employee";
}

function normalizeScopeType(value: unknown): PermissionScopeType {
  if (
    value === "global" ||
    value === "company" ||
    value === "department" ||
    value === "own"
  ) {
    return value;
  }

  return "global";
}

function isIgnorableOptionalSchemaError(error: unknown) {
  const databaseError = error as OptionalSchemaError;

  return (
    databaseError.code === "42P01" ||
    databaseError.code === "42703" ||
    databaseError.message?.includes("does not exist") ||
    databaseError.message?.includes("existiert nicht")
  );
}

async function runOptionalSchemaCleanup(sql: string) {
  try {
    await query(sql);
  } catch (error) {
    if (!isIgnorableOptionalSchemaError(error)) {
      throw error;
    }
  }
}

async function normalizeLegacyRoles() {
  await runOptionalSchemaCleanup(`
    ALTER TABLE admin_users
    ALTER COLUMN role SET DEFAULT 'employee'
  `);

  await runOptionalSchemaCleanup(`
    UPDATE admin_users
    SET
      role = 'employee',
      updated_at = NOW()
    WHERE role IS NULL
       OR TRIM(role) = ''
       OR role = CONCAT('view', 'er')
  `);

  await runOptionalSchemaCleanup(`
    ALTER TABLE app_settings
    ALTER COLUMN default_user_role SET DEFAULT 'employee'
  `);

  await runOptionalSchemaCleanup(`
    UPDATE app_settings
    SET
      default_user_role = 'employee',
      updated_at = NOW()
    WHERE default_user_role IS NULL
       OR TRIM(default_user_role) = ''
       OR default_user_role = CONCAT('view', 'er')
  `);
}

function mapPermissionRow(row: PermissionRow): Permission {
  return {
    id: row.id,
    permissionKey: row.permission_key,
    label: row.label,
    description: row.description,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserPermissionRow(row: UserPermissionRow): UserPermission {
  return {
    id: row.id,
    userId: row.user_id,
    permissionKey: row.permission_key,
    scopeType: normalizeScopeType(row.scope_type),
    scopeId: row.scope_id || "",
    createdAt: row.created_at,
  };
}

export async function ensurePermissionTables() {
  await query(`
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

  await query(`
    CREATE TABLE IF NOT EXISTS company_permissions (
      id TEXT PRIMARY KEY,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(company_id, permission_key)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS department_permissions (
      id TEXT PRIMARY KEY,
      department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(department_id, permission_key)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      scope_type TEXT NOT NULL DEFAULT 'global',
      scope_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, permission_key, scope_type, scope_id)
    )
  `);

  await query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'System'
  `);

  await query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE user_permissions
    ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'global'
  `);

  await query(`
    ALTER TABLE user_permissions
    ADD COLUMN IF NOT EXISTS scope_id TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE user_permissions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await normalizeLegacyRoles();
}

async function normalizeLegacyPermissionAssignments() {
  const templateTable = await queryOne<{ exists: boolean }>(`
    SELECT to_regclass('public.role_permission_templates') IS NOT NULL AS exists
  `);

  if (!templateTable?.exists) {
    return;
  }

  for (const rename of legacyPermissionRenames) {
    await query(
      `
        UPDATE role_permission_templates
        SET
          permission_keys = array_replace(permission_keys, $1, $2),
          updated_at = NOW()
        WHERE $1 = ANY(permission_keys)
      `,
      [rename.from, rename.to],
    );
  }

  await query(`
    UPDATE role_permission_templates
    SET
      permission_keys = ARRAY(
        SELECT DISTINCT permission_key
        FROM unnest(permission_keys) AS permission_key
        WHERE permission_key IS NOT NULL
          AND permission_key <> ''
      ),
      updated_at = NOW()
  `);
}

export async function seedDefaultPermissions() {
  await ensurePermissionTables();
  await normalizeLegacyPermissionAssignments();

  for (const permission of defaultPermissions) {
    await query(
      `
        INSERT INTO permissions (
          id,
          permission_key,
          label,
          description,
          category
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (permission_key)
        DO UPDATE SET
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          updated_at = NOW()
      `,
      [
        createPermissionCatalogId(permission.permissionKey),
        permission.permissionKey,
        permission.label,
        permission.description,
        permission.category,
      ],
    );
  }
}

export async function listPermissions() {
  await seedDefaultPermissions();

  const rows = await query<PermissionRow>(`
    SELECT
      id,
      permission_key,
      label,
      description,
      category,
      created_at,
      updated_at
    FROM permissions
    ORDER BY category ASC, label ASC
  `);

  return rows.map(mapPermissionRow);
}

export async function listCompanyPermissionKeys(companyId: string) {
  await seedDefaultPermissions();

  const rows = await query<PermissionKeyRow>(
    `
      SELECT permission_key
      FROM company_permissions
      WHERE company_id = $1
      ORDER BY permission_key ASC
    `,
    [companyId],
  );

  return rows.map((row) => row.permission_key);
}

export async function saveCompanyPermissionKeys(
  companyId: string,
  permissionKeys: string[],
) {
  await seedDefaultPermissions();

  await query(
    `
      DELETE FROM company_permissions
      WHERE company_id = $1
    `,
    [companyId],
  );

  const uniquePermissionKeys = Array.from(
    new Set(permissionKeys.map(normalizePermissionKey).filter(Boolean)),
  );

  for (const permissionKey of uniquePermissionKeys) {
    await query(
      `
        INSERT INTO company_permissions (
          id,
          company_id,
          permission_key
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, permission_key)
        DO NOTHING
      `,
      [
        createAssignmentId(["company", companyId, permissionKey]),
        companyId,
        permissionKey,
      ],
    );
  }
}

export async function listDepartmentPermissionKeys(departmentId: string) {
  await seedDefaultPermissions();

  const rows = await query<PermissionKeyRow>(
    `
      SELECT permission_key
      FROM department_permissions
      WHERE department_id = $1
      ORDER BY permission_key ASC
    `,
    [departmentId],
  );

  return rows.map((row) => row.permission_key);
}

export async function saveDepartmentPermissionKeys(
  departmentId: string,
  permissionKeys: string[],
) {
  await seedDefaultPermissions();

  await query(
    `
      DELETE FROM department_permissions
      WHERE department_id = $1
    `,
    [departmentId],
  );

  const uniquePermissionKeys = Array.from(
    new Set(permissionKeys.map(normalizePermissionKey).filter(Boolean)),
  );

  for (const permissionKey of uniquePermissionKeys) {
    await query(
      `
        INSERT INTO department_permissions (
          id,
          department_id,
          permission_key
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (department_id, permission_key)
        DO NOTHING
      `,
      [
        createAssignmentId(["department", departmentId, permissionKey]),
        departmentId,
        permissionKey,
      ],
    );
  }
}

export async function listUserPermissions(userId: string) {
  await seedDefaultPermissions();

  const rows = await query<UserPermissionRow>(
    `
      SELECT
        id,
        user_id,
        permission_key,
        scope_type,
        scope_id,
        created_at
      FROM user_permissions
      WHERE user_id = $1
      ORDER BY permission_key ASC, scope_type ASC, scope_id ASC
    `,
    [userId],
  );

  return rows.map(mapUserPermissionRow);
}

export async function saveUserPermissions(
  userId: string,
  permissions: Array<{
    permissionKey?: string;
    scopeType?: string;
    scopeId?: string;
  }>,
) {
  await seedDefaultPermissions();

  await query(
    `
      DELETE FROM user_permissions
      WHERE user_id = $1
    `,
    [userId],
  );

  const normalizedPermissions = permissions
    .map((permission) => ({
      permissionKey: normalizePermissionKey(permission.permissionKey),
      scopeType: normalizeScopeType(permission.scopeType),
      scopeId: String(permission.scopeId || "").trim(),
    }))
    .filter((permission) => permission.permissionKey);

  const uniqueKeys = new Set<string>();

  for (const permission of normalizedPermissions) {
    const uniqueKey = [
      permission.permissionKey,
      permission.scopeType,
      permission.scopeId,
    ].join("::");

    if (uniqueKeys.has(uniqueKey)) {
      continue;
    }

    uniqueKeys.add(uniqueKey);

    await query(
      `
        INSERT INTO user_permissions (
          id,
          user_id,
          permission_key,
          scope_type,
          scope_id
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, permission_key, scope_type, scope_id)
        DO NOTHING
      `,
      [
        createAssignmentId([
          "user",
          userId,
          permission.permissionKey,
          permission.scopeType,
          permission.scopeId || "global",
        ]),
        userId,
        permission.permissionKey,
        permission.scopeType,
        permission.scopeId,
      ],
    );
  }
}

export async function findPermissionUserById(userId: string) {
  const row = await queryOne<PermissionUserRow>(
    `
      SELECT
        id,
        name,
        email,
        username,
        role,
        status,
        company_id,
        department_id,
        company,
        department
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  return row
    ? {
        ...row,
        role: normalizePermissionUserRole(row.role),
      }
    : null;
}

export async function findActivePermissionUserByEmail(email: string) {
  const row = await queryOne<PermissionUserRow>(
    `
      SELECT
        id,
        name,
        email,
        username,
        role,
        status,
        company_id,
        department_id,
        company,
        department
      FROM admin_users
      WHERE LOWER(email) = LOWER($1)
        AND status = 'active'
      LIMIT 1
    `,
    [email],
  );

  return row
    ? {
        ...row,
        role: normalizePermissionUserRole(row.role),
      }
    : null;
}

export async function getEffectivePermissionKeysForUser(
  user: Pick<PermissionUserRow, "id" | "role" | "company_id" | "department_id">,
) {
  await seedDefaultPermissions();

  const permissionKeys = new Set<string>();
  const normalizedRole = normalizePermissionUserRole(user.role);
  const roleDefaults = rolePermissionDefaults[normalizedRole] || [];

  roleDefaults.forEach((permissionKey) => permissionKeys.add(permissionKey));

  if (permissionKeys.has(ADMIN_PERMISSION_KEY)) {
    return [ADMIN_PERMISSION_KEY];
  }

  if (user.company_id) {
    const companyPermissions = await query<PermissionKeyRow>(
      `
        SELECT permission_key
        FROM company_permissions
        WHERE company_id = $1
      `,
      [user.company_id],
    );

    companyPermissions.forEach((permission) =>
      permissionKeys.add(permission.permission_key),
    );
  }

  if (user.department_id) {
    const departmentPermissions = await query<PermissionKeyRow>(
      `
        SELECT permission_key
        FROM department_permissions
        WHERE department_id = $1
      `,
      [user.department_id],
    );

    departmentPermissions.forEach((permission) =>
      permissionKeys.add(permission.permission_key),
    );
  }

  const userPermissions = await query<PermissionKeyRow>(
    `
      SELECT permission_key
      FROM user_permissions
      WHERE user_id = $1
    `,
    [user.id],
  );

  userPermissions.forEach((permission) =>
    permissionKeys.add(permission.permission_key),
  );

  return Array.from(permissionKeys).sort();
}

export async function getEffectivePermissionResultForUserId(
  userId: string,
): Promise<EffectivePermissionResult | null> {
  const user = await findPermissionUserById(userId);

  if (!user) {
    return null;
  }

  return {
    permissionKeys: await getEffectivePermissionKeysForUser(user),
  };
}

export function hasPermissionKey(permissionKeys: string[], permissionKey: string) {
  return (
    permissionKeys.includes(ADMIN_PERMISSION_KEY) ||
    permissionKeys.includes(permissionKey)
  );
}