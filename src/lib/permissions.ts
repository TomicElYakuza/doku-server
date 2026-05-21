import {
  getCachedCurrentUser,
  getCachedCurrentUserRole,
} from "./currentUserRepository";

import type {
  UserRole,
} from "../types/user";

export function getCurrentUser() {
  return getCachedCurrentUser();
}

export function getCurrentUserRole(): UserRole {
  return getCachedCurrentUserRole();
}

export function getRoleLabel(
  role: UserRole | string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Leser";
}

export function isAdmin() {
  return getCurrentUserRole() === "admin";
}

export function isEditor() {
  return getCurrentUserRole() === "editor";
}

export function isViewer() {
  return getCurrentUserRole() === "viewer";
}

export function canViewAdmin() {
  return isAdmin();
}

export function canManageSystem() {
  return isAdmin();
}

export function canCreate() {
  const role =
    getCurrentUserRole();

  return (
    role === "admin" ||
    role === "editor"
  );
}

export function canEdit() {
  const role =
    getCurrentUserRole();

  return (
    role === "admin" ||
    role === "editor"
  );
}

export function canDelete() {
  return isAdmin();
}

export function canViewActivity() {
  const role =
    getCurrentUserRole();

  return (
    role === "admin" ||
    role === "editor"
  );
}

export function canManageUsers() {
  return isAdmin();
}

export function canManageCompanies() {
  return isAdmin();
}

export function canManageSettings() {
  return isAdmin();
}