import { cookies } from "next/headers";

import {
  findActivePermissionUserByEmail,
  getEffectivePermissionKeysForUser,
  hasPermissionKey,
} from "./database/permissionStore";

const AUTH_COOKIE_NAME = "dms_user_email";

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

type PermissionUserRow = {
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

function mapServerUser(row: PermissionUserRow): ServerUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username || "",
    role: row.role,
    status: row.status,
    companyId: row.company_id || "",
    departmentId: row.department_id || "",
    company: row.company || "Intern",
    department: row.department || "",
  };
}

function mapServerUserToPermissionUser(user: ServerUser): PermissionUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    company_id: user.companyId || null,
    department_id: user.departmentId || null,
    company: user.company || null,
    department: user.department || null,
  };
}

export async function getCurrentServerUser() {
  const cookieStore = await cookies();
  const rawEmail = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!rawEmail) {
    return null;
  }

  const email = decodeURIComponent(rawEmail);
  const row = await findActivePermissionUserByEmail(email);

  if (!row) {
    return null;
  }

  return mapServerUser(row);
}

export async function getEffectiveServerPermissionKeys(user: ServerUser) {
  return getEffectivePermissionKeysForUser(mapServerUserToPermissionUser(user));
}

export async function hasServerPermission(permissionKey: string) {
  const user = await getCurrentServerUser();

  if (!user) {
    return false;
  }

  const permissionKeys = await getEffectiveServerPermissionKeys(user);

  return hasPermissionKey(permissionKeys, permissionKey);
}

export async function hasAnyServerPermission(permissionKeys: string[]) {
  const user = await getCurrentServerUser();

  if (!user) {
    return false;
  }

  const effectivePermissionKeys = await getEffectiveServerPermissionKeys(user);

  return permissionKeys.some((permissionKey) =>
    hasPermissionKey(effectivePermissionKeys, permissionKey),
  );
}

export async function requireServerPermission(permissionKey: string) {
  const allowed = await hasServerPermission(permissionKey);

  if (!allowed) {
    throw new Error("Keine Berechtigung.");
  }
}

export async function requireAnyServerPermission(permissionKeys: string[]) {
  const allowed = await hasAnyServerPermission(permissionKeys);

  if (!allowed) {
    throw new Error("Keine Berechtigung.");
  }
}

export function isPermissionError(error: unknown) {
  return error instanceof Error && error.message === "Keine Berechtigung.";
}