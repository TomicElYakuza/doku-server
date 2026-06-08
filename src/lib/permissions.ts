import { getCachedCurrentUser } from "./currentUserRepository";
import type { User, UserRole } from "../types/user";

export type PermissionKey =
  | "*"
  | "dashboard.view"
  | "news.view"
  | "news.create"
  | "news.edit"
  | "news.delete"
  | "wiki.view"
  | "wiki.create"
  | "wiki.edit"
  | "wiki.delete"
  | "tickets.view"
  | "tickets.create"
  | "tickets.edit"
  | "tickets.assign"
  | "tickets.close"
  | "tickets.delete"
  | "tickets.templates.view"
  | "tickets.templates.create"
  | "tickets.templates.edit"
  | "tickets.templates.delete"
  | "files.view"
  | "files.upload"
  | "files.delete"
  | "activity.view"
  | "settings.view"
  | "settings.manage"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.manage_permissions"
  | "organization.view"
  | "organization.manage"
  | "companies.manage"
  | "departments.manage"
  | "admin.view"
  | "taxonomy.manage";

export type PermissionContext = {
  companyId?: string;
  departmentId?: string;
  ownerId?: string;
};

export function getCurrentUser() {
  return getCachedCurrentUser();
}

export function getCurrentUserRole(): UserRole {
  return getCachedCurrentUser()?.role || "employee";
}

export function isAdmin(user: User | null = getCachedCurrentUser()) {
  return user?.role === "admin";
}

export function isDepartmentLead(user: User | null = getCachedCurrentUser()) {
  return user?.role === "department_lead";
}

export function isEmployee(user: User | null = getCachedCurrentUser()) {
  return user?.role === "employee";
}

export function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

export function getRoleDescription(role?: string) {
  if (role === "admin") {
    return "Hat vollständigen Zugriff auf alle Bereiche, Einstellungen und Admin-Funktionen.";
  }

  if (role === "department_lead") {
    return "Kann die eigene Abteilung verwalten und Inhalte der zugeordneten Abteilung bearbeiten.";
  }

  return "Hat Grundberechtigungen und erhält zusätzliche Rechte über Firma, Abteilung oder Einzelberechtigungen.";
}

export function canViewAdmin() {
  return isAdmin();
}

export function canViewActivity() {
  const role = getCurrentUserRole();

  return role === "admin" || role === "department_lead";
}

export function canManageSettings() {
  return isAdmin();
}

export function canManageUsers() {
  return isAdmin();
}

export function canManagePermissions() {
  return isAdmin();
}

export function canManageOrganization() {
  return isAdmin();
}

export function canManageCompanies() {
  return isAdmin();
}

export function canManageDepartments() {
  return isAdmin();
}

export function canManageSystem() {
  return isAdmin();
}

export function canCreate() {
  const role = getCurrentUserRole();

  return role === "admin" || role === "department_lead";
}

export function canEdit() {
  const role = getCurrentUserRole();

  return role === "admin" || role === "department_lead";
}

export function canDelete() {
  return isAdmin();
}

export function canViewCompanyScope(
  companyId?: string,
  user: User | null = getCachedCurrentUser(),
) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (!companyId) {
    return true;
  }

  return user.companyId === companyId;
}

export function canViewDepartmentScope(
  departmentId?: string,
  user: User | null = getCachedCurrentUser(),
) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (!departmentId) {
    return true;
  }

  return user.departmentId === departmentId;
}

export function canEditDepartmentScope(
  departmentId?: string,
  user: User | null = getCachedCurrentUser(),
) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (user.role === "department_lead") {
    return !departmentId || user.departmentId === departmentId;
  }

  return false;
}

export function getRoleHierarchyValue(role?: string) {
  if (role === "admin") {
    return 3;
  }

  if (role === "department_lead") {
    return 2;
  }

  return 1;
}

export function roleIsAtLeast(
  currentRole: string | undefined,
  requiredRole: UserRole,
) {
  return (
    getRoleHierarchyValue(currentRole) >= getRoleHierarchyValue(requiredRole)
  );
}