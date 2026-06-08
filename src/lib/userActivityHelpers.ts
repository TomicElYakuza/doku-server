import {
  activityRepository,
} from "./activityRepository";

import type {
  AdminUser,
} from "../types/user";

function createUserActivity(
  user: AdminUser,
  type: string,
  title: string,
  description: string
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "adminUser",

      entityId:
        user.id,

      userName:
        user.name ||
        "System",

      userEmail:
        user.email ||
        "",

      user:
        user.name ||
        user.email ||
        "System",

      companyId:
        user.companyId ||
        "",

      departmentId:
        user.departmentId ||
        "",

      company:
        user.company ||
        "Intern",

      department:
        user.department ||
        "",

      metadata: {
        userId:
          user.id,

        userName:
          user.name,

        userEmail:
          user.email,

        role:
          user.role,

        status:
          user.status,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Benutzer-Aktivität konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveUserCreatedActivity(
  user: AdminUser
) {
  createUserActivity(
    user,
    "created",
    "Benutzer erstellt",
    `Benutzer "${user.name}" wurde erstellt.`
  );
}

export function saveUserUpdatedActivity(
  user: AdminUser
) {
  createUserActivity(
    user,
    "edited",
    "Benutzer bearbeitet",
    `Benutzer "${user.name}" wurde bearbeitet.`
  );
}

export function saveUserDeletedActivity(
  user: AdminUser
) {
  createUserActivity(
    user,
    "deleted",
    "Benutzer gelöscht",
    `Benutzer "${user.name}" wurde gelöscht.`
  );
}

export function saveUserLoginActivity(
  user: AdminUser
) {
  createUserActivity(
    user,
    "login",
    "Benutzer angemeldet",
    `Benutzer "${user.name}" hat sich angemeldet.`
  );
}

export function saveUserLogoutActivity(
  user: AdminUser
) {
  createUserActivity(
    user,
    "logout",
    "Benutzer abgemeldet",
    `Benutzer "${user.name}" hat sich abgemeldet.`
  );
}

export function saveUserStatusChangedActivity(
  user: AdminUser,
  oldStatus: string,
  newStatus: string
) {
  createUserActivity(
    user,
    "edited",
    "Benutzerstatus geändert",
    `Benutzer "${user.name}" wurde von "${oldStatus}" auf "${newStatus}" geändert.`
  );
}

export function saveUserRoleChangedActivity(
  user: AdminUser,
  oldRole: string,
  newRole: string
) {
  createUserActivity(
    user,
    "edited",
    "Benutzerrolle geändert",
    `Benutzer "${user.name}" wurde von "${oldRole}" auf "${newRole}" geändert.`
  );
}


