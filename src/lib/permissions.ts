import {
  getCachedCurrentUser,
} from "./currentUserRepository";

import type {
  UserRole,
} from "../types/user";

type AppRole =
  | UserRole
  | "admin"
  | "department_lead"
  | "employee";

function getCurrentUserRole(): AppRole {
  const user =
    getCachedCurrentUser();

  return (
    user?.role ||
    "employee"
  ) as AppRole;
}

function isAdminRole(
  role: AppRole
) {
  return role === "admin";
}

function isDepartmentLeadRole(
  role: AppRole
) {
  return role === "department_lead";
}

function isEmployeeRole(
  role: AppRole
) {
  return role === "employee";
}

function isAdminOrDepartmentLead(
  role: AppRole
) {
  return (
    isAdminRole(
      role
    ) ||
    isDepartmentLeadRole(
      role
    )
  );
}

export function isAdmin() {
  return isAdminRole(
    getCurrentUserRole()
  );
}

export function isEditor() {
  return isDepartmentLeadRole(
    getCurrentUserRole()
  );
}

export function isViewer() {
  return isEmployeeRole(
    getCurrentUserRole()
  );
}

export function canView() {
  return true;
}

export function canCreate() {
  const role =
    getCurrentUserRole();

  return isAdminOrDepartmentLead(
    role
  );
}

export function canEdit() {
  const role =
    getCurrentUserRole();

  return isAdminOrDepartmentLead(
    role
  );
}

export function canDelete() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canViewAdmin() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageUsers() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageCompanies() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageSettings() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageSystem() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageNews() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canViewActivity() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageActivity() {
  const role =
    getCurrentUserRole();

  return isAdminRole(
    role
  );
}

export function canManageFiles() {
  const role =
    getCurrentUserRole();

  return isAdminOrDepartmentLead(
    role
  );
}

export function canUploadFiles() {
  const role =
    getCurrentUserRole();

  return (
    isAdminRole(
      role
    ) ||
    isDepartmentLeadRole(
      role
    ) ||
    isEmployeeRole(
      role
    )
  );
}

export function canManageTickets() {
  const role =
    getCurrentUserRole();

  return isAdminOrDepartmentLead(
    role
  );
}

export function canManageWiki() {
  const role =
    getCurrentUserRole();

  return isAdminOrDepartmentLead(
    role
  );
}

export function hasRole(
  roles: UserRole[]
) {
  return roles.includes(
    getCurrentUserRole() as UserRole
  );
}

export function getCurrentRole() {
  return getCurrentUserRole();
}