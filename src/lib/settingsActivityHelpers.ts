import {
  saveActivity,
} from "./activityStorage";

import {
  getCurrentUser,
} from "./permissions";

import type {
  AppSettings,
} from "./appSettingsStorage";

type SettingsActivityAction =
  | "updated"
  | "reset";

type FlexibleSettings =
  AppSettings & {
    appVersion?: string;
    version?: string;
    theme?: string;
    sidebarPosition?: string;
    darkMode?: boolean;
  };

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

function getSettingsActivityTitle(
  action: SettingsActivityAction
) {
  if (action === "updated") {
    return "Einstellungen aktualisiert";
  }

  if (action === "reset") {
    return "Einstellungen zurückgesetzt";
  }

  return "Einstellungen";
}

function getSettingsVersion(
  settings: FlexibleSettings
) {
  return (
    settings.appVersion ||
    settings.version ||
    ""
  );
}

export function saveSettingsActivity(
  action: SettingsActivityAction,
  settings: AppSettings,
  description?: string
) {
  const userContext =
    getUserContext();

  const flexibleSettings =
    settings as FlexibleSettings;

  saveActivity({
    type:
      "settings_updated",

    title:
      getSettingsActivityTitle(
        action
      ),

    description:
      description ||
      `App-Einstellungen wurden geändert: ${flexibleSettings.appName}`,

    entityId:
      "app-settings",

    entityType:
      "settings",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      userContext.companyId,

    departmentId:
      userContext.departmentId,

    company:
      userContext.company,

    department:
      userContext.department,

    metadata:
      {
        appName:
          flexibleSettings.appName,

        version:
          getSettingsVersion(
            flexibleSettings
          ),

        theme:
          flexibleSettings.theme ||
          "",

        sidebarPosition:
          flexibleSettings.sidebarPosition ||
          "",

        darkMode:
          flexibleSettings.darkMode ?? null,

        updatedAction:
          action,
      },
  });
}

export function saveSettingsUpdatedActivity(
  settings: AppSettings
) {
  saveSettingsActivity(
    "updated",
    settings,
    "App-Einstellungen wurden aktualisiert."
  );
}

export function saveSettingsResetActivity(
  settings: AppSettings
) {
  saveSettingsActivity(
    "reset",
    settings,
    "App-Einstellungen wurden zurückgesetzt."
  );
}