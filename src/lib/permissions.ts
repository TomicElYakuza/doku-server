import {
  getUser,
} from "./userStorage";

export function getRole() {
  const user = getUser();

  return user?.role || "viewer";
}

export function isViewer() {
  return getRole() === "viewer";
}

export function isEditor() {
  return getRole() === "editor";
}

export function isAdmin() {
  return getRole() === "admin";
}

export function canView() {
  return true;
}

export function canComment() {
  const role = getRole();

  return (
    role === "viewer" ||
    role === "editor" ||
    role === "admin"
  );
}

export function canCreate() {
  const role = getRole();

  return (
    role === "editor" ||
    role === "admin"
  );
}

export function canEdit() {
  const role = getRole();

  return (
    role === "editor" ||
    role === "admin"
  );
}

export function canDelete() {
  return isAdmin();
}

export function canManageTrash() {
  return isAdmin();
}

export function canRestore() {
  return isAdmin();
}

export function canDeleteForever() {
  return isAdmin();
}

export function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "editor") {
    return "Editor";
  }

  return "Viewer";
}

export function getRoleDescription(role?: string) {
  if (role === "admin") {
    return "Kann Dokumente erstellen, bearbeiten, löschen und den Papierkorb verwalten.";
  }

  if (role === "editor") {
    return "Kann Dokumente erstellen und bearbeiten.";
  }

  return "Kann Dokumente lesen und kommentieren.";
}