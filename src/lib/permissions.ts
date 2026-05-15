import { getUser } from "./userStorage";

export function getRole() {
  const user = getUser();

  return user?.role || "viewer";
}

export function canCreate() {
  const role = getRole();

  return role === "admin" || role === "editor";
}

export function canEdit() {
  const role = getRole();

  return role === "admin" || role === "editor";
}

export function canDelete() {
  const role = getRole();

  return role === "admin";
}

export function canComment() {
  return true;
}

export function isAdmin() {
  return getRole() === "admin";
}