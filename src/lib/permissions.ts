import {
  getUser,
  getUserRole,
} from "./userStorage";

export type Permission =
  | "dashboard.view"
  | "wiki.view"
  | "wiki.create"
  | "wiki.edit"
  | "wiki.delete"
  | "wiki.restore"
  | "wiki.comment"
  | "tickets.view"
  | "tickets.create"
  | "tickets.edit"
  | "tickets.delete"
  | "tickets.comment"
  | "tickets.templates.view"
  | "tickets.templates.create"
  | "tickets.templates.edit"
  | "tickets.templates.delete"
  | "activity.view"
  | "settings.view"
  | "settings.manage"
  | "admin.view"
  | "admin.manageUsers"
  | "admin.manageSystem";

export type RolePermissions = {
  role: "admin" | "editor" | "viewer";
  label: string;
  permissions: Permission[];
};

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: "admin",
    label: "Administrator",
    permissions: [
      "dashboard.view",

      "wiki.view",
      "wiki.create",
      "wiki.edit",
      "wiki.delete",
      "wiki.restore",
      "wiki.comment",

      "tickets.view",
      "tickets.create",
      "tickets.edit",
      "tickets.delete",
      "tickets.comment",

      "tickets.templates.view",
      "tickets.templates.create",
      "tickets.templates.edit",
      "tickets.templates.delete",

      "activity.view",

      "settings.view",
      "settings.manage",

      "admin.view",
      "admin.manageUsers",
      "admin.manageSystem",
    ],
  },

  {
    role: "editor",
    label: "Bearbeiter",
    permissions: [
      "dashboard.view",

      "wiki.view",
      "wiki.create",
      "wiki.edit",
      "wiki.comment",

      "tickets.view",
      "tickets.create",
      "tickets.edit",
      "tickets.comment",

      "tickets.templates.view",
      "tickets.templates.create",
      "tickets.templates.edit",

      "activity.view",

      "settings.view",
    ],
  },

  {
    role: "viewer",
    label: "Leser",
    permissions: [
      "dashboard.view",

      "wiki.view",

      "tickets.view",

      "tickets.templates.view",

      "activity.view",

      "settings.view",
    ],
  },
];

export function getCurrentRole() {
  return getUserRole();
}

export function getCurrentUser() {
  return getUser();
}

export function getRoleLabel(
  role: string
) {
  const found =
    ROLE_PERMISSIONS.find(
      (item) =>
        item.role === role
    );

  return (
    found?.label ||
    "Unbekannt"
  );
}

export function getPermissionsForRole(
  role: string
): Permission[] {
  const found =
    ROLE_PERMISSIONS.find(
      (item) =>
        item.role === role
    );

  return (
    found?.permissions ||
    []
  );
}

export function hasPermission(
  permission: Permission
) {
  const role =
    getCurrentRole();

  const permissions =
    getPermissionsForRole(
      role
    );

  return permissions.includes(
    permission
  );
}

export function hasAnyPermission(
  permissions: Permission[]
) {
  return permissions.some(
    (permission) =>
      hasPermission(
        permission
      )
  );
}

export function hasAllPermissions(
  permissions: Permission[]
) {
  return permissions.every(
    (permission) =>
      hasPermission(
        permission
      )
  );
}

export function canViewDashboard() {
  return hasPermission(
    "dashboard.view"
  );
}

export function canViewWiki() {
  return hasPermission(
    "wiki.view"
  );
}

export function canCreateWiki() {
  return hasPermission(
    "wiki.create"
  );
}

export function canEditWiki() {
  return hasPermission(
    "wiki.edit"
  );
}

export function canDeleteWiki() {
  return hasPermission(
    "wiki.delete"
  );
}

export function canRestoreWiki() {
  return hasPermission(
    "wiki.restore"
  );
}

export function canCommentWiki() {
  return hasPermission(
    "wiki.comment"
  );
}

export function canViewTickets() {
  return hasPermission(
    "tickets.view"
  );
}

export function canCreateTickets() {
  return hasPermission(
    "tickets.create"
  );
}

export function canEditTickets() {
  return hasPermission(
    "tickets.edit"
  );
}

export function canDeleteTickets() {
  return hasPermission(
    "tickets.delete"
  );
}

export function canCommentTickets() {
  return hasPermission(
    "tickets.comment"
  );
}

export function canViewTicketTemplates() {
  return hasPermission(
    "tickets.templates.view"
  );
}

export function canCreateTicketTemplates() {
  return hasPermission(
    "tickets.templates.create"
  );
}

export function canEditTicketTemplates() {
  return hasPermission(
    "tickets.templates.edit"
  );
}

export function canDeleteTicketTemplates() {
  return hasPermission(
    "tickets.templates.delete"
  );
}

export function canViewActivity() {
  return hasPermission(
    "activity.view"
  );
}

export function canViewSettings() {
  return hasPermission(
    "settings.view"
  );
}

export function canManageSettings() {
  return hasPermission(
    "settings.manage"
  );
}

export function canViewAdmin() {
  return hasPermission(
    "admin.view"
  );
}

export function canManageUsers() {
  return hasPermission(
    "admin.manageUsers"
  );
}

export function canManageSystem() {
  return hasPermission(
    "admin.manageSystem"
  );
}

/**
 * Alte Helper / Aliase.
 * Diese bleiben drinnen, damit vorhandene Komponenten
 * wie Comments.tsx, Wiki-Seiten, Ticket-Seiten usw.
 * nicht wegen fehlender Exports brechen.
 */

export function canCreate() {
  return hasAnyPermission([
    "wiki.create",
    "tickets.create",
    "tickets.templates.create",
  ]);
}

export function canEdit() {
  return hasAnyPermission([
    "wiki.edit",
    "tickets.edit",
    "tickets.templates.edit",
  ]);
}

export function canDelete() {
  return hasAnyPermission([
    "wiki.delete",
    "tickets.delete",
    "tickets.templates.delete",
  ]);
}

export function canComment() {
  return hasAnyPermission([
    "wiki.comment",
    "tickets.comment",
  ]);
}

export function canRestore() {
  return hasPermission(
    "wiki.restore"
  );
}

export function canView() {
  return hasAnyPermission([
    "dashboard.view",
    "wiki.view",
    "tickets.view",
  ]);
}

export function canManage() {
  return hasAnyPermission([
    "settings.manage",
    "admin.manageSystem",
    "admin.manageUsers",
  ]);
}

export function isAdmin() {
  return (
    getCurrentRole() ===
    "admin"
  );
}

export function isEditor() {
  const role =
    getCurrentRole();

  return (
    role === "admin" ||
    role === "editor"
  );
}

export function isViewer() {
  return (
    getCurrentRole() ===
    "viewer"
  );
}