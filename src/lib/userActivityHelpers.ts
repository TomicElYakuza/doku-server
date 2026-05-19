import {
  saveActivity,
} from "./activityStorage";

import type {
  AdminUser,
} from "./adminUserStorage";

import {
  getCurrentUser,
} from "./permissions";

type UserActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "login";

function getUserContext() {
  const user =
    getCurrentUser();

  return {
    userName:
      user?.name ||
      "Unbekannt",

    userEmail:
      user?.email ||
      "",

    user:
      user?.name ||
      "Unbekannt",

    companyId:
      user?.companyId ||
      "",

    departmentId:
      user?.departmentId ||
      "",

    company:
      user?.company ||
      "Intern",

    department:
      user?.department ||
      "Allgemein",
  };
}

function getUserActivityType(
  action: UserActivityAction
) {
  if (action === "created") {
    return "user_created";
  }

  if (action === "updated") {
    return "user_updated";
  }

  if (action === "deleted") {
    return "user_deleted";
  }

  if (action === "login") {
    return "user_updated";
  }

  return "system";
}

function getUserActivityTitle(
  action: UserActivityAction,
  adminUser: AdminUser
) {
  if (action === "created") {
    return `Benutzer erstellt: ${adminUser.name}`;
  }

  if (action === "updated") {
    return `Benutzer aktualisiert: ${adminUser.name}`;
  }

  if (action === "deleted") {
    return `Benutzer gelöscht: ${adminUser.name}`;
  }

  if (action === "login") {
    return `Benutzer gesetzt: ${adminUser.name}`;
  }

  return adminUser.name;
}

export function saveUserActivity(
  action: UserActivityAction,
  adminUser: AdminUser,
  description?: string
) {
  const userContext =
    getUserContext();

  saveActivity({
    type:
      getUserActivityType(
        action
      ),

    title:
      getUserActivityTitle(
        action,
        adminUser
      ),

    description:
      description ||
      `${adminUser.name} (${adminUser.email})`,

    entityId:
      adminUser.id,

    entityType:
      "user",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      adminUser.companyId ||
      userContext.companyId,

    departmentId:
      adminUser.departmentId ||
      userContext.departmentId,

    company:
      adminUser.company ||
      userContext.company,

    department:
      adminUser.department ||
      userContext.department,

    metadata:
      {
        userId:
          adminUser.id,

        name:
          adminUser.name,

        email:
          adminUser.email,

        role:
          adminUser.role,

        status:
          adminUser.status,
      },
  });
}

export function saveUserCreatedActivity(
  adminUser: AdminUser
) {
  saveUserActivity(
    "created",
    adminUser,
    "Ein neuer Benutzer wurde erstellt."
  );
}

export function saveUserUpdatedActivity(
  adminUser: AdminUser
) {
  saveUserActivity(
    "updated",
    adminUser,
    "Ein Benutzer wurde aktualisiert."
  );
}

export function saveUserDeletedActivity(
  adminUser: AdminUser
) {
  saveUserActivity(
    "deleted",
    adminUser,
    "Ein Benutzer wurde gelöscht."
  );
}

export function saveUserLoginActivity(
  adminUser: AdminUser
) {
  saveUserActivity(
    "login",
    adminUser,
    "Ein Demo-Benutzer wurde als aktueller Benutzer gesetzt."
  );
}