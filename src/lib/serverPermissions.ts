import {
  cookies,
} from "next/headers";

import {
  query,
  queryOne,
} from "./database/db";

const AUTH_COOKIE_NAME =
  "dms_user_email";

const ADMIN_PERMISSION_KEY =
  "*";

export type ServerUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
};

type AdminUserPermissionRow = {
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

type PermissionKeyRow = {
  permission_key: string;
};

function mapServerUser(
  row: AdminUserPermissionRow
): ServerUser {
  return {
    id:
      row.id,

    name:
      row.name,

    email:
      row.email,

    username:
      row.username ||
      "",

    role:
      row.role,

    status:
      row.status,

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company ||
      "Intern",

    department:
      row.department ||
      "",
  };
}

export async function getCurrentServerUser() {
  const cookieStore =
    await cookies();

  const rawEmail =
    cookieStore.get(
      AUTH_COOKIE_NAME
    )?.value;

  if (!rawEmail) {
    return null;
  }

  const email =
    decodeURIComponent(
      rawEmail
    );

  const row =
    await queryOne<AdminUserPermissionRow>(
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
      [
        email,
      ]
    );

  if (!row) {
    return null;
  }

  return mapServerUser(
    row
  );
}

export async function getEffectiveServerPermissionKeys(
  user: ServerUser
) {
  if (user.role === "admin") {
    return [
      ADMIN_PERMISSION_KEY,
    ];
  }

  const permissionKeys =
    new Set<string>();

  if (user.companyId) {
    const companyPermissions =
      await query<PermissionKeyRow>(
        `
        SELECT
          permission_key
        FROM company_permissions
        WHERE company_id = $1
        `,
        [
          user.companyId,
        ]
      );

    companyPermissions.forEach(
      (permission) =>
        permissionKeys.add(
          permission.permission_key
        )
    );
  }

  if (user.departmentId) {
    const departmentPermissions =
      await query<PermissionKeyRow>(
        `
        SELECT
          permission_key
        FROM department_permissions
        WHERE department_id = $1
        `,
        [
          user.departmentId,
        ]
      );

    departmentPermissions.forEach(
      (permission) =>
        permissionKeys.add(
          permission.permission_key
        )
    );
  }

  const userPermissions =
    await query<PermissionKeyRow>(
      `
      SELECT
        permission_key
      FROM user_permissions
      WHERE user_id = $1
      `,
      [
        user.id,
      ]
    );

  userPermissions.forEach(
    (permission) =>
      permissionKeys.add(
        permission.permission_key
      )
  );

  if (user.role === "department_lead") {
    [
      "wiki.view",
      "wiki.create",
      "wiki.edit",
      "tickets.view",
      "tickets.create",
      "tickets.edit",
      "tickets.assign",
      "tickets.close",
      "files.view",
      "files.upload",
      "news.view",
      "users.view",
      "organization.view",
    ].forEach(
      (permissionKey) =>
        permissionKeys.add(
          permissionKey
        )
    );
  }

  if (user.role === "employee") {
    [
      "wiki.view",
      "tickets.view",
      "tickets.create",
      "files.view",
      "files.upload",
      "news.view",
    ].forEach(
      (permissionKey) =>
        permissionKeys.add(
          permissionKey
        )
    );
  }

  return Array.from(
    permissionKeys
  ).sort();
}

export async function hasServerPermission(
  permissionKey: string
) {
  const user =
    await getCurrentServerUser();

  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const permissionKeys =
    await getEffectiveServerPermissionKeys(
      user
    );

  return (
    permissionKeys.includes(
      ADMIN_PERMISSION_KEY
    ) ||
    permissionKeys.includes(
      permissionKey
    )
  );
}

export async function hasAnyServerPermission(
  permissionKeys: string[]
) {
  const user =
    await getCurrentServerUser();

  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const effectivePermissionKeys =
    await getEffectiveServerPermissionKeys(
      user
    );

  return permissionKeys.some(
    (permissionKey) =>
      effectivePermissionKeys.includes(
        ADMIN_PERMISSION_KEY
      ) ||
      effectivePermissionKeys.includes(
        permissionKey
      )
  );
}

export async function requireServerPermission(
  permissionKey: string
) {
  const allowed =
    await hasServerPermission(
      permissionKey
    );

  if (!allowed) {
    throw new Error(
      "Keine Berechtigung."
    );
  }
}

export async function requireAnyServerPermission(
  permissionKeys: string[]
) {
  const allowed =
    await hasAnyServerPermission(
      permissionKeys
    );

  if (!allowed) {
    throw new Error(
      "Keine Berechtigung."
    );
  }
}

export function isPermissionError(
  error: unknown
) {
  return (
    error instanceof Error &&
    error.message === "Keine Berechtigung."
  );
}


